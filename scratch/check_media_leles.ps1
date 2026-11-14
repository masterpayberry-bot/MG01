Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\c1d43fd3-6d8a-4cce-ac42-a98e6c534a88\.user_uploaded\media_1794627207718_37ba3612.png")
Write-Host "Width: $($b.Width), Height: $($b.Height)"
$b.Dispose()
