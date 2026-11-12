Add-Type -AssemblyName System.Drawing

$cropDir = 'C:\Users\MG\Desktop\htdocs\scratch\crops'
$files = Get-ChildItem -Path $cropDir -Filter "*.png"

foreach ($f in $files) {
    $bmp = [System.Drawing.Bitmap]::FromFile($f.FullName)
    $w = ($bmp.Width - 10) / 2
    $h = $bmp.Height

    # Let's count dark pixels in Left (target) vs Right (rendered)
    $darkLeft = 0
    $darkRight = 0
    $diffCount = 0

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $pL = $bmp.GetPixel($x, $y)
            $pR = $bmp.GetPixel(($x + $w + 10), $y)

            if ($pL.R -lt 120 -and $pL.G -lt 120 -and $pL.B -lt 120) { $darkLeft++ }
            if ($pR.R -lt 120 -and $pR.G -lt 120 -and $pR.B -lt 120) { $darkRight++ }

            $d = [Math]::Abs($pL.R - $pR.R) + [Math]::Abs($pL.G - $pR.G) + [Math]::Abs($pL.B - $pR.B)
            if ($d -gt 80) { $diffCount++ }
        }
    }

    $diffPct = [Math]::Round(($diffCount / ($w * $h)) * 100, 1)
    Write-Output ("{0,-25} DarkL: {1,-6} DarkR: {2,-6} Diff: {3}%" -f $f.BaseName, $darkLeft, $darkRight, $diffPct)
    $bmp.Dispose()
}
