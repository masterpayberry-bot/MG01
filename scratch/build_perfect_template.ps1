Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328413494_d71d4876.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\d6aab914-9489-4610-841b-b6d3f49b1873\.user_uploaded\media_1794328419664_fa5611f9.png'

$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)

Write-Output "Image 1: $($img1.Width)x$($img1.Height)"
Write-Output "Image 2: $($img2.Width)x$($img2.Height)"

$totalH = $img1.Height + $img2.Height
Write-Output "Total Height without stretching: $totalH"

# Exact canvas: 1024 x 1442
$canvas = New-Object System.Drawing.Bitmap(1024, $totalH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

# Draw Image 1 at (0, 0) - exactly 1024 x 723, 1:1 pixel exact!
$g.DrawImage($img1, 0, 0, 1024, 723)

# Draw Image 2 at (0, 723) - exactly 1024 x 719, 1:1 pixel exact!
$g.DrawImage($img2, 0, 723, 1024, 719)

$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# ── CIRÚRGICA LIMPEZA DOS CAMPOS VARIÁVEIS NA FRENTE (Y < 723) ──

# 1. UF do DETRAN (ao lado de 'DETRAN- ' que fica em x:53-95, y:92-99)
$g.FillRectangle($white, 96, 90, 50, 14)

# 2. CÓDIGO RENAVAM (valor original y:177-189, x:55-167)
$g.FillRectangle($white, 52, 174, 218, 18)

# 3. PLACA & EXERCÍCIO (valor placa y:221-232, x:55-125 | exercicio x:178-218)
$g.FillRectangle($white, 52, 219, 116, 17)
$g.FillRectangle($white, 174, 219, 90, 17)

# 4. ANO FAB & ANO MOD (valor ano fab y:265-276, x:55-95 | ano mod x:178-218)
$g.FillRectangle($white, 52, 263, 116, 17)
$g.FillRectangle($white, 174, 263, 90, 17)

# 5. NÚMERO DO CRV (valor original y:312-320, x:55-85)
$g.FillRectangle($white, 52, 308, 180, 17)

# 6. QR CODE VIO OFICIAL (exatamente de x:288 a 456, y:161 a 328)
# Preserva a inscrição vertical 'Valide este QRCode com app Vio' em x:476-480!
$g.FillRectangle($white, 288, 161, 169, 167)

# 7. CÓDIGO DE SEGURANÇA DO CLA & CAT (valor cla y:447-458, x:55-167 | cat x:281-310)
$g.FillRectangle($white, 52, 444, 218, 18)
$g.FillRectangle($white, 276, 444, 160, 18)

# 8. MARCA / MODELO / VERSÃO (valor original y:507-518, x:55-240)
$g.FillRectangle($white, 52, 504, 420, 18)

# 9. ESPÉCIE / TIPO (valor original y:569-580, x:55-285)
$g.FillRectangle($white, 52, 566, 420, 18)

# 10. PLACA ANTERIOR & CHASSI (valor placa ant y:628-639, x:55-155 | chassi x:228-400)
$g.FillRectangle($white, 52, 625, 160, 18)
$g.FillRectangle($white, 218, 625, 254, 18)

# 11. COR & COMBUSTÍVEL (valor cor y:690-701, x:55-108 | combustivel x:178-260)
$g.FillRectangle($white, 52, 687, 116, 18)
$g.FillRectangle($white, 174, 687, 180, 18)

# 12. NOTA DE RODAPÉ DE EMISSÃO (original em y:710-718)
$g.FillRectangle($white, 50, 709, 420, 12)

# ── COLUNA DA DIREITA (FRENTE) ──

# 13. CATEGORIA & CAPACIDADE (categoria x:545-650, y:129-140 | capacidade x:856-886)
$g.FillRectangle($white, 542, 126, 300, 18)
$g.FillRectangle($white, 852, 126, 120, 18)

# 14. POTÊNCIA & PESO BRUTO (potencia x:545-620, y:176-187 | peso bruto x:856-896)
$g.FillRectangle($white, 542, 173, 300, 18)
$g.FillRectangle($white, 852, 173, 120, 18)

# 15. MOTOR, CMT, EIXOS, LOTAÇÃO (y:222-233)
$g.FillRectangle($white, 542, 219, 214, 18)
$g.FillRectangle($white, 760, 219, 84, 18)
$g.FillRectangle($white, 846, 219, 44, 18)
$g.FillRectangle($white, 892, 219, 80, 18)

# 16. CARROCERIA (y:266-277, x:545-670)
$g.FillRectangle($white, 542, 263, 430, 18)

# 17. NOME DO PROPRIETÁRIO (y:311-322, x:545-845)
$g.FillRectangle($white, 542, 308, 430, 18)

# 18. CPF / CNPJ (y:360-372, x:796-938)
$g.FillRectangle($white, 770, 356, 204, 20)

# 19. LOCAL & DATA (y:447-458, local x:545-785 | data x:878-980)
$g.FillRectangle($white, 542, 444, 304, 18)
$g.FillRectangle($white, 856, 444, 124, 18)

# ── VERSO (PARTE INFERIOR Y >= 723) ──
# 20. Caixa de "OBSERVAÇÕES DO VEÍCULO" no verso:
# Limpa APENAS o conteúdo de texto da caixa de observações (de y: 723+35 a 723+250, x: 44 a 480)
$g.FillRectangle($white, 44, 758, 438, 220)

$targetPng = 'C:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'
$canvas.Save($targetPng, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Saved 1:1 clean template to $targetPng ($($canvas.Width)x$($canvas.Height))"

# Atualiza Base64
$bytes = [System.IO.File]::ReadAllBytes($targetPng)
$b64 = [Convert]::ToBase64String($bytes)
$jsContent = "window.CRLV_TEMPLATE_HD_CLEAN_B64 = ""data:image/png;base64,$b64"";"
[System.IO.File]::WriteAllText('C:\Users\MG\Desktop\htdocs\assets\crlv_template_b64.js', $jsContent)
[System.IO.File]::WriteAllText('C:\Users\MG\Desktop\htdocs\assets\crlv_assets_b64.js', $jsContent)
Write-Output "Base64 assets updated!"

$white.Dispose()
$g.Dispose()
$canvas.Dispose()
$img1.Dispose()
$img2.Dispose()
