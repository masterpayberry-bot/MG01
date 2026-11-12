Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")

$lineDarkCounts = @{}
for ($y = 60; $y -lt 720; $y++) {
    $dark = 0
    for ($x = 530; $x -lt 980; $x++) {
        $pixel = $img.GetPixel($x, $y)
        if ($pixel.R -lt 120 -and $pixel.G -lt 120 -and $pixel.B -lt 120) {
            $dark++
        }
    }
    if ($dark -gt 5) {
        $lineDarkCounts[$y] = $dark
    }
}

$groups = @()
$currentGroup = @()

for ($y = 60; $y -lt 720; $y++) {
    if ($lineDarkCounts.ContainsKey($y)) {
        $currentGroup += $y
    } else {
        if ($currentGroup.Count -ge 3) {
            $minY = $currentGroup[0]
            $maxY = $currentGroup[-1]
            $h = $maxY - $minY + 1
            $groups += [PSCustomObject]@{ MinY = $minY; MaxY = $maxY; Height = $h }
        }
        $currentGroup = @()
    }
}

Write-Output "--- TEXT BANDS IN RIGHT COLUMN (x: 530-980) ---"
foreach ($g in $groups) {
    # Pegar o x mínimo e máximo onde há pixels escuros nessa faixa Y
    $minX = 1024
    $maxX = 0
    for ($y = $g.MinY; $y -le $g.MaxY; $y++) {
        for ($x = 530; $x -lt 980; $x++) {
            $p = $img.GetPixel($x, $y)
            if ($p.R -lt 120 -and $p.G -lt 120 -and $p.B -lt 120) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
            }
        }
    }
    Write-Output "Y: $($g.MinY) to $($g.MaxY) (H: $($g.Height)) | X: $minX to $maxX"
}

$img.Dispose()
