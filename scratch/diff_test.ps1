Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$clean = 'C:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'

$b1 = [System.Drawing.Bitmap]::FromFile($p1)
$b2 = [System.Drawing.Bitmap]::FromFile($p2)
$bClean = [System.Drawing.Bitmap]::FromFile($clean)

Write-Output "b1: $($b1.Width)x$($b1.Height)"
Write-Output "b2: $($b2.Width)x$($b2.Height)"
Write-Output "bClean: $($bClean.Width)x$($bClean.Height)"

# Let's save a side-by-side or difference image to see where bClean differs from b1 and b2
# First 723 rows are b1
$diffCount = 0
for ($y = 0; $y -lt [Math]::Min($b1.Height, 723); $y += 5) {
    for ($x = 0; $x -lt 1024; $x += 5) {
        $c1 = $b1.GetPixel($x, $y)
        $c2 = $bClean.GetPixel($x, $y)
        $diff = [Math]::Abs($c1.R - $c2.R) + [Math]::Abs($c1.G - $c2.G) + [Math]::Abs($c1.B - $c2.B)
        if ($diff -gt 50) {
            $diffCount++
        }
    }
}
Write-Output "Diff samples in top half: $diffCount"

$b1.Dispose()
$b2.Dispose()
$bClean.Dispose()
