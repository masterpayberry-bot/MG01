Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\original_rg_frente_bg.png")
# Check pixels around where name would be: x: 150-300, y: 80-100
$darkPixels = 0
for ($x = 150; $x -lt 300; $x += 2) {
    for ($y = 80; $y -lt 100; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 100) { $darkPixels++ }
    }
}
Write-Host "Dark pixels count in name area: $darkPixels"
$bmp.Dispose()
