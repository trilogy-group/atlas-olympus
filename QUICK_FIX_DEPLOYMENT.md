# 🚨 Fix Rápido: Error después de nuevo Deploy

## El Problema
- ✅ Antes funcionaba bien
- ❌ Después de subir nueva versión → Error `Unexpected token '<'`
- ✅ S3 está bien configurado

## 🎯 Causa Probable: **CACHE**

El navegador o CloudFront están sirviendo archivos mezclados (HTML nuevo con JS viejo).

---

## ✅ Soluciones (en orden)

### **Solución 1: Hard Refresh en el Navegador** ⚡

1. Abre `atlasolympus.csaiautomations.com`
2. Presiona:
   - **Windows/Linux:** `Ctrl + Shift + R` o `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`
3. Esto fuerza a descargar TODO de nuevo

**¿Funcionó?** Si sí, el problema era cache del navegador. Si no, continúa...

---

### **Solución 2: Invalidar Cache de CloudFront** ⚡⚡

Si tienes CloudFront delante del S3, necesitas invalidar el cache:

#### **Opción A: Por AWS Console**
1. Ve a **CloudFront** en AWS Console
2. Selecciona tu distribución
3. **Invalidations** → **Create Invalidation**
4. En **Object Paths** pon: `/*`
5. **Create Invalidation**

Espera 5-10 minutos y prueba de nuevo.

#### **Opción B: Por AWS CLI**
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

### **Solución 3: Verificar que subiste TODOS los archivos** ⚡

Verifica en S3 que la carpeta tiene:

```
bucket-root/
├── index.html           ← Nuevo
├── favicon.ico
├── manifest.json
├── static/
│   ├── js/
│   │   ├── main.[hash].js     ← Hash diferente al anterior
│   │   └── [otros-chunks].js
│   └── css/
│       └── main.[hash].css    ← Hash diferente al anterior
```

**Verifica:**
- ¿El `index.html` tiene la fecha/hora de HOY?
- ¿Los archivos JS tienen un hash DIFERENTE al deploy anterior?

Si los hashes son iguales, significa que subiste el build viejo.

---

### **Solución 4: Build limpio y re-deploy** ⚡⚡⚡

Si nada funciona, haz un build completamente limpio:

```bash
cd C:\Github\atlas-olympus

# 1. Borrar build anterior
rmdir /s /q build

# 2. Build limpio con la nueva config
npm run build

# 3. Verificar el index.html generado
type build\index.html
```

**Busca en el output:**
- Si ves `src="/static/js/...` → ❌ Rutas absolutas (malo para S3)
- Si ves `src="./static/js/...` → ✅ Rutas relativas (bueno)

**Si ves rutas absolutas (`/static`)**, entonces el `"homepage": "."` del `package.json` no se aplicó.

---

## 🔍 Debug: Verificar qué está sirviendo S3

### **Método 1: Inspeccionar el HTML**

1. Ve a `atlasolympus.csaiautomations.com`
2. Click derecho → **Ver código fuente** (View Page Source)
3. Busca la línea del script: `<script defer="defer" src=`

**¿Qué ves?**
- `src="/static/js/main.js"` → ❌ Rutas absolutas (build viejo)
- `src="./static/js/main.js"` → ✅ Rutas relativas (build nuevo)

### **Método 2: Ver directo en S3**

1. Ve al bucket S3
2. Descarga el `index.html` actual
3. Ábrelo en un editor de texto
4. Verifica las rutas de los scripts

---

## 🎯 Diagnóstico Rápido

### **Test 1: ¿Es problema de cache?**
```
Hard refresh (Ctrl+Shift+R) → ¿Funciona?
```
- ✅ SÍ → Era cache del navegador
- ❌ NO → Continúa

### **Test 2: ¿Subiste el build correcto?**
```
Ver código fuente → ¿Rutas con "./" o "/"?
```
- `./static` → Build nuevo, puede ser cache de CloudFront
- `/static` → Build viejo, necesitas rebuildeary subir

### **Test 3: ¿CloudFront está cacheando?**
```
Acceder directo al S3 endpoint (sin CloudFront) → ¿Funciona?
```
- ✅ SÍ → CloudFront necesita invalidación
- ❌ NO → Problema en S3 o build

---

## 📝 Checklist de Deploy

Para futuros deploys, sigue este proceso:

```bash
# 1. Build limpio
cd C:\Github\atlas-olympus
rmdir /s /q build
npm run build

# 2. Verificar rutas en build/index.html
type build\index.html | findstr "src="

# 3. Subir a S3 (todos los archivos)
# [Tu método de subida]

# 4. Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"

# 5. Wait 5-10 min

# 6. Hard refresh en navegador
# Ctrl + Shift + R
```

---

## 🆘 Si NADA funciona

Hay dos archivos HTML en tu proyecto:
- `public/index.html` (template)
- `Icons/index.html` (¿build viejo?)

**Asegúrate de que estás subiendo de `build/` y NO de `Icons/`**

El archivo en `Icons/index.html` tiene rutas absolutas:
```html
src="/static/js/main.96ce277e.js"
```

Ese es un build VIEJO. NO lo uses.

---

## ✅ Resumen

1. ⚡ **Prueba primero:** Hard refresh (`Ctrl + Shift + R`)
2. ⚡⚡ **Si no funciona:** Invalida CloudFront cache
3. ⚡⚡⚡ **Si sigue sin funcionar:** Rebuild limpio y re-upload

**El `"homepage": "."` que agregamos al package.json solo afectará a los NUEVOS builds.**

Si ya habías hecho build antes de ese cambio, necesitas hacer **nuevo build** para que tome efecto.




