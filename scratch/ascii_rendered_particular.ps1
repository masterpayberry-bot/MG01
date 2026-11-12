Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\Desktop\htdocs\scratch\sheet_rendered.png'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

for ($y = 126; $y -le 144; $y++) {
    $line = ("{0,3}: " -f $y)
    for ($x = 544; $x -le 570; $x++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 120) { $line += "#" } else { $line += " " }
    }
    Write-Output $line
}
$img1.Dispose()
