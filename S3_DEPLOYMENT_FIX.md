# 🚀 Solución: Error de Rutas en S3 Deployment

## 🔴 El Problema
```
Uncaught SyntaxError: Unexpected token '<'
```

**Causa:** El build de React generaba rutas absolutas (`/static/js/...`) que no funcionan correctamente en S3.

---

## ✅ Solución Aplicada

### **1. Configuración de `package.json`**

Se agregó `"homepage": "."` para generar rutas relativas:

```json
{
  "name": "atlas-olympus",
  "version": "0.1.0",
  "private": true,
  "homepage": ".",  // ← AGREGADO
  "dependencies": {
    ...
  }
}
```

**Efecto:**
- ❌ Antes: `<script src="/static/js/main.js"></script>` (ruta absoluta)
- ✅ Ahora: `<script src="./static/js/main.js"></script>` (ruta relativa)

---

## 📋 Pasos para Aplicar el Fix

### **Paso 1: Rebuild**
```bash
cd C:\Github\atlas-olympus
npm run build
```

Esto generará un nuevo build en la carpeta `build/` con rutas relativas.

### **Paso 2: Verificar el Build Local**

Antes de subir a S3, verifica que funciona localmente:

```bash
# Opción A: Usar serve
npx serve -s build

# Opción B: Usar Python
cd build
python -m http.server 8000
```

Abre `http://localhost:8000` y verifica que todo funciona.

### **Paso 3: Subir a S3**

Sube **TODO** el contenido de la carpeta `build/` a tu bucket S3.

**IMPORTANTE:** Asegúrate de que el bucket S3 esté configurado correctamente para SPAs.

---

## 🔧 Configuración REQUERIDA de S3

### **A. Configurar S3 como Static Website Hosting**

1. Ve a tu bucket S3 en AWS Console
2. **Properties** → **Static website hosting**
3. **Enable** static website hosting
4. Configura:
   - **Index document:** `index.html`
   - **Error document:** `index.html` ← **MUY IMPORTANTE para SPAs**

### **B. Configurar Bucket Policy (Acceso Público)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::TU-BUCKET-NAME/*"
    }
  ]
}
```

Reemplaza `TU-BUCKET-NAME` con el nombre real de tu bucket.

### **C. Configurar CORS (si es necesario)**

Si haces llamadas a APIs desde el frontend:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

---

## 🌐 Configuración de CloudFront (OPCIONAL pero RECOMENDADO)

Si usas CloudFront delante de S3, necesitas configurar **Error Pages**:

1. Ve a tu distribución de CloudFront
2. **Error Pages** → **Create Custom Error Response**
3. Configura para **CADA** código de error:

| HTTP Error Code | Customize Error Response | Response Page Path | HTTP Response Code |
|----------------|-------------------------|-------------------|-------------------|
| 403            | Yes                     | /index.html       | 200               |
| 404            | Yes                     | /index.html       | 200               |

**¿Por qué?** Cuando alguien refresca en `/automations`, S3 busca ese archivo y no existe, devuelve 404. Con esta config, CloudFront sirve `index.html` y React Router maneja la ruta.

---

## 🧪 Verificación Post-Deploy

Después de subir a S3, verifica:

### ✅ Checklist:
- [ ] Home page carga correctamente
- [ ] Puedes navegar entre páginas
- [ ] Al refrescar en cualquier ruta (ej: `/automations`) NO da 404
- [ ] Los assets (JS, CSS, imágenes) cargan correctamente
- [ ] La consola del navegador NO tiene errores de "Unexpected token '<'"

### 🔍 Debug en Producción:

Si aún hay errores:

1. **Abre DevTools (F12) → Network**
2. Refresca la página
3. Busca archivos que devuelvan **HTML en lugar de JS/CSS**
4. Si ves `index.html` donde debería haber `main.js`, hay un problema de rutas

---

## 📝 Notas Adicionales

### **Diferencia: Desarrollo vs Producción**

| Aspecto | Desarrollo (`npm start`) | Producción (S3) |
|---------|-------------------------|-----------------|
| Servidor | webpack-dev-server (maneja rutas automáticamente) | S3 (solo archivos estáticos) |
| Rutas SPA | Funciona out-of-the-box | Necesita configuración especial |
| Error handling | Automático | Manual (error document) |

### **¿Por qué `homepage: "."`?**

- `"homepage": "."` → Rutas relativas (`./static/js/main.js`)
- `"homepage": "/subdir"` → Para deployar en subdirectorio
- Sin `homepage` → Rutas absolutas desde la raíz (`/static/js/main.js`)

---

## 🆘 Troubleshooting

### **Error: Blank page después del deploy**

**Causa:** Rutas incorrectas en el build.

**Solución:**
1. Verifica que `"homepage": "."` está en `package.json`
2. Haz un build limpio: `rm -rf build && npm run build`
3. Sube todo nuevamente a S3

### **Error: 404 al refrescar en rutas específicas**

**Causa:** S3 no está configurado como SPA.

**Solución:**
1. Error document en S3 debe ser `index.html`
2. Si usas CloudFront, configura Custom Error Responses

### **Error: Assets no cargan (403/404)**

**Causa:** Bucket policy no permite acceso público.

**Solución:**
1. Verifica que el bucket NO esté bloqueando acceso público
2. Aplica la Bucket Policy del paso B arriba

---

## ✅ Resumen del Fix

1. ✅ Agregado `"homepage": "."` en `package.json`
2. ⏳ Pendiente: Hacer nuevo build con `npm run build`
3. ⏳ Pendiente: Configurar S3 Error document a `index.html`
4. ⏳ Pendiente: Subir nuevo build a S3
5. ⏳ Pendiente: Verificar que funciona en producción

---

**¡Después de aplicar estos cambios, el error debería desaparecer!** 🎉




