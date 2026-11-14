Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\user_sig_leles.png")

for ($y = 0; $y -lt $b.Height; $y += 10) {
    $dark = 0
    for ($x = 0; $x -lt $b.Width; $x += 4) {
        $c = $b.GetPixel($x, $y)
        if ((($c.R + $c.G + $c.B) / 3) -lt 140) { $dark++ }
    }
    if ($dark -gt 5) {
        Write-Host "Y = $y : dark = $dark"
    }
}
$b.Dispose()
