Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\public\logo.png"
$publicDir = Join-Path $PSScriptRoot "..\public"

$src = [System.Drawing.Bitmap]::FromFile($sourcePath)

# 1. Generate 32x32 PNG
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g32.DrawImage($src, 0, 0, 32, 32)
$g32.Dispose()
$bmp32.Save((Join-Path $publicDir "favicon-32x32.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Generate 16x16 PNG
$bmp16 = New-Object System.Drawing.Bitmap(16, 16)
$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g16.DrawImage($src, 0, 0, 16, 16)
$g16.Dispose()
$bmp16.Save((Join-Path $publicDir "favicon-16x16.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Generate 48x48 PNG
$bmp48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g48.DrawImage($src, 0, 0, 48, 48)
$g48.Dispose()
$bmp48.Save((Join-Path $publicDir "favicon-48x48.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 4. Generate 180x180 Apple Touch Icon
$bmp180 = New-Object System.Drawing.Bitmap(180, 180)
$g180 = [System.Drawing.Graphics]::FromImage($bmp180)
$g180.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g180.DrawImage($src, 0, 0, 180, 180)
$g180.Dispose()
$bmp180.Save((Join-Path $publicDir "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)

# 5. Generate standard favicon.ico from 32x32 bitmap
$hIcon = $bmp32.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite((Join-Path $publicDir "favicon.ico"))
$ico.Save($fs)
$fs.Close()
$ico.Dispose()

$bmp16.Dispose()
$bmp32.Dispose()
$bmp48.Dispose()
$bmp180.Dispose()
$src.Dispose()

Write-Host "Favicons generated successfully in public/"
