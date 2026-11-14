Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\sig_jose_leles.png")

for ($y = 0; $y -lt $b.Height; $y += 2) {
    $dark = 0
    for ($x = 0; $x -lt $b.Width; $x += 2) {
        $c = $b.GetPixel($x, $y)
        if ($c.A -gt 50 -and (($c.R + $c.G + $c.B) / 3) -lt 180) { $dark++ }
    }
    if ($dark -gt 0) {
        Write-Host "Y=$y dark=$dark"
    }
}
$b.Dispose()
