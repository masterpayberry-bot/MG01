Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$rendered = 'C:\Users\MG\Desktop\htdocs\scratch\sheet_rendered.png'

$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)
$imgR = [System.Drawing.Bitmap]::FromFile($rendered)

# Let's inspect specific fields in User Image 1:
# Let's write an image that stacks img1 and img2 vertically, exactly side-by-side with imgR!
$comp = New-Object System.Drawing.Bitmap(2048, 1451, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($comp)
$g.Clear([System.Drawing.Color]::White)

# Left: original user images (img1 at top, img2 below it)
$g.DrawImage($img1, 0, 0, 1024, $img1.Height)
$g.DrawImage($img2, 0, $img1.Height, 1024, $img2.Height)

# Right: rendered
$g.DrawImage($imgR, 1024, 0, 1024, 1451)

$comp.Save('C:\Users\MG\Desktop\htdocs\scratch\comparison_side_by_side.png', [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "Comparison saved to scratch/comparison_side_by_side.png"
$g.Dispose()
$comp.Dispose()
$img1.Dispose()
$img2.Dispose()
$imgR.Dispose()
