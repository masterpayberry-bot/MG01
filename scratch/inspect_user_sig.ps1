Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\c1d43fd3-6d8a-4cce-ac42-a98e6c534a88\.user_uploaded\media_1794627041380_0f5e1228.png")
Write-Host "Width: $($b.Width), Height: $($b.Height)"
# Save a clean copy
$b.Save("$PWD\scratch\user_sig_leles.png", [System.Drawing.Imaging.ImageFormat]::Png)
$b.Dispose()
Write-Host "Saved user sig leles"
