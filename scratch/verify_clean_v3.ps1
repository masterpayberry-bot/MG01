Add-Type -AssemblyName System.Drawing

$tpl = [System.Drawing.Bitmap]::FromFile('C:\Users\MG\Desktop\htdocs\assets\crlv_template_hd_clean.png')

function CheckArea($name, $x1, $y1, $w, $h) {
    $dark = 0
    for ($y = $y1; $y -lt ($y1 + $h); $y++) {
        for ($x = $x1; $x -lt ($x1 + $w); $x++) {
            $c = $tpl.GetPixel($x, $y)
            if ($c.R -lt 150 -and $c.G -lt 150 -and $c.B -lt 150) { $dark++ }
        }
    }
    Write-Output "$name ($x1,$y1 to $($x1+$w),$($y1+$h)): dark count = $dark"
}

CheckArea "RENAVAM area" 54 172 150 20
CheckArea "PLACA area" 54 218 100 20
CheckArea "ANO FAB area" 54 264 100 20
CheckArea "CRV area" 54 310 100 20
CheckArea "QR area" 282 120 170 170
CheckArea "CLA area" 54 444 150 20
CheckArea "MARCA area" 54 504 200 20
CheckArea "CATEGORIA area" 544 126 150 20
CheckArea "POTENCIA area" 544 174 150 20
CheckArea "MOTOR area" 544 220 150 20
CheckArea "NOME area" 544 312 200 20
CheckArea "CPF area" 765 358 150 20
CheckArea "LOCAL area" 544 444 200 20
CheckArea "DATA area" 852 444 100 20
CheckArea "OBSERVACOES VERSO" 50 765 200 30

$tpl.Dispose()
