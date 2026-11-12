Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg")

function FindBox($label, $x1, $y1, $x2, $y2) {
    $minX = $x2; $maxX = $x1; $minY = $y2; $maxY = $y1
    $found = 0
    for ($y = $y1; $y -le $y2; $y++) {
        for ($x = $x1; $x -le $x2; $x++) {
            $p = $img.GetPixel($x, $y)
            if ($p.R -lt 130 -and $p.G -lt 130 -and $p.B -lt 130) {
                $found++
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($found -gt 0) {
        Write-Output "$label -> X: $minX to $maxX (W: $($maxX - $minX + 1)), Y: $minY to $maxY (H: $($maxY - $minY + 1))"
    } else {
        Write-Output "$label -> NOT FOUND in range ($x1,$y1 to $x2,$y2)"
    }
}

Write-Output "--- EXACT BOUNDING BOXES FOR EVERY FIELD ---"
FindBox "UF DETRAN (BA)" 95 85 130 105
FindBox "RENAVAM (00872698394)" 50 170 200 195
FindBox "PLACA (JMI5104)" 50 215 150 238
FindBox "EXERCICIO (2025)" 170 215 250 238
FindBox "ANO FAB (2005)" 50 260 150 285
FindBox "ANO MOD (2006)" 170 260 250 285
FindBox "NUM CRV (***)" 50 305 150 330
FindBox "QR CODE" 280 150 460 335
FindBox "CLA (47849505457)" 50 440 200 465
FindBox "CAT (***)" 270 440 330 465
FindBox "MARCA (YAMAHA/FAZER YS250)" 50 500 400 525
FindBox "ESPECIE (PASSAGEIRO MOTOCICLETA)" 50 560 400 585
FindBox "PLACA ANT (*******/**)" 50 620 180 645
FindBox "CHASSI (9C6KG017060006367)" 215 620 450 645
FindBox "COR (PRETA)" 50 680 140 705
FindBox "COMBUSTIVEL (GASOLINA)" 170 680 290 705
FindBox "RODAPE EMISSAO" 50 705 450 722

# Coluna Direita
FindBox "CATEGORIA (PARTICULAR)" 540 120 700 145
FindBox "CAPACIDADE (* . *)" 850 120 920 145
FindBox "POTENCIA (0CV/249)" 540 170 660 195
FindBox "PESO BRUTO (0.31)" 850 170 920 195
FindBox "MOTOR (G347E-006361)" 540 215 700 238
FindBox "CMT (* . *)" 755 215 810 238
FindBox "EIXOS (*)" 840 215 880 238
FindBox "LOTACAO (02P)" 890 215 950 238
FindBox "CARROCERIA (NAO APLICAVEL)" 540 260 750 285
FindBox "NOME (JORDELIO RODRIGUES...)" 540 305 850 330
FindBox "CPF (046.660.515-38)" 750 350 950 375
FindBox "LOCAL (VITORIA DA CONQUISTA BA)" 540 435 800 465
FindBox "DATA (25/03/2025)" 845 435 965 465

$img.Dispose()
