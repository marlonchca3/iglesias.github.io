# Estructura del Proyecto - Misas Callao

## 📁 Organización de carpetas

```
src/
├── js/                 # Archivos JavaScript
│   ├── main.js         # Punto de entrada
│   └── README.md       # Documentación
├── styles/             # Archivos CSS
│   ├── style.css       # Estilos globales
│   └── README.md       # Documentación
├── templates/          # Templates HTML
│   └── README.md       # Documentación
├── components/         # Componentes Vue
│   ├── App.vue         # Componente raíz
│   ├── MapView.vue     # Mapa de iglesias
│   ├── AdminView.vue   # Panel administración
│   └── LoginView.vue   # Formulario login
├── firebase/           # Módulos Firebase
│   ├── firestore.js    # Sincronización Firestore
│   ├── auth.js         # Autenticación
│   └── config.js       # Configuración
└── data/               # Datos estáticos
    └── churches.js     # Lista de iglesias por defecto
```

## 🔄 Flujo de datos

1. **main.js** (src/js/) - Inicia la aplicación
2. **App.vue** - Componente raíz que maneja:
   - Estado global (usuarios, iglesias, ubicación)
   - Autenticación
   - Sincronización entre dispositivos
3. **Componentes** - Vistas específicas:
   - MapView: Muestra iglesias en mapa
   - AdminView: Edita datos (requiere login)
   - LoginView: Formulario de acceso
4. **Firebase (mock)** - Persiste datos en localStorage
5. **CSS** - Estilos globales desde src/styles/

## 🔐 Autenticación

- Email: `admin@iglesias.com`
- Contraseña: `admin123`
- Los datos se sincronizan automáticamente cada 2 segundos

## 📝 Cómo agregar código

### Nuevo JavaScript
1. Crea archivo en `src/js/`
2. Importa en `src/js/main.js` o en el componente que lo necesite

### Nuevo CSS
1. Crea archivo en `src/styles/`
2. Importa en `src/js/main.js` para hacerlo global
3. O usa `<style scoped>` en componentes Vue

### Nuevo componente
1. Crea archivo `.vue` en `src/components/`
2. Importa en `App.vue` y úsalo en el template

## 🚀 Compilar y desplegar

```bash
npm run build     # Compila a dist/
npm run dev       # Servidor de desarrollo
git push origin main  # Despliega a GitHub Pages
```
