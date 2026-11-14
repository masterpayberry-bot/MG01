Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\original_rg_frente_bg.png")
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"
$bmp.Dispose()
