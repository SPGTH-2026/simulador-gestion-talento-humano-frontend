# verificar_docx.ps1
# Abre cada .docx de documentos\ con Word y comprueba que esta bien:
# paginas, indice (TOC), tablas, y que no haya caracteres rotos.
$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "documentos"

$rutas = Get-ChildItem -LiteralPath $dir -Filter *.docx | Sort-Object Name
if (-not $rutas) { Write-Host "No hay .docx en $dir" -ForegroundColor Red; exit 1 }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$problemas = 0
"{0,-44} {1,6} {2,6} {3,6} {4,5}" -f "Documento", "Pag.", "Palab.", "Tablas", "TOC"
"-" * 76

try {
    foreach ($r in $rutas) {
        try {
            $d = $word.Documents.Open($r.FullName, $false, $true)
        } catch {
            $msg = "  {0,-42} NO ABRE: {1}" -f $r.Name, $_.Exception.Message
            Write-Host $msg -ForegroundColor Red
            $problemas++
            continue
        }

        $pag  = $d.ComputeStatistics(2)
        $pal  = $d.ComputeStatistics(0)
        $tab  = $d.Tables.Count
        $toc  = $d.TablesOfContents.Count
        $txt  = $d.Content.Text

        "{0,-44} {1,6} {2,6} {3,6} {4,5}" -f $r.Name.Substring(0, [Math]::Min(44, $r.Name.Length)), $pag, $pal, $tab, $toc

        if ($toc -eq 0) {
            Write-Host "      AVISO: sin indice" -ForegroundColor Yellow; $problemas++
        }
        if ($pal -lt 200) {
            Write-Host "      AVISO: solo $pal palabras, parece vacio" -ForegroundColor Yellow; $problemas++
        }
        if ($txt -match '[\u4e00-\u9FFF\u0400-\u04FF]') {
            Write-Host "      AVISO: hay caracteres CJK o cirilicos" -ForegroundColor Yellow; $problemas++
        }
        if ($txt -match '[\u00C3\u00C2]') {
            Write-Host "      AVISO: hay mojibake" -ForegroundColor Yellow; $problemas++
        }
        if ($txt -match '\?\?\?+') {
            Write-Host "      AVISO: hay signos de interrogacion sueltos" -ForegroundColor Yellow; $problemas++
        }

        $d.Close($false)
    }
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}

"-" * 76
if ($problemas -gt 0) {
    Write-Host "$problemas aviso(s) en $($rutas.Count) documentos." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "Todo correcto: $($rutas.Count) documentos." -ForegroundColor Green
}
