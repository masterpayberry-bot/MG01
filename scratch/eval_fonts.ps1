Add-Type -AssemblyName System.Drawing

$p = 'C:\Users\MG\Desktop\htdocs\scratch\test_fonts.png'
$img = [System.Drawing.Bitmap]::FromFile($p)

# In test_fonts.html:
# padding: 20px
# Let's find each line of text
$lineYs = @()
for ($y = 20; $y -lt 300; $y++) {
    $dark = 0
    for ($x = 20; $x -lt 100; $x++) {
        $pixel = $img.GetPixel($x, $y)
        if ($pixel.R -lt 120) { $dark++ }
    }
    if ($dark -gt 5) {
        $lineYs += $y
    }
}

# Print ASCII of 'P' for line 1 (test1) vs line 2 (test2) vs line 3 (test3)
# Line 1:
Write-Output "--- TEST 1 (default Courier New 700) ---"
for ($y = 22; $y -le 35; $y++) {
    $row = ""
    for ($x = 20; $x -le 32; $x++) {
        if ($img.GetPixel($x, $y).R -lt 120) { $row += "#" } else { $row += " " }
    }
    Write-Output $row
}

Write-Output "--- TEST 2 (-webkit-text-stroke: 0.35px) ---"
for ($y = 44; $y -le 57; $y++) {
    $row = ""
    for ($x = 20; $x -le 32; $x++) {
        if ($img.GetPixel($x, $y).R -lt 120) { $row += "#" } else { $row += " " }
    }
    Write-Output $row
}

Write-Output "--- TEST 3 (-webkit-text-stroke: 0.45px) ---"
for ($y = 66; $y -le 81; $y++) {
    $row = ""
    for ($x = 20; $x -le 32; $x++) {
        if ($img.GetPixel($x, $y).R -lt 120) { $row += "#" } else { $row += " " }
    }
    Write-Output $row
}

$img.Dispose()
