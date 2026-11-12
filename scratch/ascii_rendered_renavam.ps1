Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\Desktop\htdocs\scratch\sheet_rendered.png'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

for ($y = 140; $y -le 190; $y += 2) {
    $line = ("{0,3}: " -f $y)
    for ($x = 54; $x -le 170; $x += 2) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 120) { $line += "#" } else { $line += " " }
    }
    Write-Output $line
}
$img1.Dispose()
