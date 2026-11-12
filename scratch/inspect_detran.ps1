Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")

Write-Output "Scanning Y: 75 to 130 for text..."
for ($y = 75; $y -lt 130; $y++) {
    $dark = 0
    $minX = 1024
    $maxX = 0
    for ($x = 40; $x -lt 500; $x++) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 120 -and $p.G -lt 120 -and $p.B -lt 120) {
            $dark++
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    if ($dark -gt 2) {
        Write-Output "Y: $y | Count: $dark | X: $minX to $maxX"
    }
}

$img.Dispose()
