# 📱 Guía de Administración - Misas Callao

## 🎯 ¿Qué es?
Panel de administración simple para gestionar iglesias y horarios de misa en la aplicación **Misas Callao**.

## 🚀 Acceso al Panel Admin

1. Abre la aplicación: **https://marlonchca3.github.io/iglesias.github.io/**
2. Haz click en el botón **"⚙️ Admin"** en la esquina superior derecha
3. ¡Listo! Entrarás al panel de administración

## 📋 Funciones principales

### 1. **Agregar una Nueva Iglesia**

**Pasos:**
1. Click en botón **"+ Agregar iglesia"**
2. Completa el formulario:
   - **Nombre** *: Nombre de la iglesia (requerido)
   - **Dirección** *: Dirección completa (requerido)
   - **Latitud** *: Coordenada norte/sur (ej: -12.0612) (requerido)
   - **Longitud** *: Coordenada este/oeste (ej: -77.1469) (requerido)
   - **Fuente**: De dónde obtuviste la información (opcional)
3. Click en **"Crear"**

> **💡 Tip:** Para obtener las coordenadas exactas, usa Google Maps:
> - Abre Google Maps
> - Busca la iglesia
> - Click derecho en la ubicación → copiar las coordenadas
> - Pega en los campos Latitud y Longitud

### 2. **Editar Información de una Iglesia**

1. Encuentra la iglesia en la lista
2. Click en botón **"Editar"**
3. Modifica los datos (nombre, dirección, ubicación)
4. Click en **"Actualizar"**

### 3. **Editar Horarios de Misa**

**Para agregar o eliminar horarios:**

1. Encontrala iglesia en la lista
2. Click en **"Editar horarios"**
3. Para **AGREGAR una hora**:
   - Click en **"+ Agregar hora"** del día que deseas
   - Escribe la hora en formato **HH:MM** (ej: 18:00)
   - Se agregará automáticamente en orden

4. Para **ELIMINAR una hora**:
   - Click en el **"×"** de la hora que deseas quitar

5. Click en **"Listo"** cuando termines

**Formato de horas:** 
- Usa el formato de 24 horas (00:00 a 23:59)
- Ejemplos válidos: 08:00, 18:30, 19:45

### 4. **Eliminar una Iglesia**

1. Encuentra la iglesia en la lista
2. Click en botón **"Eliminar"**
3. Confirma en la ventana que aparece
4. La iglesia se eliminará

### 5. **Descargar Respaldo de Datos**

1. Click en **"Descargar datos"**
2. Se descargará un archivo JSON con todos los datos
3. Guarda este archivo como respaldo

### 6. **Restaurar Valores Predeterminados**

1. Click en **"Restaurar predeterminados"**
2. Confirma en la ventana
3. Se restaurarán las 5 iglesias originales (se perderán los cambios)

## 🔒 Almacenamiento

- ✅ **Los datos se guardan automáticamente** en tu navegador
- ✅ Persisten aunque cierres la página
- ✅ Cada navegador/dispositivo tiene su propia copia

> **⚠️ Importante:** Si limpias el caché del navegador, se perderán los datos. Usa "Descargar datos" regularmente como respaldo.

## 💾 Vista en Tiempo Real

Los cambios que haces en el panel admin aparecen **inmediatamente** en:
- El mapa de ubicaciones
- La lista de iglesias cercanas
- Los horarios mostrados a los usuarios

## 🆘 Solución de Problemas

| Problema | Solución |
|----------|----------|
| No se guarda mi iglesia | Asegúrate de completar TODOS los campos (*requeridos) |
| Formato de hora inválido | Usa HH:MM (ej: 18:00, no 6:00 PM) |
| Las coordenadas están incorrectas | Verifica en Google Maps que sean exactas |
| Se perdieron todos los datos | Usa "Restaurar predeterminados" y reagrega los datos |

## 📞 Contacto

Si tienes dudas o problemas, comunícate con el equipo de desarrollo.

---

**¡Ya estás listo para administrar las iglesias!** 🙏
