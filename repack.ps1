$zipName = 'deploy_vps.zip'
$tmpZip = Join-Path $env:TEMP $zipName
if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }

Compress-Archive -Path * -DestinationPath $tmpZip -Force

$targets = @(
    'C:\Users\MG\Desktop\deploy_vps.zip',
    'C:\Users\MG\Desktop\DEPLOY_VPS_COMPLETO\deploy_vps.zip',
    'C:\xampp\htdocs\mgeditaveis\deploy_vps.zip',
    'c:\Users\MG\Desktop\MGEditaveis (2)\deploy_vps.zip'
)

foreach ($t in $targets) {
    $parent = Split-Path $t -Parent
    if (Test-Path $parent) {
        Copy-Item $tmpZip -Destination $t -Force
        $len = (Get-Item $t).Length
        Write-Host "Updated ZIP: $t ($len bytes)"
    }
}
Remove-Item $tmpZip -Force
