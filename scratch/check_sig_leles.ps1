Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\sig_jose_leles.png")
Write-Host "Width: $($b.Width), Height: $($b.Height)"
# Check bottom pixels: does it have text in the lower half?
$darkBottom = 0
for ($x = 0; $x -lt $b.Width; $x += 2) {
    for ($y = [int]($b.Height * 0.65); $y -lt $b.Height; $y += 2) {
        $c = $b.GetPixel($x, $y)
        if ($c.A -gt 50 -and (($c.R + $c.G + $c.B) / 3) -lt 150) { $darkBottom++ }
    }
}
Write-Host "Dark pixels in lower 35%: $darkBottom"
$b.Dispose()
