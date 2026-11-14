Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Inner QR code is square with dense black/white pattern
# Around x: 530 to 650, y: 130 to 260
$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0;
for ($y = 120; $y -lt 280; $y++) {
    for ($x = 520; $x -lt 660; $x++) {
        $c = $b.GetPixel($x, $y)
        if (($c.R + $c.G + $c.B) / 3 -lt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Inner QR Box: Left $([math]::Round($minX/732*100, 2))%, Top $([math]::Round($minY/1024*100, 2))%, Width $([math]::Round(($maxX-$minX)/732*100, 2))%, Height $([math]::Round(($maxY-$minY)/1024*100, 2))%"
$b.Dispose()
