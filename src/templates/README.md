# Carpeta Templates (HTML)

Esta carpeta contiene templates HTML de la aplicación.

## Archivos

- **index.template.html** (en raíz) - Template base HTML
  - Define estructura HTML5
  - Vincula el punto de entrada JavaScript (`src/js/main.js`)
  - Contiene el elemento `<div id="app"></div>` donde monta Vue

## Componentes Vue

Los templates Vue están en la carpeta `../components/`:
- `App.vue` - Componente raíz
- `MapView.vue` - Vista del mapa
- `AdminView.vue` - Panel de administración
- `LoginView.vue` - Formulario de login

## Cómo trabajar con templates

1. Edita `index.template.html` para cambios globales del HTML
2. Edita componentes `.vue` para cambios en vistas específicas
3. Los componentes `.vue` combinan HTML, CSS y JavaScript en un solo archivo
