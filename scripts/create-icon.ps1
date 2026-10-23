Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background circle
$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 33, 33, 33))
$g.FillEllipse($bgBrush, 8, 8, 240, 240)

# Ring border
$borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 34, 197, 94)), 10
$g.DrawEllipse($borderPen, 14, 14, 228, 228)

# Center Symbol ₫
$font = New-Object System.Drawing.Font 'Arial', 105, ([System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 236, 236, 236))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF 0, 10, 256, 256
$g.DrawString([char]0x20ab, $font, $textBrush, $rect, $sf)

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream 'app-icon.ico', ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$g.Dispose()
$bmp.Dispose()
Write-Host "Icon created successfully."
