Add-Type -AssemblyName System.Drawing

function CompareHalf($file) {
    $bmp = [System.Drawing.Bitmap]::FromFile($file)
    $w = ($bmp.Width - 10) / 2
    $h = $bmp.Height
    $diffs = 0
    $maxDiff = 0
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $pL = $bmp.GetPixel($x, $y)
            $pR = $bmp.GetPixel(($x + $w + 10), $y)
            $d = [Math]::Abs($pL.R - $pR.R) + [Math]::Abs($pL.G - $pR.G) + [Math]::Abs($pL.B - $pR.B)
            if ($d -gt 50) {
                $diffs++
            }
        }
    }
    $bmp.Dispose()
    return [PSCustomObject]@{ File = (Split-Path $file -Leaf); Diffs = $diffs; Pct = [Math]::Round(($diffs/($w*$h))*100, 2) }
}

$dir = 'C:\Users\MG\Desktop\htdocs\scratch\crops'
Get-ChildItem -Path $dir -Filter "*.png" | ForEach-Object {
    $res = CompareHalf $_.FullName
    Write-Output ("{0,-28}: {1,6} diffs ({2}%)" -f $res.File, $res.Diffs, $res.Pct)
}
