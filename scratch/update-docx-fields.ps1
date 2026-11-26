# Open the report .docx in Word, refresh the TOC / list fields, save, and export a preview PDF.
param([string]$Docx, [string]$Pdf)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($Docx)
    foreach ($id in -20, -21) {   # TOC 1 / TOC 2 styles: single spacing, small gap
        $st = $doc.Styles.Item($id)
        $st.ParagraphFormat.LineSpacingRule = 0
        $st.ParagraphFormat.SpaceAfter = 4
        $st.ParagraphFormat.SpaceBefore = 0
    }
    $doc.Fields.Update() | Out-Null
    foreach ($t in $doc.TablesOfContents) { $t.Update() }
    $doc.Repaginate()
    foreach ($t in $doc.TablesOfContents) { $t.UpdatePageNumbers() }
    $doc.Save()
    if ($Pdf) { $doc.ExportAsFixedFormat($Pdf, 17) }
    $doc.Close()
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
