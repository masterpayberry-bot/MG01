Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_pristine.png")
Write-Host "Pristine Width: $($bmp.Width), Height: $($bmp.Height)"
# In a 1240x1754 sheet (A4), the name "Mellyssa De Jesus Menino" is at approx x: 300 to 650, y: 375 to 415
# Let's count dark pixels in that region:
$dark = 0
for ($x = 350; $x -lt 600; $x += 2) {
    for ($y = 380; $y -lt 410; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 110) { $dark++ }
    }
}
Write-Host "Dark pixels in name line in pristine: $dark"

$clean = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")
$darkClean = 0
for ($x = 350; $x -lt 600; $x += 2) {
    for ($y = 380; $y -lt 410; $y += 2) {
        $c = $clean.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 110) { $darkClean++ }
    }
}
Write-Host "Dark pixels in name line in clean: $darkClean"

$bmp.Dispose()
$clean.Dispose()
