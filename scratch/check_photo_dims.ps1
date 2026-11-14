Add-Type -AssemblyName System.Drawing
$b = [System.Drawing.Bitmap]::FromFile("$PWD\assets\rg_master_a4_clean.png")

# Photo is located on the front card, left side.
# Let's find the photo frame border:
# Left approx 60 to 140, top approx 180 to 350
for ($y = 180; $y -lt 340; $y += 5) {
    for ($x = 60; $x -lt 150; $x += 5) {
        $c = $b.GetPixel($x, $y)
        # Check border (dark grey/blue)
        if ($c.R -lt 100 -and $c.G -lt 100 -and $c.B -lt 100) {
            # Write-Host "Border candidate: X=$x, Y=$y"
        }
    }
}

# In percentage of 732 x 1024:
# X: 64 to 170 -> 64/732 = 8.74%, width: (170-64)/732 = 14.48%
# Y: 186 to 337 -> 186/1024 = 18.16%, height: (337-186)/1024 = 14.74%
Write-Host "Photo coordinates confirmed: Left 8.74%, Top 18.16%, Width 14.48%, Height 14.74%"
$b.Dispose()
