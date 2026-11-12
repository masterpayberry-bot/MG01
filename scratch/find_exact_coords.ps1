Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)

function FindBBox($img, $x1, $y1, $x2, $y2) {
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($y = $y1; $y -le $y2; $y++) {
        for ($x = $x1; $x -le $x2; $x++) {
            $p = $img.GetPixel($x, $y)
            # Text is dark
            if ($p.R -lt 80 -and $p.G -lt 80 -and $p.B -lt 80) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($minX -le $maxX) {
        return [PSCustomObject]@{ X = $minX; Y = $minY; W = ($maxX - $minX + 1); H = ($maxY - $minY + 1) }
    }
    return $null
}

Write-Output "--- ORIGINAL FIELDS COORD IN IMAGE 1 ---"
$fields1 = @(
    @{ Name = "DETRAN_UF"; X1 = 90; Y1 = 80; X2 = 140; Y2 = 110 },
    @{ Name = "RENAVAM"; X1 = 50; Y1 = 165; X2 = 250; Y2 = 195 },
    @{ Name = "PLACA"; X1 = 50; Y1 = 210; X2 = 160; Y2 = 240 },
    @{ Name = "EXERCICIO"; X1 = 170; Y1 = 210; X2 = 250; Y2 = 240 },
    @{ Name = "ANO_FAB"; X1 = 50; Y1 = 255; X2 = 150; Y2 = 285 },
    @{ Name = "ANO_MOD"; X1 = 170; Y1 = 255; X2 = 250; Y2 = 285 },
    @{ Name = "NUM_CRV"; X1 = 50; Y1 = 300; X2 = 150; Y2 = 330 },
    @{ Name = "CLA"; X1 = 50; Y1 = 435; X2 = 250; Y2 = 465 },
    @{ Name = "CAT"; X1 = 270; Y1 = 435; X2 = 350; Y2 = 465 },
    @{ Name = "MARCA_MODELO"; X1 = 50; Y1 = 495; X2 = 450; Y2 = 530 },
    @{ Name = "ESPECIE_TIPO"; X1 = 50; Y1 = 555; X2 = 450; Y2 = 590 },
    @{ Name = "PLACA_ANT"; X1 = 50; Y1 = 615; X2 = 200; Y2 = 650 },
    @{ Name = "CHASSI"; X1 = 220; Y1 = 615; X2 = 450; Y2 = 650 },
    @{ Name = "COR"; X1 = 50; Y1 = 675; X2 = 160; Y2 = 710 },
    @{ Name = "COMBUSTIVEL"; X1 = 170; Y1 = 675; X2 = 300; Y2 = 710 },
    @{ Name = "FOOTNOTE"; X1 = 50; Y1 = 705; X2 = 400; Y2 = 722 },
    
    # Right column
    @{ Name = "CATEGORIA"; X1 = 540; Y1 = 120; X2 = 800; Y2 = 150 },
    @{ Name = "CAPACIDADE"; X1 = 850; Y1 = 120; X2 = 950; Y2 = 150 },
    @{ Name = "POTENCIA"; X1 = 540; Y1 = 165; X2 = 750; Y2 = 195 },
    @{ Name = "PESO_BRUTO"; X1 = 850; Y1 = 165; X2 = 950; Y2 = 195 },
    @{ Name = "MOTOR"; X1 = 540; Y1 = 210; X2 = 750; Y2 = 240 },
    @{ Name = "CMT"; X1 = 755; Y1 = 210; X2 = 830; Y2 = 240 },
    @{ Name = "EIXOS"; X1 = 840; Y1 = 210; X2 = 880; Y2 = 240 },
    @{ Name = "LOTACAO"; X1 = 890; Y1 = 210; X2 = 960; Y2 = 240 },
    @{ Name = "CARROCERIA"; X1 = 540; Y1 = 255; X2 = 850; Y2 = 285 },
    @{ Name = "NOME"; X1 = 540; Y1 = 300; X2 = 950; Y2 = 330 },
    @{ Name = "CPF_CNPJ"; X1 = 760; Y1 = 345; X2 = 960; Y2 = 375 },
    @{ Name = "LOCAL"; X1 = 540; Y1 = 435; X2 = 840; Y2 = 465 },
    @{ Name = "DATA"; X1 = 850; Y1 = 435; X2 = 960; Y2 = 465 }
)

foreach ($f in $fields1) {
    $box = FindBBox $img1 $f.X1 $f.Y1 $f.X2 $f.Y2
    if ($box) {
        Write-Output "$($f.Name): X=$($box.X), Y=$($box.Y), W=$($box.W), H=$($box.H)"
    } else {
        Write-Output "$($f.Name): NOT FOUND in ($($f.X1), $($f.Y1), $($f.X2), $($f.Y2))"
    }
}

Write-Output ""
Write-Output "--- ORIGINAL FIELDS COORD IN IMAGE 2 (VERSO) ---"
$fields2 = @(
    @{ Name = "OBSERVACOES"; X1 = 50; Y1 = 40; X2 = 350; Y2 = 80 },
    @{ Name = "MENSAGEM_SENATRAN"; X1 = 50; Y1 = 610; X2 = 250; Y2 = 635 }
)
foreach ($f in $fields2) {
    $box = FindBBox $img2 $f.X1 $f.Y1 $f.X2 $f.Y2
    if ($box) {
        Write-Output "$($f.Name): X=$($box.X), Y=$($box.Y), W=$($box.W), H=$($box.H)"
    } else {
        Write-Output "$($f.Name): NOT FOUND"
    }
}

$img1.Dispose()
$img2.Dispose()
