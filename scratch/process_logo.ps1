Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\MG\.gemini\antigravity\brain\63428a69-2228-4ccc-b1f6-063dba65c615\.user_uploaded\media_1794405666515_1e8dab9e.webp"
$rawPng = "C:\Users\MG\Desktop\htdocs\assets\logo-mercadopago.png"
$cleanPng = "C:\Users\MG\Desktop\htdocs\assets\logo-mercadopago-clean.png"
$b64Js = "C:\Users\MG\Desktop\htdocs\assets\mp-logo-base64.js"

$decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create([System.Uri]$srcPath, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
$frame = $decoder.Frames[0]

$encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$encoder.Frames.Add($frame)
$fs = [System.IO.File]::OpenWrite($rawPng)
$encoder.Save($fs)
$fs.Close()

Write-Output "Raw PNG saved: $($frame.PixelWidth)x$($frame.PixelHeight)"

# Now load into System.Drawing.Bitmap to crop and remove white background
$bmp = [System.Drawing.Bitmap]::FromFile($rawPng)
$w = $bmp.Width
$h = $bmp.Height

# Find bounding box of non-white pixels
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Check if NOT nearly white
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Crop bounds: minX=$minX, maxX=$maxX, minY=$minY, maxY=$maxY"

$cropW = ($maxX - $minX) + 1
$cropH = ($maxY - $minY) + 1

$croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $bmp.GetPixel($minX + $x, $minY + $y)
        
        # Transparent background for pure or near white pixels
        if ($c.R -gt 245 -and $c.G -gt 245 -and $c.B -gt 245) {
            $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            # Smooth edge alpha if it's very light gray
            $brightness = ($c.R + $c.G + $c.B) / 3
            if ($brightness -gt 230) {
                $alpha = [int](255 * (245 - $brightness) / 15)
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
            } else {
                $croppedBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
            }
        }
    }
}
$bmp.Dispose()

$croppedBmp.Save($cleanPng, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Clean cropped PNG saved: ${cropW}x${cropH}"

# Convert to Base64
$bytes = [System.IO.File]::ReadAllBytes($cleanPng)
$b64 = [Convert]::ToBase64String($bytes)
$jsContent = "window.MP_LOGO_B64 = 'data:image/png;base64,$b64';"
[System.IO.File]::WriteAllText($b64Js, $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "Base64 JS file updated. Length: $($b64.Length)"
$croppedBmp.Dispose()
