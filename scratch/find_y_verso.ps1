Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

for ($y = 440; $y -lt 730; $y += 2) {
    $dark = 0
    for ($x = 160; $x -lt 350; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 120) { $dark++ }
    }
    if ($dark -gt 5) {
        Write-Host "Y = $y : dark pixels = $dark (Y% = $([math]::Round($y / 1024 * 100, 2))%)"
    }
}
$bmp.Dispose()
