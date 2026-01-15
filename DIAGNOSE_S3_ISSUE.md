# 🔍 Diagnóstico: Error "Unexpected token '<'" en S3

## El Error que ves:
```
Uncaught SyntaxError: Unexpected token '<' (at main.1dbf5a89.js:1:1)
```

## ✅ Qué está BIEN:
- ✅ Build local correcto (`./static/js/...` rutas relativas)
- ✅ El archivo `main.1dbf5a89.js` existe y es JS válido
- ✅ CloudFront cache invalidado

## ❌ Qué está MAL:
**S3 está sirviendo HTML en lugar de JavaScript**

Cuando el navegador pide `https://atlasolympus.csaiautomations.com/static/js/main.1dbf5a89.js`, está recibiendo el contenido de `index.html` en lugar del archivo JS.

---

## 🎯 CAUSA: Content-Type incorrecto en S3

### Verificar el problema:

**Método 1: Descarga directa**
```bash
curl -I https://atlasolympus.csaiautomations.com/static/js/main.1dbf5a89.js
```

Busca la línea `Content-Type:`
- ❌ Si dice: `Content-Type: text/html` → PROBLEMA
- ✅ Si dice: `Content-Type: application/javascript` → OK

**Método 2: En S3 Console**
1. Ve a tu bucket S3
2. Navega a `static/js/main.1dbf5a89.js`
3. Click en el archivo → **Properties**
4. **Metadata** → **Content-Type**

---

## ✅ SOLUCIÓN RÁPIDA: Re-subir con AWS CLI

### Opción A: Usando el script PowerShell

```powershell
cd C:\Github\atlas-olympus

# Reemplaza con tu bucket name
.\upload-to-s3.ps1 -BucketName "tu-bucket-name"
```

### Opción B: Manualmente con AWS CLI

```bash
cd C:\Github\atlas-olympus

# Subir JS files con Content-Type correcto
aws s3 sync build s3://tu-bucket-name ^
    --exclude "*" ^
    --include "*.js" ^
    --content-type "application/javascript" ^
    --cache-control "max-age=31536000"

# Subir CSS files
aws s3 sync build s3://tu-bucket-name ^
    --exclude "*" ^
    --include "*.css" ^
    --content-type "text/css" ^
    --cache-control "max-age=31536000"

# Subir HTML (último, para que no sirva HTML en lugar de JS)
aws s3 sync build s3://tu-bucket-name ^
    --exclude "*" ^
    --include "*.html" ^
    --content-type "text/html" ^
    --cache-control "no-cache"

# Subir el resto
aws s3 sync build s3://tu-bucket-name ^
    --delete
```

### Opción C: Si NO tienes AWS CLI

1. **Borra TODO** en S3 bucket (vacía el bucket)
2. **Sube de nuevo** usando la consola de AWS, PERO:
   - Cuando subas archivos `.js`, asegúrate que Content-Type sea `application/javascript`
   - Cuando subas archivos `.css`, asegúrate que Content-Type sea `text/css`
   - Cuando subas archivos `.html`, asegúrate que Content-Type sea `text/html`

---

## 🔧 SOLUCIÓN PERMANENTE: Configurar S3

Para que S3 auto-detecte los Content-Types correctamente en el futuro:

### Usar AWS CLI con `--content-type-by-extension`

O mejor aún, usa una herramienta de deploy que maneje esto automáticamente.

---

## 🧪 Después de re-subir:

1. **Invalida CloudFront de nuevo:**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
   ```

2. **Espera 5-10 minutos**

3. **Hard refresh en navegador:**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

4. **Verifica en DevTools:**
   - F12 → Network tab
   - Busca `main.1dbf5a89.js`
   - En Headers, verifica: `Content-Type: application/javascript`

---

## 📊 Comparación: Lo que DEBE pasar vs Lo que ESTÁ pasando

### ✅ Correcto (lo que debe pasar):
```
Request:  GET /static/js/main.1dbf5a89.js
Response: Content-Type: application/javascript
          [código JavaScript minificado...]
```

### ❌ Incorrecto (lo que está pasando ahora):
```
Request:  GET /static/js/main.1dbf5a89.js  
Response: Content-Type: text/html
          <!doctype html><html lang="en"><head>...
```

Por eso el navegador dice "Unexpected token '<'" - está esperando JavaScript pero recibe `<!doctype html>`

---

## 🆘 Si aún no funciona después de re-subir:

### Verifica la configuración de Error Pages en CloudFront:

Ve a CloudFront → Tu distribución → Error Pages

**DEBE estar así:**

| HTTP Error Code | Response Page Path | HTTP Response Code |
|----------------|-------------------|-------------------|
| 403            | /index.html       | 200               |
| 404            | /index.html       | 200               |

**PERO SOLO PARA rutas de páginas, NO para archivos estáticos.**

El problema es que CloudFront puede estar redirigiendo `/static/js/main.js` (404) → `index.html` (200).

### Posible fix en CloudFront:

Necesitas configurar **Origin** behaviors para que:
- Rutas `/static/*` → Se sirvan directo desde S3, SIN error handling
- Rutas `/*` (páginas) → Usen error handling con index.html

---

## 🎯 Resumen del problema:

```
Browser solicita: /static/js/main.1dbf5a89.js
    ↓
CloudFront/S3 responde: 404 Not Found
    ↓
CloudFront Error Pages: "Si 404, servir index.html"
    ↓
Browser recibe: <!doctype html>...
    ↓
Browser espera JS pero recibe HTML
    ↓
ERROR: Unexpected token '<'
```

---

## ✅ Solución en pasos:

1. **Re-subir archivos con Content-Types correctos** (usar script o AWS CLI)
2. **Invalidar CloudFront cache**
3. **Esperar 5-10 min**
4. **Hard refresh en navegador**
5. **Si sigue sin funcionar**: Revisar CloudFront Error Pages config

**La causa MÁS PROBABLE es Content-Type incorrecto en S3.** 🎯




