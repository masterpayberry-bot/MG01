Add-Type -AssemblyName System.Drawing
Get-ChildItem -Path "assets" -Filter "*crlv*" | ForEach-Object {
    if ($_.Extension -match "\.(png|jpg|jpeg)") {
        $bmp = [System.Drawing.Bitmap]::FromFile($_.FullName)
        Write-Output "$($_.Name): $($bmp.Width) x $($bmp.Height)"
        $bmp.Dispose()
    } else {
        Write-Output "$($_.Name): ($($_.Length) bytes)"
    }
}
