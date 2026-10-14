Add-Type -AssemblyName System.Drawing

$srcPath = "d:\Webites\StarBy\public\images\fregoro-emblem.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source file not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Generate-IconPng {
    param(
        [int]$size,
        [string]$outPath,
        [bool]$darkBadge = $true
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.Clear([System.Drawing.Color]::Transparent)
    
    if ($darkBadge) {
        # Draw sleek dark rounded background
        $badgeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 14, 16))
        $g.FillEllipse($badgeBrush, 0, 0, $size, $size)
        
        # Subtle border ring
        $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80, 59, 94, 255), [Math]::Max(1, [int]($size / 32)))
        $g.DrawEllipse($borderPen, 0, 0, $size - 1, $size - 1)
        
        $borderPen.Dispose()
        $badgeBrush.Dispose()
    }
    
    # Calculate dimensions to fit the 1024x438 emblem inside with padding
    $pad = [int]($size * 0.1)
    $availW = $size - ($pad * 2)
    $availH = $size - ($pad * 2)
    
    $scale = [Math]::Min($availW / $srcImg.Width, $availH / $srcImg.Height)
    $drawW = [int]($srcImg.Width * $scale)
    $drawH = [int]($srcImg.Height * $scale)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)
    
    $destRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawW, $drawH
    $g.DrawImage($srcImg, $destRect, 0, 0, $srcImg.Width, $srcImg.Height, [System.Drawing.GraphicsUnit]::Pixel)
    
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $outPath ($size x $size)"
}

# Generate candidate icons in public and app
Generate-IconPng -size 256 -outPath "d:\Webites\StarBy\public\icon-256.png" -darkBadge $true
Generate-IconPng -size 192 -outPath "d:\Webites\StarBy\public\icon-192.png" -darkBadge $true
Generate-IconPng -size 32  -outPath "d:\Webites\StarBy\public\icon-32.png"  -darkBadge $true
Generate-IconPng -size 32  -outPath "d:\Webites\StarBy\public\icon-32-transparent.png" -darkBadge $false

$srcImg.Dispose()
Write-Host "Done icon generation."
