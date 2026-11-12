Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

Write-Output "--- Image 1: 'NOME' region (Y: 295 to 335, X: 530 to 600) ---"
for ($y = 295; $y -le 330; $y++) {
    $row = ("{0,3}: " -f $y)
    $hasDark = $false
    for ($x = 530; $x -le 600; $x++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 120) { $row += "#"; $hasDark = $true } else { $row += " " }
    }
    if ($hasDark) { Write-Output $row }
}

Write-Output "--- Image 1: 'MOTOR' region (Y: 205 to 245, X: 530 to 600) ---"
for ($y = 205; $y -le 240; $y++) {
    $row = ("{0,3}: " -f $y)
    $hasDark = $false
    for ($x = 530; $x -le 600; $x++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 120) { $row += "#"; $hasDark = $true } else { $row += " " }
    }
    if ($hasDark) { Write-Output $row }
}

$img1.Dispose()
