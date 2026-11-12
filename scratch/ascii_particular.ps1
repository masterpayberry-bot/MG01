Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

for ($y = 126; $y -le 144; $y++) {
    $line = ("{0,3}: " -f $y)
    # Check first letter 'P' and 'A' in PARTICULAR: X from 544 to 570
    for ($x = 544; $x -le 570; $x++) {
        $p = $img1.GetPixel($x, $y)
        if ($p.R -lt 120) { $line += "#" } else { $line += " " }
    }
    Write-Output $line
}
$img1.Dispose()
