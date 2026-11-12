Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'
$rPath = 'C:\Users\MG\Desktop\htdocs\scratch\sheet_rendered.png'

$i1 = [System.Drawing.Bitmap]::FromFile($p1)
$i2 = [System.Drawing.Bitmap]::FromFile($p2)
$iR = [System.Drawing.Bitmap]::FromFile($rPath)

# Target full height is 723 + 719 = 1442
$target = New-Object System.Drawing.Bitmap(1024, 1442, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gt = [System.Drawing.Graphics]::FromImage($target)
$gt.DrawImage($i1, 0, 0, 1024, $i1.Height)
$gt.DrawImage($i2, 0, $i1.Height, 1024, $i2.Height)

# List of regions to compare (x, y, w, h, name)
$regions = @(
    @{ Name = "01_header"; X = 0; Y = 0; W = 1024; H = 74 },
    @{ Name = "02_detran_title"; X = 45; Y = 75; W = 450; H = 55 },
    @{ Name = "03_renavam"; X = 50; Y = 135; W = 220; H = 65 },
    @{ Name = "04_placa_exercicio"; X = 50; Y = 200; W = 220; H = 50 },
    @{ Name = "05_ano_fab_mod"; X = 50; Y = 245; W = 220; H = 50 },
    @{ Name = "06_num_crv"; X = 50; Y = 295; W = 220; H = 45 },
    @{ Name = "07_qr_code_vio"; X = 270; Y = 135; W = 220; H = 205 },
    @{ Name = "08_cla_cat"; X = 50; Y = 415; W = 430; H = 60 },
    @{ Name = "09_marca_modelo"; X = 50; Y = 475; W = 430; H = 55 },
    @{ Name = "10_especie_tipo"; X = 50; Y = 535; W = 430; H = 55 },
    @{ Name = "11_placa_ant_chassi"; X = 50; Y = 595; W = 430; H = 55 },
    @{ Name = "12_cor_combustivel"; X = 50; Y = 655; W = 430; H = 50 },
    @{ Name = "13_footnote"; X = 45; Y = 705; W = 440; H = 18 },
    @{ Name = "14_categoria_capacidade"; X = 530; Y = 95; W = 450; H = 65 },
    @{ Name = "15_potencia_pbt"; X = 530; Y = 160; W = 450; H = 50 },
    @{ Name = "16_motor_cmt_eixos_lot"; X = 530; Y = 210; W = 450; H = 45 },
    @{ Name = "17_carroceria"; X = 530; Y = 255; W = 450; H = 45 },
    @{ Name = "18_nome_proprietario"; X = 530; Y = 300; W = 450; H = 45 },
    @{ Name = "19_cpf_cnpj"; X = 740; Y = 345; W = 240; H = 45 },
    @{ Name = "20_local_data"; X = 530; Y = 420; W = 450; H = 50 },
    @{ Name = "21_assinado_detran"; X = 530; Y = 470; W = 450; H = 30 },
    @{ Name = "22_dpvat_box"; X = 530; Y = 500; W = 450; H = 215 },
    @{ Name = "23_verso_obs"; X = 40; Y = 740; W = 450; H = 250 },
    @{ Name = "24_verso_senatran"; X = 40; Y = 1200; W = 450; H = 230 },
    @{ Name = "25_verso_dpvat"; X = 530; Y = 740; W = 450; H = 690 }
)

$outDir = 'C:\Users\MG\Desktop\htdocs\scratch\crops'
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

foreach ($r in $regions) {
    # Create side-by-side: Left = Target, Right = Rendered
    $compBmp = New-Object System.Drawing.Bitmap(($r.W * 2 + 10), $r.H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gc = [System.Drawing.Graphics]::FromImage($compBmp)
    $gc.Clear([System.Drawing.Color]::LightGray)

    $rectTarget = New-Object System.Drawing.Rectangle($r.X, $r.Y, $r.W, $r.H)
    $rectR = New-Object System.Drawing.Rectangle($r.X, $r.Y, $r.W, $r.H)

    $cropT = $target.Clone($rectTarget, $target.PixelFormat)
    $cropR = $iR.Clone($rectR, $iR.PixelFormat)

    $gc.DrawImage($cropT, 0, 0)
    $gc.DrawImage($cropR, ($r.W + 10), 0)

    $compBmp.Save("$outDir\$($r.Name).png", [System.Drawing.Imaging.ImageFormat]::Png)

    $cropT.Dispose()
    $cropR.Dispose()
    $gc.Dispose()
    $compBmp.Dispose()
    Write-Output "Saved crop: $($r.Name)"
}

$gt.Dispose()
$target.Dispose()
$i1.Dispose()
$i2.Dispose()
$iR.Dispose()
Write-Output "All crops generated successfully!"
