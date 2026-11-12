Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314485955_67d64884.png'

$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)

# Folha A4 HD: 1024 largura x 1451 altura
$canvas = New-Object System.Drawing.Bitmap(1024, 1451, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Desenha Frente (0, 0)
$g.DrawImage($img1, 0, 0, 1024, 726)

# Desenha Verso (0, 726)
$g.DrawImage($img2, 0, 726, 1024, 725)

# Linha tracejada horizontal sutil de dobra entre Frente e Verso
$penDash = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 200, 200), 1)
$penDash.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$g.DrawLine($penDash, 0, 725, 1024, 725)

$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# ── LIMPEZA CIRÚRGICA DOS VALORES NA FRENTE ──

# 1. UF do DETRAN (ao lado do rótulo "DETRAN- " que fica em x:53-95, y:93-98)
$g.FillRectangle($white, 96, 88, 60, 18)

# 2. CÓDIGO RENAVAM (valor original em y:176-187, x:54-163)
$g.FillRectangle($white, 50, 172, 222, 22)

# 3. PLACA & EXERCÍCIO (valores originais em y:221-231)
$g.FillRectangle($white, 50, 218, 116, 20)
$g.FillRectangle($white, 172, 218, 96, 20)

# 4. ANO FAB & ANO MOD (valores originais em y:267-277)
$g.FillRectangle($white, 50, 264, 116, 20)
$g.FillRectangle($white, 172, 264, 96, 20)

# 5. NÚMERO DO CRV (valor original em y:312-318)
$g.FillRectangle($white, 50, 308, 200, 20)

# 6. QR CODE VIO OFICIAL (exatamente de x:286 a 454, y:158 a 326)
$g.FillRectangle($white, 286, 158, 168, 168)

# 7. CÓDIGO DE SEGURANÇA DO CLA & CAT (valores originais em y:445-456)
$g.FillRectangle($white, 50, 442, 216, 22)
$g.FillRectangle($white, 276, 442, 170, 22)

# 8. MARCA / MODELO / VERSÃO (valor original em y:505-518)
$g.FillRectangle($white, 50, 502, 420, 22)

# 9. ESPÉCIE / TIPO (valor original em y:567-577)
$g.FillRectangle($white, 50, 564, 420, 22)

# 10. PLACA ANTERIOR & CHASSI (valores originais em y:626-639)
$g.FillRectangle($white, 50, 624, 160, 22)
$g.FillRectangle($white, 218, 624, 252, 22)

# 11. COR & COMBUSTÍVEL (valores originais em y:689-698)
$g.FillRectangle($white, 50, 686, 116, 20)
$g.FillRectangle($white, 172, 686, 180, 20)

# 12. NOTA DE RODAPÉ DE EMISSÃO (original em y:710-717)
$g.FillRectangle($white, 50, 708, 420, 16)

# ── COLUNA DA DIREITA ──

# 13. CATEGORIA & CAPACIDADE (original em y:128-138)
$g.FillRectangle($white, 540, 126, 300, 20)
$g.FillRectangle($white, 852, 126, 120, 20)

# 14. POTÊNCIA & PESO BRUTO (original em y:177-184)
$g.FillRectangle($white, 540, 174, 300, 20)
$g.FillRectangle($white, 852, 174, 120, 20)

# 15. MOTOR, CMT, EIXOS, LOTAÇÃO (original em y:223-229)
$g.FillRectangle($white, 540, 220, 214, 20)
$g.FillRectangle($white, 760, 220, 84, 20)
$g.FillRectangle($white, 848, 220, 44, 20)
$g.FillRectangle($white, 894, 220, 80, 20)

# 16. CARROCERIA (original em y:267-274)
$g.FillRectangle($white, 540, 265, 430, 20)

# 17. NOME DO PROPRIETÁRIO (original em y:312-324)
$g.FillRectangle($white, 540, 310, 430, 22)

# 18. CPF / CNPJ (original em y:364-372)
$g.FillRectangle($white, 764, 358, 210, 22)

# 19. LOCAL & DATA (original em y:445-458)
$g.FillRectangle($white, 540, 442, 304, 24)
$g.FillRectangle($white, 852, 442, 124, 24)

# ── VERSO (PARTE INFERIOR) ──
# 20. Caixa de "OBSERVAÇÕES DO VEÍCULO" no verso (limpar conteúdo original de y:760 a 950)
$g.FillRectangle($white, 44, 760, 436, 190)

# Salva PNG em HD
$targetPng = 'c:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'
$canvas.Save($targetPng, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "SUCCESS: Generated 100% clean template at $targetPng"

# Gera Base64
$bytes = [System.IO.File]::ReadAllBytes($targetPng)
$b64 = [Convert]::ToBase64String($bytes)
$jsContent = "window.CRLV_TEMPLATE_HD_CLEAN_B64 = ""data:image/png;base64,$b64"";"

[System.IO.File]::WriteAllText('c:\Users\MG\Desktop\htdocs\assets\crlv_template_b64.js', $jsContent)
[System.IO.File]::WriteAllText('c:\Users\MG\Desktop\htdocs\assets\crlv_assets_b64.js', $jsContent)

Write-Output "SUCCESS: Base64 files updated successfully."

$white.Dispose()
$penDash.Dispose()
$g.Dispose()
$canvas.Dispose()
$img1.Dispose()
$img2.Dispose()
