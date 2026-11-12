Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$tmpl = 'C:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'

Write-Output "Checking differences..."
# Let's save a combined image of p1 and p2 stacked vertically:
$i1 = [System.Drawing.Bitmap]::FromFile($p1)
$i2 = [System.Drawing.Bitmap]::FromFile($p2)
Write-Output "User Image 1: $($i1.Width)x$($i1.Height)"
Write-Output "User Image 2: $($i2.Width)x$($i2.Height)"

$combinedH = $i1.Height + $i2.Height
Write-Output "Combined Height: $combinedH"

# Also check crlv_template_hd_clean.png
$iT = [System.Drawing.Bitmap]::FromFile($tmpl)
Write-Output "Existing clean template: $($iT.Width)x$($iT.Height)"

$i1.Dispose()
$i2.Dispose()
$iT.Dispose()
