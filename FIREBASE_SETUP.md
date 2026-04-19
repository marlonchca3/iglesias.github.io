# Configuración de Firebase Firestore

## Paso 1: Crear usuario administrador en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona proyecto **iglesias-app-d4dad**
3. En el sidebar → **Authentication**
4. Click en **Users** tab
5. Click **Add user**
6. Ingresa:
   - **Email**: tu-email@gmail.com (tu correo real)
   - **Password**: una contraseña segura
7. Click **Create user**

## Paso 2: Habilitar Google Sign-In

1. En **Authentication** → **Sign-in method**
2. Busca **Google** y haz click
3. Activa el toggle (Enable)
4. Selecciona un **Project support email**
5. **Save**

## Paso 3: Configurar Firestore Rules

1. En el sidebar → **Firestore Database**
2. Click en **Rules** tab (arriba)
3. Reemplaza TODO el contenido con esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lectura pública - todos pueden ver las iglesias
    match /churches/{document=**} {
      allow read: if true;
      // Escritura solo para usuarios autenticados
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

4. Click **Publish**

## Paso 4: Inicializar Firestore (Primera vez)

Si Firestore está vacío, ejecuta en la consola del navegador (F12):

```javascript
// Crear colección churches
db.collection('churches').add({
  id: 1,
  name: 'Test',
  lat: 0,
  lng: 0
}).then(() => console.log('Creado'))
```

## Verificación

Después de hacer estos pasos:
1. Abre https://marlonchca3.github.io/iglesias.github.io/
2. Click en **Admin** (⚙️)
3. Ingresa con tu email y contraseña
4. Intenta crear una iglesia

Si sigue sin funcionar, abre la consola (F12) y copia los errores que veas.
