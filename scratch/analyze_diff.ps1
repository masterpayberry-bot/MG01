Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$rendered = 'C:\Users\MG\Desktop\htdocs\scratch\sheet_rendered.png'

$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)
$imgR = [System.Drawing.Bitmap]::FromFile($rendered)

Write-Output "Image 1 size: $($img1.Width)x$($img1.Height)"
Write-Output "Image 2 size: $($img2.Width)x$($img2.Height)"
Write-Output "Rendered size: $($imgR.Width)x$($imgR.Height)"

# Let's inspect differences in the header:
# In Image 1, what is the background color of the header at (500, 30)?
$cH1 = $img1.GetPixel(500, 30)
$cHR = $imgR.GetPixel(500, 30)
Write-Output "Header color - Target: $cH1, Rendered: $cHR"

# In Image 1, where is "DETRAN- BA"?
# In Image 1, "DETRAN- " is at X=53..95, Y=93..98. "BA" is at X=98..112, Y=93..98.
Write-Output "At (105, 95): Target=$($img1.GetPixel(105, 95)), Rendered=$($imgR.GetPixel(105, 95))"

# In Image 1, "00872698394":
Write-Output "At (60, 175): Target=$($img1.GetPixel(60, 175)), Rendered=$($imgR.GetPixel(60, 175))"

# Let's check difference across the whole image by creating an absolute difference heat map:
$diffBmp = New-Object System.Drawing.Bitmap(1024, 1442, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($diffBmp)
$g.Clear([System.Drawing.Color]::Black)

# Target image stitched:
$targetBmp = New-Object System.Drawing.Bitmap(1024, 1442, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gt = [System.Drawing.Graphics]::FromImage($targetBmp)
$gt.DrawImage($img1, 0, 0, 1024, $img1.Height)
$gt.DrawImage($img2, 0, $img1.Height, 1024, $img2.Height)

$bigDiffs = 0
for ($y = 0; $y -lt 1442; $y += 2) {
    for ($x = 0; $x -lt 1024; $x += 2) {
        $ct = $targetBmp.GetPixel($x, $y)
        $cr = $imgR.GetPixel($x, $y)
        $dr = [Math]::Abs($ct.R - $cr.R)
        $dg = [Math]::Abs($ct.G - $cr.G)
        $db = [Math]::Abs($ct.B - $cr.B)
        $tot = ($dr + $dg + $db) / 3
        if ($tot -gt 30) {
            $diffBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, [Math]::Min(255, $tot * 2), 0))
            $bigDiffs++
        }
    }
}
$diffBmp.Save('C:\Users\MG\Desktop\htdocs\scratch\diff_heatmap.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Diff heatmap saved. Total diff sample points: $bigDiffs"

$gt.Dispose()
$targetBmp.Dispose()
$g.Dispose()
$diffBmp.Dispose()
$img1.Dispose()
$img2.Dispose()
$imgR.Dispose()
