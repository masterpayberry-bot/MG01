Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Let's sample a vertical slice at x = 220 (where "Nome / Name" starts, approx left 24% of 732 is x = 175)
# Left 24.3% of 732 is 177.8. Let's sample x between 180 and 350 for every y from 150 to 450
for ($y = 180; $y -lt 400; $y += 2) {
    $dark = 0
    for ($x = 180; $x -lt 350; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 120) { $dark++ }
    }
    if ($dark -gt 5) {
        Write-Host "Y = $y : dark pixels = $dark (Y% = $([math]::Round($y / 1024 * 100, 2))%)"
    }
}
$bmp.Dispose()
