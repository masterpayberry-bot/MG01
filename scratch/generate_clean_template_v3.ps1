Add-Type -AssemblyName System.Drawing

$p1 = 'C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314353311_bcc8be82.jpg'
$p2 = 'C:\Users\MG\.gemini\antigravity\brain\8ec6a49d-cc66-415d-a29f-ec99d9f06ec1\.user_uploaded\media_1794314485955_67d64884.png'

$img1 = [System.Drawing.Bitmap]::FromFile($p1)
$img2 = [System.Drawing.Bitmap]::FromFile($p2)

# Canvas 1024 x 1451
$canvas = New-Object System.Drawing.Bitmap(1024, 1451, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Desenha Frente (0, 0) - 1024 x 726
$g.DrawImage($img1, 0, 0, 1024, 726)

# Desenha Verso (0, 726) - 1024 x 725
$g.DrawImage($img2, 0, 726, 1024, 725)

# Linha tracejada horizontal sutil separando Frente e Verso na dobra
$penDash = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 180, 180), 1)
$penDash.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$g.DrawLine($penDash, 0, 725, 1024, 725)

$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# ── LIMPEZA CIRÚRGICA DOS VALORES NA FRENTE ──

# 1. UF do DETRAN (ao lado de DETRAN- )
# Na barra de subheader: DETRAN- BA -> limpar apenas "BA"
$g.FillRectangle($white, 86, 30, 70, 20)

# 2. RENAVAM (valor: 00872698394)
$g.FillRectangle($white, 48, 170, 222, 26)

# 3. PLACA & EXERCÍCIO (valores: JMI5104 & 2025)
$g.FillRectangle($white, 48, 216, 116, 26)
$g.FillRectangle($white, 168, 216, 96, 26)

# 4. ANO FAB & ANO MOD (valores: 2005 & 2006)
$g.FillRectangle($white, 48, 262, 116, 26)
$g.FillRectangle($white, 168, 262, 96, 26)

# 5. NÚMERO DO CRV (valor: ***)
$g.FillRectangle($white, 48, 308, 200, 26)

# 6. QR CODE VIO (apenas o miolo do QR Code, preservando a legenda "Valide este QRCode com app Vio" à direita se existir)
$g.FillRectangle($white, 280, 118, 176, 176)

# 7. CLA & CAT (valores: 47849505457 & ***)
$g.FillRectangle($white, 48, 442, 216, 24)
$g.FillRectangle($white, 268, 442, 180, 24)

# 8. MARCA / MODELO / VERSÃO (valor: YAMAHA/FAZER YS250)
$g.FillRectangle($white, 48, 502, 430, 24)

# 9. ESPÉCIE / TIPO (valor: PASSAGEIRO MOTOCICLETA)
$g.FillRectangle($white, 48, 564, 430, 24)

# 10. PLACA ANTERIOR & CHASSI (valores: *******/** & 9C6KG017060006367)
$g.FillRectangle($white, 48, 624, 156, 24)
$g.FillRectangle($white, 214, 624, 260, 24)

# 11. COR & COMBUSTÍVEL (valores: PRETA & GASOLINA)
$g.FillRectangle($white, 48, 684, 116, 24)
$g.FillRectangle($white, 168, 684, 200, 24)

# 12. NOTA DE RODAPÉ DE EMISSÃO
$g.FillRectangle($white, 48, 708, 430, 16)

# ── COLUNA DA DIREITA ──

# 13. CATEGORIA & CAPACIDADE (valores: PARTICULAR & * . *)
$g.FillRectangle($white, 540, 124, 304, 24)
$g.FillRectangle($white, 848, 124, 130, 24)

# 14. POTÊNCIA & PESO BRUTO (valores: 0CV/249 & 0.31)
$g.FillRectangle($white, 540, 172, 304, 24)
$g.FillRectangle($white, 848, 172, 130, 24)

# 15. MOTOR, CMT, EIXOS, LOTAÇÃO (valores: G347E-006361, * . *, *, 02P)
$g.FillRectangle($white, 540, 218, 214, 24)
$g.FillRectangle($white, 758, 218, 84, 24)
$g.FillRectangle($white, 846, 218, 44, 24)
$g.FillRectangle($white, 892, 218, 86, 24)

# 16. CARROCERIA (valor: NÃO APLICAVEL)
$g.FillRectangle($white, 540, 264, 438, 24)

# 17. NOME DO PROPRIETÁRIO (valor: JORDELIO RODRIGUES DOS SANTOS)
$g.FillRectangle($white, 540, 310, 438, 24)

# 18. CPF / CNPJ (valor: 046.660.515-38)
$g.FillRectangle($white, 760, 356, 218, 26)

# 19. LOCAL & DATA (valores: VITORIA DA CONQUISTA BA & 25/03/2025)
$g.FillRectangle($white, 540, 442, 304, 26)
$g.FillRectangle($white, 848, 442, 130, 26)

# ── VERSO (PARTE INFERIOR) ──
# 20. Caixa inteira interna de "OBSERVAÇÕES DO VEÍCULO" (deixar branca limpa para texto dinâmico)
$g.FillRectangle($white, 44, 760, 440, 200)

# Salva PNG em alta definição
$targetPng = 'c:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png'
$canvas.Save($targetPng, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "SUCCESS: Saved clean template ($($canvas.Width) x $($canvas.Height))"

# Gera o arquivo base64
$bytes = [System.IO.File]::ReadAllBytes($targetPng)
$b64 = [Convert]::ToBase64String($bytes)
$jsContent = "window.CRLV_TEMPLATE_HD_CLEAN_B64 = ""data:image/png;base64,$b64"";"

[System.IO.File]::WriteAllText('c:\Users\MG\Desktop\htdocs\assets\crlv_template_b64.js', $jsContent)
[System.IO.File]::WriteAllText('c:\Users\MG\Desktop\htdocs\assets\crlv_assets_b64.js', $jsContent)

Write-Output "SUCCESS: Base64 files updated!"

$white.Dispose()
$penDash.Dispose()
$g.Dispose()
$canvas.Dispose()
$img1.Dispose()
$img2.Dispose()
