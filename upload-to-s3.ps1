# Script para subir build a S3 con Content-Types correctos
# Uso: .\upload-to-s3.ps1 -BucketName "tu-bucket-name"

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$BuildPath = ".\build"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Subiendo build a S3" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bucket: $BucketName" -ForegroundColor Yellow
Write-Host "Build Path: $BuildPath" -ForegroundColor Yellow
Write-Host ""

# Verificar que existe la carpeta build
if (-not (Test-Path $BuildPath)) {
    Write-Host "ERROR: No existe la carpeta $BuildPath" -ForegroundColor Red
    Write-Host "Ejecuta primero: npm run build" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe AWS CLI
try {
    aws --version | Out-Null
} catch {
    Write-Host "ERROR: AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "Instálalo desde: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Subiendo archivos..." -ForegroundColor Green
Write-Host ""

# Subir HTML files
Write-Host "→ Subiendo HTML files..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.html" `
    --content-type "text/html" `
    --cache-control "no-cache, no-store, must-revalidate" `
    --delete

# Subir JS files
Write-Host "→ Subiendo JS files..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.js" `
    --content-type "application/javascript" `
    --cache-control "max-age=31536000"

# Subir CSS files
Write-Host "→ Subiendo CSS files..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.css" `
    --content-type "text/css" `
    --cache-control "max-age=31536000"

# Subir JSON files
Write-Host "→ Subiendo JSON files..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.json" `
    --content-type "application/json" `
    --cache-control "no-cache"

# Subir imágenes
Write-Host "→ Subiendo imágenes..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.png" `
    --include "*.jpg" `
    --include "*.jpeg" `
    --include "*.gif" `
    --include "*.svg" `
    --include "*.ico" `
    --content-type "image/*" `
    --cache-control "max-age=31536000"

# Subir source maps
Write-Host "→ Subiendo source maps..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.map" `
    --content-type "application/json" `
    --cache-control "max-age=31536000"

# Subir txt files
Write-Host "→ Subiendo txt files..." -ForegroundColor Cyan
aws s3 sync $BuildPath s3://$BucketName `
    --exclude "*" `
    --include "*.txt" `
    --content-type "text/plain" `
    --cache-control "max-age=31536000"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✓ Upload completado" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: Invalidar CloudFront cache" -ForegroundColor Yellow
Write-Host "aws cloudfront create-invalidation --distribution-id YOUR_ID --paths '/*'" -ForegroundColor Cyan




