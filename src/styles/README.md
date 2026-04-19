# Carpeta Styles (CSS)

Esta carpeta contiene todos los estilos CSS de la aplicación.

## Estructura

- **style.css** - Estilos globales
  - Variables CSS (:root)
  - Estilos generales del body
  - Clases de componentes reutilizables
  - Media queries para responsive design

## Clases principales

- `.page` - Contenedor principal con max-width
- `.hero` - Sección hero de bienvenida
- `.card` - Tarjetas de contenido
- `.primary` / `.secondary` - Botones
- `.church-list` / `.church-item` - Lista de iglesias
- `.times` - Lista de horarios

## Cómo agregar estilos

1. Para estilos globales: modifica `style.css`
2. Para estilos de componentes: usa `<style scoped>` en el archivo `.vue`
3. Reutiliza variables CSS definidas en `:root`
