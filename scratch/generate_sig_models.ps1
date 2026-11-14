Add-Type -AssemblyName System.Drawing

function Create-Signature-Image {
    param(
        [string]$outputPath,
        [scriptblock]$drawAction,
        [string]$hexColor = "#0e3573",
        [int]$w = 480,
        [int]$h = 140
    )

    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $color = [System.Drawing.ColorTranslator]::FromHtml($hexColor)
    & $drawAction $g $w $h $color

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

function Draw-BezierCurve {
    param($g, $pen, [System.Drawing.PointF[]]$points)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddCurve($points, 0.5)
    $g.DrawPath($pen, $path)
    $path.Dispose()
}

# --- MODELO 1: ANTONIO (Rúbrica Executiva com 'A' Amplo e Arremate Rápido) ---
$drawAntonio1 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.6
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pThick = New-Object System.Drawing.Pen $color, 3.5
    $pThick.StartCap = 'Round'; $pThick.EndCap = 'Round'

    # Traço inicial ascendente forte do 'A'
    Draw-BezierCurve $g $pThick @(
        [System.Drawing.PointF]::new(45, 115),
        [System.Drawing.PointF]::new(60, 45),
        [System.Drawing.PointF]::new(82, 22),
        [System.Drawing.PointF]::new(98, 30),
        [System.Drawing.PointF]::new(105, 55),
        [System.Drawing.PointF]::new(92, 98),
        [System.Drawing.PointF]::new(78, 118)
    )

    # Laço interno e saída horizontal rápida
    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(68, 76),
        [System.Drawing.PointF]::new(115, 68),
        [System.Drawing.PointF]::new(140, 58),
        [System.Drawing.PointF]::new(158, 75),
        [System.Drawing.PointF]::new(175, 52),
        [System.Drawing.PointF]::new(192, 80),
        [System.Drawing.PointF]::new(210, 62)
    )

    # Onda executiva 'Amorim' estilizada
    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(210, 62),
        [System.Drawing.PointF]::new(230, 48),
        [System.Drawing.PointF]::new(245, 78),
        [System.Drawing.PointF]::new(262, 54),
        [System.Drawing.PointF]::new(280, 72),
        [System.Drawing.PointF]::new(305, 42),
        [System.Drawing.PointF]::new(330, 85),
        [System.Drawing.PointF]::new(365, 70),
        [System.Drawing.PointF]::new(410, 76)
    )

    # Traço inferior horizontal enérgico
    Draw-BezierCurve $g $pThick @(
        [System.Drawing.PointF]::new(95, 122),
        [System.Drawing.PointF]::new(180, 116),
        [System.Drawing.PointF]::new(280, 114),
        [System.Drawing.PointF]::new(390, 110),
        [System.Drawing.PointF]::new(435, 102)
    )
}

# --- MODELO 1: JOSE ADELSON (Escrita Cursiva Fluida com 'J' Descendente) ---
$drawJose1 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.4
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pLight = New-Object System.Drawing.Pen $color, 1.9
    $pLight.StartCap = 'Round'; $pLight.EndCap = 'Round'

    # 'J' maiúsculo fluido iniciando em laço superior e descendo fundo
    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(48, 52),
        [System.Drawing.PointF]::new(65, 32),
        [System.Drawing.PointF]::new(88, 30),
        [System.Drawing.PointF]::new(78, 55),
        [System.Drawing.PointF]::new(72, 85),
        [System.Drawing.PointF]::new(65, 124),
        [System.Drawing.PointF]::new(50, 134),
        [System.Drawing.PointF]::new(42, 120),
        [System.Drawing.PointF]::new(58, 98),
        [System.Drawing.PointF]::new(85, 78)
    )

    # Conexão 'ose'
    Draw-BezierCurve $g $pLight @(
        [System.Drawing.PointF]::new(85, 78),
        [System.Drawing.PointF]::new(102, 70),
        [System.Drawing.PointF]::new(115, 84),
        [System.Drawing.PointF]::new(128, 68),
        [System.Drawing.PointF]::new(138, 82),
        [System.Drawing.PointF]::new(150, 68),
        [System.Drawing.PointF]::new(162, 82)
    )

    # 'A' de Adelson espaçado e cursivo
    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(178, 86),
        [System.Drawing.PointF]::new(192, 48),
        [System.Drawing.PointF]::new(206, 46),
        [System.Drawing.PointF]::new(214, 82),
        [System.Drawing.PointF]::new(205, 88),
        [System.Drawing.PointF]::new(192, 72),
        [System.Drawing.PointF]::new(225, 68)
    )

    # 'delson' com haste alta
    Draw-BezierCurve $g $pLight @(
        [System.Drawing.PointF]::new(225, 68),
        [System.Drawing.PointF]::new(238, 82),
        [System.Drawing.PointF]::new(245, 38),
        [System.Drawing.PointF]::new(248, 82),
        [System.Drawing.PointF]::new(262, 72),
        [System.Drawing.PointF]::new(274, 32),
        [System.Drawing.PointF]::new(278, 80),
        [System.Drawing.PointF]::new(292, 70),
        [System.Drawing.PointF]::new(305, 82),
        [System.Drawing.PointF]::new(318, 70),
        [System.Drawing.PointF]::new(332, 82)
    )

    # 'F. Sousa'
    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(352, 42),
        [System.Drawing.PointF]::new(368, 38),
        [System.Drawing.PointF]::new(360, 68),
        [System.Drawing.PointF]::new(358, 108),
        [System.Drawing.PointF]::new(370, 112)
    )
    Draw-BezierCurve $g $pLight @(
        [System.Drawing.PointF]::new(348, 62),
        [System.Drawing.PointF]::new(378, 58)
    )
    Draw-BezierCurve $g $pLight @(
        [System.Drawing.PointF]::new(385, 78),
        [System.Drawing.PointF]::new(398, 66),
        [System.Drawing.PointF]::new(412, 80),
        [System.Drawing.PointF]::new(428, 68),
        [System.Drawing.PointF]::new(442, 82),
        [System.Drawing.PointF]::new(458, 75)
    )
}

# --- MODELO 2: ANTONIO (Rúbrica Curta Notarial Dinâmica) ---
$drawAntonio2 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.7
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pHeavy = New-Object System.Drawing.Pen $color, 3.8
    $pHeavy.StartCap = 'Round'; $pHeavy.EndCap = 'Round'

    Draw-BezierCurve $g $pHeavy @(
        [System.Drawing.PointF]::new(80, 110),
        [System.Drawing.PointF]::new(52, 70),
        [System.Drawing.PointF]::new(68, 28),
        [System.Drawing.PointF]::new(110, 22),
        [System.Drawing.PointF]::new(135, 50),
        [System.Drawing.PointF]::new(125, 95),
        [System.Drawing.PointF]::new(95, 118)
    )

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(45, 68),
        [System.Drawing.PointF]::new(155, 62),
        [System.Drawing.PointF]::new(190, 48),
        [System.Drawing.PointF]::new(215, 82),
        [System.Drawing.PointF]::new(240, 52),
        [System.Drawing.PointF]::new(270, 78),
        [System.Drawing.PointF]::new(310, 50)
    )

    Draw-BezierCurve $g $pHeavy @(
        [System.Drawing.PointF]::new(310, 50),
        [System.Drawing.PointF]::new(345, 38),
        [System.Drawing.PointF]::new(365, 68),
        [System.Drawing.PointF]::new(340, 105),
        [System.Drawing.PointF]::new(250, 118),
        [System.Drawing.PointF]::new(160, 122),
        [System.Drawing.PointF]::new(380, 108),
        [System.Drawing.PointF]::new(430, 98)
    )
}

# --- MODELO 2: JOSE ADELSON (Cursivo Clássico Formal) ---
$drawJose2 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.3
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pThin = New-Object System.Drawing.Pen $color, 1.8
    $pThin.StartCap = 'Round'; $pThin.EndCap = 'Round'

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(40, 42),
        [System.Drawing.PointF]::new(65, 30),
        [System.Drawing.PointF]::new(78, 48),
        [System.Drawing.PointF]::new(70, 80),
        [System.Drawing.PointF]::new(58, 120),
        [System.Drawing.PointF]::new(42, 125),
        [System.Drawing.PointF]::new(40, 110),
        [System.Drawing.PointF]::new(58, 88),
        [System.Drawing.PointF]::new(82, 75)
    )

    Draw-BezierCurve $g $p @([System.Drawing.PointF]::new(82, 28), [System.Drawing.PointF]::new(84, 30))

    Draw-BezierCurve $g $pThin @(
        [System.Drawing.PointF]::new(98, 82),
        [System.Drawing.PointF]::new(115, 58),
        [System.Drawing.PointF]::new(128, 56),
        [System.Drawing.PointF]::new(135, 82),
        [System.Drawing.PointF]::new(122, 84),
        [System.Drawing.PointF]::new(148, 76),
        [System.Drawing.PointF]::new(158, 42),
        [System.Drawing.PointF]::new(160, 82),
        [System.Drawing.PointF]::new(172, 72),
        [System.Drawing.PointF]::new(184, 36),
        [System.Drawing.PointF]::new(188, 80),
        [System.Drawing.PointF]::new(202, 70),
        [System.Drawing.PointF]::new(214, 82),
        [System.Drawing.PointF]::new(228, 70),
        [System.Drawing.PointF]::new(242, 82)
    )

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(262, 50),
        [System.Drawing.PointF]::new(278, 45),
        [System.Drawing.PointF]::new(272, 85),
        [System.Drawing.PointF]::new(268, 110)
    )
    Draw-BezierCurve $g $pThin @([System.Drawing.PointF]::new(258, 65), [System.Drawing.PointF]::new(282, 62))
    Draw-BezierCurve $g $pThin @(
        [System.Drawing.PointF]::new(296, 78),
        [System.Drawing.PointF]::new(304, 52),
        [System.Drawing.PointF]::new(308, 80),
        [System.Drawing.PointF]::new(320, 72),
        [System.Drawing.PointF]::new(336, 68),
        [System.Drawing.PointF]::new(350, 52),
        [System.Drawing.PointF]::new(360, 80),
        [System.Drawing.PointF]::new(374, 70),
        [System.Drawing.PointF]::new(388, 82),
        [System.Drawing.PointF]::new(402, 68),
        [System.Drawing.PointF]::new(418, 82),
        [System.Drawing.PointF]::new(432, 74)
    )
}

# --- MODELO 3: ANTONIO (Assinatura Tradicional com Iniciais e Sobrenome) ---
$drawAntonio3 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.5
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pThin = New-Object System.Drawing.Pen $color, 1.9
    $pThin.StartCap = 'Round'; $pThin.EndCap = 'Round'

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(40, 92),
        [System.Drawing.PointF]::new(62, 38),
        [System.Drawing.PointF]::new(75, 34),
        [System.Drawing.PointF]::new(88, 92),
        [System.Drawing.PointF]::new(80, 94),
        [System.Drawing.PointF]::new(58, 68),
        [System.Drawing.PointF]::new(95, 64)
    )
    Draw-BezierCurve $g $p @([System.Drawing.PointF]::new(105, 88), [System.Drawing.PointF]::new(107, 90))

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(125, 40),
        [System.Drawing.PointF]::new(122, 90),
        [System.Drawing.PointF]::new(145, 52),
        [System.Drawing.PointF]::new(158, 65),
        [System.Drawing.PointF]::new(142, 70),
        [System.Drawing.PointF]::new(165, 86)
    )
    Draw-BezierCurve $g $pThin @(
        [System.Drawing.PointF]::new(165, 86),
        [System.Drawing.PointF]::new(178, 72),
        [System.Drawing.PointF]::new(192, 84),
        [System.Drawing.PointF]::new(205, 68),
        [System.Drawing.PointF]::new(218, 82),
        [System.Drawing.PointF]::new(232, 72),
        [System.Drawing.PointF]::new(245, 84)
    )

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(265, 84),
        [System.Drawing.PointF]::new(280, 42),
        [System.Drawing.PointF]::new(292, 40),
        [System.Drawing.PointF]::new(302, 82)
    )
    Draw-BezierCurve $g $pThin @(
        [System.Drawing.PointF]::new(302, 82),
        [System.Drawing.PointF]::new(315, 68),
        [System.Drawing.PointF]::new(328, 80),
        [System.Drawing.PointF]::new(340, 68),
        [System.Drawing.PointF]::new(352, 80),
        [System.Drawing.PointF]::new(365, 70),
        [System.Drawing.PointF]::new(378, 82),
        [System.Drawing.PointF]::new(392, 68),
        [System.Drawing.PointF]::new(405, 82),
        [System.Drawing.PointF]::new(420, 75)
    )
}

# --- MODELO 3: JOSE ADELSON (Rúbrica Técnica Notarial) ---
$drawJose3 = {
    param($g, $w, $h, $color)
    $p = New-Object System.Drawing.Pen $color, 2.7
    $p.StartCap = 'Round'; $p.EndCap = 'Round'; $p.LineJoin = 'Round'
    $pThick = New-Object System.Drawing.Pen $color, 3.6
    $pThick.StartCap = 'Round'; $pThick.EndCap = 'Round'

    Draw-BezierCurve $g $pThick @(
        [System.Drawing.PointF]::new(60, 45),
        [System.Drawing.PointF]::new(95, 32),
        [System.Drawing.PointF]::new(110, 55),
        [System.Drawing.PointF]::new(90, 105),
        [System.Drawing.PointF]::new(70, 125),
        [System.Drawing.PointF]::new(52, 115),
        [System.Drawing.PointF]::new(68, 85),
        [System.Drawing.PointF]::new(125, 68)
    )

    Draw-BezierCurve $g $p @(
        [System.Drawing.PointF]::new(125, 68),
        [System.Drawing.PointF]::new(165, 52),
        [System.Drawing.PointF]::new(185, 78),
        [System.Drawing.PointF]::new(215, 48),
        [System.Drawing.PointF]::new(245, 82),
        [System.Drawing.PointF]::new(275, 45),
        [System.Drawing.PointF]::new(310, 85),
        [System.Drawing.PointF]::new(350, 42),
        [System.Drawing.PointF]::new(390, 80)
    )

    Draw-BezierCurve $g $pThick @(
        [System.Drawing.PointF]::new(115, 115),
        [System.Drawing.PointF]::new(220, 108),
        [System.Drawing.PointF]::new(340, 102),
        [System.Drawing.PointF]::new(440, 85)
    )
}

# 1. Azul Caneta Bic / Notarial
Create-Signature-Image "$PWD\assets\sig_antonio_mod1.png" $drawAntonio1 "#0e3573"
Create-Signature-Image "$PWD\assets\sig_jose_mod1.png" $drawJose1 "#13418b"

Create-Signature-Image "$PWD\assets\sig_antonio_mod2.png" $drawAntonio2 "#0b2c63"
Create-Signature-Image "$PWD\assets\sig_jose_mod2.png" $drawJose2 "#164a9c"

Create-Signature-Image "$PWD\assets\sig_antonio_mod3.png" $drawAntonio3 "#0d2d5e"
Create-Signature-Image "$PWD\assets\sig_jose_mod3.png" $drawJose3 "#113b80"

# 2. Tinta Preta Nanquim / Documental
Create-Signature-Image "$PWD\assets\sig_antonio_mod1_preto.png" $drawAntonio1 "#18181b"
Create-Signature-Image "$PWD\assets\sig_jose_mod1_preto.png" $drawJose1 "#18181b"

Create-Signature-Image "$PWD\assets\sig_antonio_mod2_preto.png" $drawAntonio2 "#18181b"
Create-Signature-Image "$PWD\assets\sig_jose_mod2_preto.png" $drawJose2 "#18181b"

Create-Signature-Image "$PWD\assets\sig_antonio_mod3_preto.png" $drawAntonio3 "#18181b"
Create-Signature-Image "$PWD\assets\sig_jose_mod3_preto.png" $drawJose3 "#18181b"

# Padrão Principal
Copy-Item "$PWD\assets\sig_antonio_mod1.png" "$PWD\assets\sig_antonio_amorim.png" -Force
Copy-Item "$PWD\assets\sig_jose_mod1.png" "$PWD\assets\sig_jose_adelson.png" -Force

Write-Host "All 12 signature models created successfully!"
