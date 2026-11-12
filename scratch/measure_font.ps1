Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

# Let's inspect the RENAVAM text in target: "00872698394"
# Where is each digit, what is the character width, character height, stroke width?
# Target RENAVAM bounds: X ~ 57, Y ~ 165
Write-Output "Scanning RENAVAM column widths in target:"
$y = 176
$row = ""
for ($x = 55; $x -le 175; $x++) {
    $p = $img1.GetPixel($x, $y)
    if ($p.R -lt 100) { $row += "#" } else { $row += "." }
}
Write-Output $row

# Let's check letter height of "00872698394":
$minY = 999; $maxY = 0
for ($yy = 160; $yy -le 190; $yy++) {
    for ($xx = 55; $xx -le 175; $xx++) {
        $p = $img1.GetPixel($xx, $yy)
        if ($p.R -lt 100) {
            if ($yy -lt $minY) { $minY = $yy }
            if ($yy -gt $maxY) { $maxY = $yy }
        }
    }
}
Write-Output "Target RENAVAM Y range: $minY to $maxY (Height = $($maxY - $minY + 1))"

# Check width of "00872698394": 11 characters
$minX = 999; $maxX = 0
for ($yy = 160; $yy -le 190; $yy++) {
    for ($xx = 55; $xx -le 175; $xx++) {
        $p = $img1.GetPixel($xx, $yy)
        if ($p.R -lt 100) {
            if ($xx -lt $minX) { $minX = $xx }
            if ($xx -gt $maxX) { $maxX = $xx }
        }
    }
}
Write-Output "Target RENAVAM X range: $minX to $maxX (Total width = $($maxX - $minX + 1))"
$charW = ($maxX - $minX + 1) / 11.0
Write-Output "Average character pitch: $charW px"

$img1.Dispose()
