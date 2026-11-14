Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\c1d43fd3-6d8a-4cce-ac42-a98e6c534a88\.user_uploaded\media_1794627041380_0f5e1228.png")
Write-Host "Pixel 10,10: $($b.GetPixel(10,10))"
Write-Host "Pixel 500,200: $($b.GetPixel(500,200))"
$b.Dispose()
