Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314485955_67d64884.png")
Write-Output "Verso size: $($img.Width) x $($img.Height)"

# Procurar onde está "SEM OBSERVAÇÕES"
for ($y = 20; $y -lt 300; $y++) {
    $dark = 0
    for ($x = 40; $x -lt 400; $x++) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -lt 120 -and $p.G -lt 120 -and $p.B -lt 120) {
            $dark++
        }
    }
    if ($dark -gt 5) {
        Write-Output "Verso dark band Y: $y (count: $dark)"
    }
}
$img.Dispose()
