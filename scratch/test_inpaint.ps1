Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Let's clone bitmap
$out = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
$g.Dispose()

# Inpaint Name line: x from 176 to 430, y from 225 to 247
# Interpolate between y=223 (above) and y=249 (below)
$yTop = 223
$yBot = 249
for ($x = 176; $x -le 430; $x++) {
    $cTop = $bmp.GetPixel($x, $yTop)
    $cBot = $bmp.GetPixel($x, $yBot)
    for ($y = $yTop + 1; $y -lt $yBot; $y++) {
        $t = ($y - $yTop) / ($yBot - $yTop)
        $r = [int]($cTop.R * (1 - $t) + $cBot.R * $t)
        $gCol = [int]($cTop.G * (1 - $t) + $cBot.G * $t)
        $b = [int]($cTop.B * (1 - $t) + $cBot.B * $t)
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gCol, $b))
    }
}

$out.Save("$PWD\scratch\test_name_inpainted.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$out.Dispose()
Write-Host "Inpainted name line saved to scratch/test_name_inpainted.png"
