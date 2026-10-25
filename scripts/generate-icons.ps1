Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\public\icons"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

function Create-Icon([int]$size, [string]$filename) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Indigo Circle Background
    $rect = New-Object System.Drawing.Rectangle(1, 1, ($size - 2), ($size - 2))
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(79, 70, 229)) # #4f46e5
    $g.FillEllipse($brush, $rect)

    # Shield pen
    $penWidth = [Math]::Max(1.5, [float]($size / 10))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $pad = [float]($size * 0.22)
    $w = [float]($size - ($pad * 2))
    $h = [float]($size - ($pad * 2))

    $p1 = New-Object System.Drawing.PointF(([float]($size / 2)), $pad)
    $p2 = New-Object System.Drawing.PointF(([float]($size - $pad)), ([float]($pad + $h * 0.3)))
    $p3 = New-Object System.Drawing.PointF(([float]($size / 2)), ([float]($size - $pad)))
    $p4 = New-Object System.Drawing.PointF($pad, ([float]($pad + $h * 0.3)))
    
    $points = [System.Drawing.PointF[]]@($p1, $p2, $p3, $p4)
    $g.DrawPolygon($pen, $points)

    # Inner Checkmark
    $chkWidth = [Math]::Max(1.2, [float]($size / 12))
    $chkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $chkWidth)
    $chkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $chkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($chkPen, [float]($size * 0.42), [float]($size * 0.52), [float]($size * 0.49), [float]($size * 0.60))
    $g.DrawLine($chkPen, [float]($size * 0.49), [float]($size * 0.60), [float]($size * 0.62), [float]($size * 0.44))

    $target = Join-Path $outDir $filename
    $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Successfully generated: $target ($size x $size)"
}

Create-Icon 16 "icon-16.png"
Create-Icon 48 "icon-48.png"
Create-Icon 128 "icon-128.png"

