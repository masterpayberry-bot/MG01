Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Let's inspect background color above and below the name line:
# Y = 224 (between label Nome and name Mellyssa)
$c1 = $bmp.GetPixel(250, 224)
$c2 = $bmp.GetPixel(300, 224)
$c3 = $bmp.GetPixel(350, 224)
Write-Host "Y=224: R=$($c1.R), G=$($c1.G), B=$($c1.B) | R=$($c2.R), G=$($c2.G), B=$($c2.B) | R=$($c3.R), G=$($c3.G), B=$($c3.B)"

# Y = 248 (below name Mellyssa, above CPF label)
$c4 = $bmp.GetPixel(250, 248)
$c5 = $bmp.GetPixel(300, 248)
Write-Host "Y=248: R=$($c4.R), G=$($c4.G), B=$($c4.B) | R=$($c5.R), G=$($c5.G), B=$($c5.B)"

$bmp.Dispose()
