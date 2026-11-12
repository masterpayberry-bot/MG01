Add-Type -AssemblyName System.Drawing

function DescribeCrop($cropName) {
    $path = "C:\Users\MG\Desktop\htdocs\scratch\crops\$cropName.png"
    if (!(Test-Path $path)) { return }
    $bmp = [System.Drawing.Bitmap]::FromFile($path)
    $halfW = ($bmp.Width - 10) / 2
    $h = $bmp.Height

    Write-Output "=== CROP: $cropName ($halfW x $h) ==="

    # Check top/bottom/left/right dark bounds in Left vs Right
    $minXL = 999; $maxXL = 0; $minYL = 999; $maxYL = 0
    $minXR = 999; $maxXR = 0; $minYR = 999; $maxYR = 0

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $halfW; $x++) {
            $pL = $bmp.GetPixel($x, $y)
            $pR = $bmp.GetPixel(($x + $halfW + 10), $y)

            if ($pL.R -lt 100 -and $pL.G -lt 100 -and $pL.B -lt 100) {
                if ($x -lt $minXL) { $minXL = $x }
                if ($x -gt $maxXL) { $maxXL = $x }
                if ($y -lt $minYL) { $minYL = $y }
                if ($y -gt $maxYL) { $maxYL = $y }
            }
            if ($pR.R -lt 100 -and $pR.G -lt 100 -and $pR.B -lt 100) {
                if ($x -lt $minXR) { $minXR = $x }
                if ($x -gt $maxXR) { $maxXR = $x }
                if ($y -lt $minYR) { $minYR = $y }
                if ($y -gt $maxYR) { $maxYR = $y }
            }
        }
    }
    Write-Output "Left  (Target)  : X=$minXL..$maxXL (W=$($maxXL-$minXL+1)), Y=$minYL..$maxYL (H=$($maxYL-$minYL+1))"
    Write-Output "Right (Rendered): X=$minXR..$maxXR (W=$($maxXR-$minXR+1)), Y=$minYR..$maxYR (H=$($maxYR-$minYR+1))"
    Write-Output "Shift: dX=$($minXR - $minXL), dY=$($minYR - $minYL)"
    $bmp.Dispose()
}

DescribeCrop "01_header"
DescribeCrop "02_detran_title"
DescribeCrop "03_renavam"
DescribeCrop "04_placa_exercicio"
DescribeCrop "05_ano_fab_mod"
DescribeCrop "06_num_crv"
DescribeCrop "08_cla_cat"
DescribeCrop "09_marca_modelo"
DescribeCrop "10_especie_tipo"
DescribeCrop "11_placa_ant_chassi"
DescribeCrop "12_cor_combustivel"
DescribeCrop "13_footnote"
DescribeCrop "14_categoria_capacidade"
DescribeCrop "15_potencia_pbt"
DescribeCrop "16_motor_cmt_eixos_lot"
DescribeCrop "17_carroceria"
DescribeCrop "18_nome_proprietario"
DescribeCrop "19_cpf_cnpj"
DescribeCrop "20_local_data"
DescribeCrop "21_assinado_detran"
DescribeCrop "22_dpvat_box"
DescribeCrop "23_verso_obs"
DescribeCrop "24_verso_senatran"
DescribeCrop "25_verso_dpvat"
