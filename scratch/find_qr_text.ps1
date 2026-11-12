Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

# Check text around QR code: X from 450 to 480, Y from 160 to 340
for ($x = 450; $x -le 480; $x += 2) {
    $darkCount = 0
    for ($y = 150; $y -le 350; $y++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 100 -and $p.G -lt 100 -and $p.B -lt 100) {
            $darkCount++
        }
    }
    Write-Output "X=$x : dark pixels = $darkCount"
}

# QR code boundaries in img1:
# The QR code has black corners and border
$qrMinX = 999; $qrMaxX = 0; $qrMinY = 999; $qrMaxY = 0
for ($y = 150; $y -le 350; $y++) {
    for ($x = 270; $x -le 460; $x++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 50 -and $p.G -lt 50 -and $p.B -lt 50) {
            if ($x -lt $qrMinX) { $qrMinX = $x }
            if ($x -gt $qrMaxX) { $qrMaxX = $x }
            if ($y -lt $qrMinY) { $qrMinY = $y }
            if ($y -gt $qrMaxY) { $qrMaxY = $y }
        }
    }
}
Write-Output "QR code exact bounds in user Image 1: X=$qrMinX..$qrMaxX, Y=$qrMinY..$qrMaxY (W=$($qrMaxX - $qrMinX + 1), H=$($qrMaxY - $qrMinY + 1))"

$img1.Dispose()
