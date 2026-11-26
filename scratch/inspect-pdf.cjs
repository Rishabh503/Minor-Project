const fs = require("node:fs");
const zlib = require("node:zlib");

const input = process.argv[2];
const bytes = fs.readFileSync(input);
const raw = bytes.toString("latin1");
const objects = new Map();
function decodeUtf16Hex(hex) {
  const value = Buffer.from(hex, "hex");
  for (let i = 0; i + 1 < value.length; i += 2) [value[i], value[i + 1]] = [value[i + 1], value[i]];
  return value.toString("utf16le");
}
const objectPattern = /(?:^|\n)(\d+)\s+(\d+)\s+obj\b/g;
let match;
while ((match = objectPattern.exec(raw))) {
  const start = objectPattern.lastIndex;
  const end = raw.indexOf("endobj", start);
  if (end < 0) break;
  objects.set(Number(match[1]), Buffer.from(raw.slice(start, end), "latin1"));
  objectPattern.lastIndex = end + 6;
}

function streamOf(object) {
  const string = object.toString("latin1");
  const marker = string.indexOf("stream");
  if (marker < 0) return null;
  let start = marker + 6;
  if (string[start] === "\r" && string[start + 1] === "\n") start += 2;
  else if (string[start] === "\n" || string[start] === "\r") start += 1;
  const end = string.lastIndexOf("endstream");
  if (end < start) return null;
  const data = object.subarray(start, end);
  if (/\/FlateDecode/.test(string.slice(0, marker))) {
    try { return zlib.inflateSync(data); } catch { try { return zlib.inflateRawSync(data); } catch { return null; } }
  }
  return data;
}

const unicodeMaps = new Map();
for (const [id, object] of objects) {
  const decoded = streamOf(object);
  if (!decoded) continue;
  const cmap = decoded.toString("latin1");
  if (!cmap.includes("begincmap")) continue;
  const map = new Map();
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of block[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>/gi)) {
      const src = pair[1].toUpperCase();
      const dst = decodeUtf16Hex(pair[2]);
      map.set(src, dst);
    }
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const range of block[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>\s*(?:<([\da-f]+)>|\[([^\]]+)\])/gi)) {
      const lo = parseInt(range[1], 16), hi = parseInt(range[2], 16);
      const width = range[1].length;
      if (range[4]) {
        const values = [...range[4].matchAll(/<([\da-f]+)>/gi)].map(x => decodeUtf16Hex(x[1]));
        for (let i = 0; i <= hi - lo && i < values.length; i++) map.set((lo + i).toString(16).padStart(width, "0").toUpperCase(), values[i]);
      } else {
        const base = parseInt(range[3], 16);
        for (let code = lo; code <= hi && code - lo < 10000; code++) {
          const hex = (base + code - lo).toString(16).padStart(Math.max(4, range[3].length), "0");
          map.set(code.toString(16).padStart(width, "0").toUpperCase(), decodeUtf16Hex(hex));
        }
      }
    }
  }
  unicodeMaps.set(id, map);
}

const fontToUnicode = new Map();
for (const [id, object] of objects) {
  const text = object.toString("latin1");
  const ref = text.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
  if (ref) fontToUnicode.set(id, unicodeMaps.get(Number(ref[1])) || new Map());
}
const fontResources = new Map();
for (const object of objects.values()) {
  const text = object.toString("latin1");
  for (const entry of text.matchAll(/\/(F\d+)\s+(\d+)\s+\d+\s+R/g)) {
    if (fontToUnicode.has(Number(entry[2]))) fontResources.set(entry[1], fontToUnicode.get(Number(entry[2])));
  }
}

const output = [];
for (const object of objects.values()) {
  const decoded = streamOf(object);
  if (!decoded) continue;
  const content = decoded.toString("latin1");
  if (!/\bBT\b/.test(content)) continue;
  let currentFont = null;
  const tokens = /\/(F\d+)\s+[\d.]+\s+Tf|<([\da-f]+)>\s*Tj|\[((?:[^\]]|\](?!\s*TJ))*)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  for (const item of content.matchAll(tokens)) {
    if (item[1]) { currentFont = item[1]; continue; }
    const cmap = fontResources.get(currentFont) || new Map();
    if (item[2]) {
      const value = item[2].toUpperCase();
      let text = "";
      for (let i = 0; i < value.length; ) {
        const lengths = [...cmap.keys()].map(key => key.length).filter(Boolean).sort((a,b)=>b-a);
        let found = false;
        for (const len of lengths) {
          const code = value.slice(i, i + len);
          if (cmap.has(code)) { text += cmap.get(code); i += len; found = true; break; }
        }
        if (!found) { text += "�"; i += Math.min(...(lengths.length ? lengths : [2])); }
      }
      output.push(text);
    } else if (item[3]) {
      for (const part of item[3].matchAll(/<([\da-f]+)>|\(((?:\\.|[^\\)])*)\)/gi)) {
        if (part[1]) {
          const value = part[1].toUpperCase();
          const lengths = [...cmap.keys()].map(key => key.length).filter(Boolean).sort((a,b)=>b-a);
          let text = "";
          for (let i = 0; i < value.length; ) {
            const len = lengths.find(n => cmap.has(value.slice(i, i+n)));
            if (len) { text += cmap.get(value.slice(i, i+len)); i += len; }
            else { text += "�"; i += Math.min(...(lengths.length ? lengths : [2])); }
          }
          output.push(text);
        } else if (part[2]) output.push(part[2]);
      }
    } else if (item[4]) output.push(item[4].replace(/\\([()\\])/g, "$1"));
  }
}

console.log(`Objects: ${objects.size}; ToUnicode maps: ${unicodeMaps.size}; text font resources: ${fontResources.size}`);
console.log(output.join("").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ").replace(/\s+/g, " "));
