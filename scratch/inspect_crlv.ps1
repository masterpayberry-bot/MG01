Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")
Write-Output "Image size: $($img.Width) x $($img.Height)"

# Vamos varrer a coluna esquerda entre x = 50 e 200, para cada linha y de 50 a 720
# e contar quantos pixels escuros (< 100) existem em cada linha Y!
$lineDarkCounts = @{}
for ($y = 60; $y -lt 720; $y++) {
    $dark = 0
    for ($x = 50; $x -lt 250; $x++) {
        $pixel = $img.GetPixel($x, $y)
        if ($pixel.R -lt 120 -and $pixel.G -lt 120 -and $pixel.B -lt 120) {
            $dark++
        }
    }
    if ($dark -gt 5) {
        # achou linha com texto
        $lineDarkCounts[$y] = $dark
    }
}

# Agrupar linhas consecutivas com texto
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

Write-Output "--- TEXT BANDS IN LEFT COLUMN (x: 50-250) ---"
foreach ($g in $groups) {
    Write-Output "Y: $($g.MinY) to $($g.MaxY) (Height: $($g.Height))"
}

$img.Dispose()
