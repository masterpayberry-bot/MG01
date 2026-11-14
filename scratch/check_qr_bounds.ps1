Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Right column has the QR code.
# Let's find dark pixels of QR code in x: 450 to 700, y: 100 to 400
$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0;
for ($y = 100; $y -lt 350; $y++) {
    for ($x = 450; $x -lt 700; $x++) {
        $c = $b.GetPixel($x, $y)
        if (($c.R + $c.G + $c.B) / 3 -lt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "QR Code Bounds: X: $minX to $maxX (left: $([math]::Round($minX/732*100, 2))%, width: $([math]::Round(($maxX-$minX)/732*100, 2))%)"
Write-Host "QR Code Bounds: Y: $minY to $maxY (top: $([math]::Round($minY/1024*100, 2))%, height: $([math]::Round(($maxY-$minY)/1024*100, 2))%)"
$b.Dispose()
