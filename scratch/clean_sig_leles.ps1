Add-Type -AssemblyName System.Drawing
$bytes = [System.IO.File]::ReadAllBytes("$PWD\assets\sig_jose_leles.png")
$ms = New-Object System.IO.MemoryStream(,$bytes)
$bmp = [System.Drawing.Bitmap]::FromStream($ms)

$out = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
$g.Dispose()

# Erase all pixels at Y >= 64
for ($x = 0; $x -lt $out.Width; $x++) {
    for ($y = 64; $y -lt $out.Height; $y++) {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
}

$bmp.Dispose()
$ms.Dispose()

$out.Save("$PWD\assets\sig_jose_leles.png", [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
Write-Host "sig_jose_leles cleaned successfully! Zero ghost pixels below line."
