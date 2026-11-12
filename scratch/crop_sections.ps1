Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

# Let's crop right side from Y=290 to 480, X=520 to 1000
$cropRect = New-Object System.Drawing.Rectangle(520, 290, 480, 200)
$cropped = $img1.Clone($cropRect, $img1.PixelFormat)
$cropped.Save('C:\Users\MG\Desktop\htdocs\scratch\crop_owner_section.png', [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()

# Also crop QR code area: X=270 to 480, Y=140 to 360
$cropQr = New-Object System.Drawing.Rectangle(270, 140, 210, 220)
$croppedQr = $img1.Clone($cropQr, $img1.PixelFormat)
$croppedQr.Save('C:\Users\MG\Desktop\htdocs\scratch\crop_qr_section.png', [System.Drawing.Imaging.ImageFormat]::Png)
$croppedQr.Dispose()

# Also crop header: X=0 to 1024, Y=0 to 120
$cropH = New-Object System.Drawing.Rectangle(0, 0, 1024, 120)
$croppedH = $img1.Clone($cropH, $img1.PixelFormat)
$croppedH.Save('C:\Users\MG\Desktop\htdocs\scratch\crop_header.png', [System.Drawing.Imaging.ImageFormat]::Png)
$croppedH.Dispose()

$img1.Dispose()
Write-Output "Crops saved successfully."
