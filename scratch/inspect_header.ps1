Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")

Write-Output "Looking at top 150 rows..."
for ($y = 0; $y -lt 150; $y += 5) {
    $dark = 0
    $black = 0
    for ($x = 0; $x -lt 1024; $x += 4) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 50 -and $p.G -lt 50 -and $p.B -lt 50) { $black++ }
        if ($p.R -lt 150 -and $p.G -lt 150 -and $p.B -lt 150) { $dark++ }
    }
    Write-Output "Y: $y | Black count: $black | Dark count: $dark"
}

$img.Dispose()
