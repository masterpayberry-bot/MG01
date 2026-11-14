Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\test_name_inpainted.png")
$dark = 0
for ($x = 176; $x -le 430; $x++) {
    for ($y = 225; $y -lt 248; $y++) {
        $c = $bmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3
        if ($brightness -lt 140) { $dark++ }
    }
}
Write-Host "Dark pixels remaining in inpainted name line: $dark"
$bmp.Dispose()
