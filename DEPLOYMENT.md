# 🚀 Guía de Deployment

## Para Desarrolladores

### Cómo Desplegar Cambios a Producción

**Opción 1: Comando automático (RECOMENDADO)**
```bash
npm run deploy
```

Este comando automáticamente:
1. Compila el proyecto con Vite
2. Copia los archivos compilados al root
3. Actualiza assets
4. Hace commit a git
5. Hace push a GitHub Pages (rama `gh-pages`)

### Opción 2: Paso a paso (si prefieres controlar cada paso)
```bash
# 1. Compilar
npm run build

# 2. Copiar archivos compilados al root
cp dist/index.html index.html
cp dist/404.html 404.html
rm -rf assets
cp -r dist/assets assets

# 3. Hacer commit
git add .
git commit -m "Deploy cambios"

# 4. Hacer push
git push origin gh-pages
```

## ⚠️ Puntos Importantes

### Rama Correcta
- El proyecto usa la rama **`gh-pages`** para el deploy en GitHub Pages
- ✅ **Correcto:** `git push origin gh-pages`
- ❌ **Incorrecto:** `git push origin main`

### Hashes de Assets
- **Vite genera automáticamente hashes diferentes** cada vez que compilas
- Después de compilar, **SIEMPRE** debes copiar `dist/index.html` al root
- De lo contrario, el navegador cargará hashes antiguos que no existen

### Archivos Importantes
- `index.template.html` - Plantilla base (NO TOCAR)
- `index.html` - Versión compilada (auto-actualizada por build)
- `dist/` - Carpeta de compilación (se regenera en cada build)
- `assets/` - Scripts y estilos compilados en root

## 🔄 Flujo de Trabajo Recomendado

```bash
# 1. Haz cambios en src/
# ... edita archivos .vue, .js, .css, etc.

# 2. Prueba localmente
npm run dev

# 3. Cuando estés listo, deploya
npm run deploy

# ✅ ¡Listo! Tu código está en https://marlonchca3.github.io/iglesias.github.io/
```

## 🆘 Solución de Problemas

### "Sale en blanco" / 404 en assets
**Causa:** Los hashes en `index.html` no coinciden con los archivos en `dist/`

**Solución:**
```bash
# Asegúrate de copiar correctamente
cp dist/index.html index.html

# Verifica que los hashes coincidan
cat index.html | grep "index-"
ls -lh dist/assets/
```

### Los cambios no aparecen después de deploy
**Causa:** Caché del navegador

**Solución:**
- Chrome: `Ctrl+Shift+Delete` (limpiar caché)
- Firefox: `Ctrl+Shift+Delete`
- Safari: Preferences → Privacy → Remove All Website Data

### Error de Git durante deploy
**Causa:** El repositorio podría estar en un estado inconsistente

**Solución:**
```bash
# Ver el estado
git status

# Si hay cambios sin comitear
git add .
git commit -m "Fix"
git push origin gh-pages
```

## 📊 Verificación Post-Deploy

Después de hacer deploy, verifica que todo está correcto:

```bash
# 1. Revisa que el push fue exitoso
git log --oneline -5

# 2. Abre la app en el navegador
# https://marlonchca3.github.io/iglesias.github.io/

# 3. Limpiar caché del navegador (Ctrl+Shift+Delete)

# 4. Recarga la página (F5)
```

---

**¿Preguntas?** Consulta el README principal.
