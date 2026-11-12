Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$tmpl = 'C:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'

$i1 = [System.Drawing.Bitmap]::FromFile($p1)
$iT = [System.Drawing.Bitmap]::FromFile($tmpl)

# Let's sample a few points from user image 1 vs crlv_template_hd_clean.png:
Write-Output "Header pixel at (200, 30):"
Write-Output "User 1: $($i1.GetPixel(200, 30))"
Write-Output "Template: $($iT.GetPixel(200, 30))"

# Check where the user values are:
# In User 1, at (60, 175) is RENAVAM "00872698394"
# In crlv_template_hd_clean.png, what is at (60, 175)?
Write-Output "At (60, 175):"
Write-Output "User 1: $($i1.GetPixel(60, 175))"
Write-Output "Template: $($iT.GetPixel(60, 175))"

$i1.Dispose()
$iT.Dispose()
