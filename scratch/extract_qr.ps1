Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)

$rectQr = New-Object System.Drawing.Rectangle(289, 162, 166, 166)
$qrBmp = $img1.Clone($rectQr, $img1.PixelFormat)
$qrBmp.Save('C:\Users\MG\Desktop\htdocs\assets\crlv_qr_original.png', [System.Drawing.Imaging.ImageFormat]::Png)
$qrBmp.Dispose()
$img1.Dispose()
Write-Output "Saved original QR to assets/crlv_qr_original.png"
