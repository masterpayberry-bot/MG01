Add-Type -AssemblyName System.Drawing
$bytes = [System.IO.File]::ReadAllBytes("$PWD\scratch\rg_master_a4_clean_backup.png")
$ms = New-Object System.IO.MemoryStream(,$bytes)
$bmp = [System.Drawing.Bitmap]::FromStream($ms)

$out = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
$g.Dispose()

function Inpaint-Rect($x1, $y1, $x2, $y2) {
    $yTop = [math]::Max(0, $y1 - 1)
    $yBot = [math]::Min($bmp.Height - 1, $y2 + 1)
    for ($x = $x1; $x -le $x2; $x++) {
        $cTop = $bmp.GetPixel($x, $yTop)
        $cBot = $bmp.GetPixel($x, $yBot)
        for ($y = $y1; $y -le $y2; $y++) {
            $t = ($y - $yTop) / ($yBot - $yTop)
            $r = [int]($cTop.R * (1 - $t) + $cBot.R * $t)
            $gCol = [int]($cTop.G * (1 - $t) + $cBot.G * $t)
            $b = [int]($cTop.B * (1 - $t) + $cBot.B * $t)
            $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $gCol, $b))
        }
    }
}

# 1. Frente - Nome (x: 172 to 435, y: 223 to 247)
Inpaint-Rect 172 223 435 247

# 2. Frente - CPF (x: 172 to 302, y: 274 to 295)
Inpaint-Rect 172 274 302 295

# 3. Frente - Sexo (x: 308 to 385, y: 274 to 295)
Inpaint-Rect 308 274 385 295

# 4. Frente - Nascimento (x: 172 to 275, y: 312 to 330)
Inpaint-Rect 172 312 275 330

# 5. Frente - Nacionalidade (x: 308 to 385, y: 312 to 330)
Inpaint-Rect 308 312 385 330

# 6. Frente - Naturalidade (x: 172 to 302, y: 344 to 362)
Inpaint-Rect 172 344 302 362

# 7. Frente - Validade (x: 308 to 395, y: 344 to 362)
Inpaint-Rect 308 344 395 362

# 8. Frente - Assinatura do Titular (x: 172 to 435, y: 366 to 396)
Inpaint-Rect 172 366 435 396

# 9. Verso - Pai (x: 162 to 435, y: 460 to 472)
Inpaint-Rect 162 460 435 472

# 10. Verso - Mãe (x: 162 to 435, y: 474 to 486)
Inpaint-Rect 162 474 435 486

# 11. Verso - Órgão (x: 162 to 300, y: 530 to 546)
Inpaint-Rect 162 530 300 546

# 12. Verso - Local (x: 162 to 285, y: 584 to 600)
Inpaint-Rect 162 584 285 600

# 13. Verso - Emissão (x: 295 to 395, y: 584 to 600)
Inpaint-Rect 295 584 395 600

# 14. Verso - Assinatura Expedidor (x: 162 to 360, y: 608 to 630)
Inpaint-Rect 162 608 360 630

# 15. Verso - MRZ (3 linhas) (x: 28 to 445, y: 670 to 726)
Inpaint-Rect 28 670 445 726

# 16. Tabela Inferior - DNI (x: 75 to 240, y: 996 to 1012)
Inpaint-Rect 75 996 240 1012

$bmp.Dispose()
$ms.Dispose()

$out.Save("$PWD\assets\rg_master_a4_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
Write-Host "Success! Clean master saved without locks."
