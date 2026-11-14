Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\sig_jose_leles.png")
Write-Host "Width: $($b.Width), Height: $($b.Height)"

# Find the horizontal ruler line:
# The horizontal ruler line has dark pixels stretching across most of the width
$lineY = -1
for ($y = 0; $y -lt $b.Height; $y++) {
    $dark = 0
    for ($x = 20; $x -lt ($b.Width - 20); $x++) {
        $c = $b.GetPixel($x, $y)
        if ($c.A -gt 100 -and (($c.R + $c.G + $c.B) / 3) -lt 150) { $dark++ }
    }
    if ($dark -gt ($b.Width * 0.5)) {
        Write-Host "Found line candidate at Y=$y with dark pixels=$dark"
        $lineY = $y
    }
}

Write-Host "Chosen line Y: $lineY"
$b.Dispose()
