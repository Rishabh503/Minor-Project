const fs = require("node:fs");
const text = fs.readFileSync(process.argv[2], "utf16le").replace(/^\uFEFF/, "");
const begin = text.toUpperCase().indexOf("TABLE OF CONTENTS");
console.log(`chars=${text.length}; toc=${begin}`);
console.log(text.slice(Math.max(0, begin), Math.max(0, begin) + 14500));
