Add-Type -AssemblyName System.Drawing

$srcPath = "d:\Webites\StarBy\public\images\fregoro-emblem.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Generate-WhiteIcon {
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
        # Sleek dark circular background (#0B0B0E)
        $badgeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 11, 14))
        $g.FillEllipse($badgeBrush, 0, 0, $size, $size)
        
        # Crisp brand border in electric cobalt
        $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 59, 94, 255), [Math]::Max(1.5, [float]($size / 40)))
        $g.DrawEllipse($borderPen, 0.5, 0.5, $size - 1, $size - 1)
        
        $borderPen.Dispose()
        $badgeBrush.Dispose()
    }
    
    # Fill ~92% width so emblem features are bold and crisp in tab
    $availW = [int]($size * 0.92)
    $availH = [int]($size * 0.92)
    
    $scale = [Math]::Min($availW / $srcImg.Width, $availH / $srcImg.Height)
    $drawW = [int]($srcImg.Width * $scale)
    $drawH = [int]($srcImg.Height * $scale)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)
    
    # Invert color matrix: black artwork -> pure white #FFFFFF
    $colorMatrix = New-Object System.Drawing.Imaging.ColorMatrix
    $colorMatrix.Matrix00 = -1.0
    $colorMatrix.Matrix11 = -1.0
    $colorMatrix.Matrix22 = -1.0
    $colorMatrix.Matrix33 = 1.0
    $colorMatrix.Matrix40 = 1.0
    $colorMatrix.Matrix41 = 1.0
    $colorMatrix.Matrix42 = 1.0
    $colorMatrix.Matrix44 = 1.0

    $imgAttrs = New-Object System.Drawing.Imaging.ImageAttributes
    $imgAttrs.SetColorMatrix($colorMatrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)

    $destRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawW, $drawH
    $g.DrawImage(
        $srcImg, 
        $destRect, 
        0, 0, $srcImg.Width, $srcImg.Height, 
        [System.Drawing.GraphicsUnit]::Pixel, 
        $imgAttrs
    )
    
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $imgAttrs.Dispose()
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $outPath ($size x $size)"
}

Generate-WhiteIcon -size 512 -outPath "d:\Webites\StarBy\public\icon-512.png" -darkBadge $true
Generate-WhiteIcon -size 256 -outPath "d:\Webites\StarBy\public\icon-256.png" -darkBadge $true
Generate-WhiteIcon -size 192 -outPath "d:\Webites\StarBy\public\icon-192.png" -darkBadge $true
Generate-WhiteIcon -size 180 -outPath "d:\Webites\StarBy\public\apple-touch-icon.png" -darkBadge $true
Generate-WhiteIcon -size 32  -outPath "d:\Webites\StarBy\public\icon-32.png"  -darkBadge $true
Generate-WhiteIcon -size 16  -outPath "d:\Webites\StarBy\public\icon-16.png"  -darkBadge $true

# Also copy to app/ for Next.js App Router metadata conventions
Copy-Item "d:\Webites\StarBy\public\icon-256.png" "d:\Webites\StarBy\app\icon.png" -Force
Copy-Item "d:\Webites\StarBy\public\apple-touch-icon.png" "d:\Webites\StarBy\app\apple-icon.png" -Force

$srcImg.Dispose()
