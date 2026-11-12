Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")

Write-Output "Finding QR code box..."
$minX = 1024
$maxX = 0
$minY = 1000
$maxY = 0

for ($y = 120; $y -lt 360; $y++) {
    for ($x = 270; $x -lt 470; $x++) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 50 -and $p.G -lt 50 -and $p.B -lt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "QR Code Box: X: $minX to $maxX (Width: $($maxX - $minX)), Y: $minY to $maxY (Height: $($maxY - $minY))"

$img.Dispose()
