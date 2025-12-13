# Facilítame App

Aplicación móvil multiplataforma (iOS/Android) desarrollada con React Native y Expo para la gestión de solicitudes de servicios.

## Requisitos

- Node.js >= 18.x
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Para Android: Android Studio con emulador configurado
- Para iOS: macOS con Xcode (solo desarrollo iOS)

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd facilitameAppSmart

# Instalar dependencias
npm install

# Instalar expo-secure-store (nueva dependencia de seguridad)
npx expo install expo-secure-store
```

## Ejecutar el Proyecto

```bash
# Iniciar servidor de desarrollo (Expo Go)
npx expo start

# Ejecutar en Android
npx expo run:android

# Ejecutar en iOS (solo macOS)
npx expo run:ios

# Ejecutar en web
npx expo start --web
```

## Estructura del Proyecto

```
facilitameAppSmart/
├── app/                          # Pantallas (Expo Router)
│   ├── (auth)/                   # Flujo de autenticación
│   │   ├── login.js              # Inicio de sesión
│   │   ├── form-selector.js      # Selector de tipo de usuario
│   │   ├── form-particular.js    # Registro particulares
│   │   ├── form-autonomo.js      # Registro autónomos
│   │   ├── form-empresa.js       # Registro empresas
│   │   └── password-recovery.js  # Recuperación de contraseña
│   └── (app)/                    # Aplicación principal
│       └── tabs/                 # Navegación por pestañas
│           ├── inicio/           # Dashboard
│           ├── servicios/        # Catálogo de servicios
│           ├── mis-solicitudes/  # Gestión de solicitudes
│           ├── mi-cuenta/        # Perfil de usuario
│           └── notificaciones/   # Centro de notificaciones
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes de UI base
│   │   ├── Button.js             # Botón personalizado
│   │   ├── Input.js              # Campo de texto
│   │   ├── Card.js               # Tarjeta contenedora
│   │   ├── LoadingScreen.js      # Pantalla de carga
│   │   └── ErrorScreen.js        # Pantalla de error
│   ├── SolicitudCard.js          # Tarjeta de solicitud
│   └── EstadoColor.js            # Badge de estado
├── context/                      # Estado global (Context API)
│   ├── AuthContext.js            # Autenticación
│   └── SolicitudContext.js       # Datos de solicitud
├── hooks/                        # Custom hooks
│   ├── useApi.js                 # Hook para llamadas API
│   └── useForm.js                # Hook para formularios
├── utils/                        # Utilidades
│   ├── api.js                    # Cliente API
│   ├── constants.js              # Constantes globales
│   ├── storage.js                # Almacenamiento seguro
│   └── notifications.js          # Push notifications
└── assets/                       # Recursos (imágenes, iconos)
```

## Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React Native | 0.76.7 | Framework móvil |
| Expo | 52.x | Plataforma de desarrollo |
| Expo Router | 4.x | Navegación file-based |
| NativeWind | 4.x | Estilos (Tailwind CSS) |
| React Navigation | 7.x | Navegación |

## Arquitectura

La aplicación sigue una arquitectura basada en:

- **Context API** para estado global (autenticación)
- **Custom Hooks** para lógica reutilizable
- **Componentes UI** modulares y reutilizables
- **Expo Router** para navegación declarativa

### Flujo de Autenticación

```
1. App inicia → Verifica token en SecureStore
2. Si existe token → Carga perfil → Redirige a /tabs/inicio
3. Si no existe → Muestra /login
4. Login exitoso → Guarda token → Carga app
```

### Llamadas a API

```javascript
import { fetchWithAuth } from './utils/api';

// GET autenticado
const data = await fetchWithAuth('endpoint');

// POST con datos
const data = await fetchWithAuth('endpoint', { campo: 'valor' });

// POST con FormData (archivos)
const formData = new FormData();
formData.append('file', { uri, name, type });
const data = await fetchWithAuth('endpoint', formData);
```

## Componentes UI

### Button

```jsx
import { Button } from './components/ui';

<Button onPress={handlePress}>Texto</Button>
<Button variant="outline" loading={isLoading}>Guardar</Button>
<Button variant="secondary" disabled={true}>Deshabilitado</Button>
```

### Input

```jsx
import { Input } from './components/ui';

<Input
  label="Email"
  placeholder="correo@ejemplo.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  error={errors.email}
/>
```

### Card

```jsx
import { Card } from './components/ui';

<Card title="Título">
  <Text>Contenido</Text>
</Card>

<Card variant="primary">
  <Text>Tarjeta destacada</Text>
</Card>
```

## Constantes

Las constantes globales están en `utils/constants.js`:

```javascript
import { PROVINCES, VALIDATION_REGEX, ERROR_MESSAGES, COLORS } from './utils/constants';

// Validar email
if (!VALIDATION_REGEX.email.test(email)) {
  setError(ERROR_MESSAGES.validation.email);
}

// Usar colores
<View style={{ backgroundColor: COLORS.primary }} />
```

## Almacenamiento Seguro

Los tokens se almacenan de forma segura:

```javascript
import { saveAuthToken, getAuthToken, clearAllStorage } from './utils/storage';

// Guardar token
await saveAuthToken(token);

// Obtener token
const token = await getAuthToken();

// Limpiar todo (logout)
await clearAllStorage();
```

## Scripts Disponibles

```bash
npm run start      # Inicia Expo dev server
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador
npm run lint       # Ejecuta ESLint
```

## Build para Producción

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android (APK/AAB)
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

## Variables de Entorno

La URL de la API está configurada en `utils/constants.js`:

```javascript
export const API_URL = "https://app.facilitame.es/api";
```

Para cambiar el entorno, modifica este valor o usa variables de entorno con `expo-constants`.

## Contribuir

1. Crea una rama desde `main`
2. Realiza tus cambios
3. Ejecuta `npm run lint` para verificar el código
4. Crea un Pull Request

## Changelog

### v1.1.0 (Refactorización)
- Implementado almacenamiento seguro (SecureStore)
- Creados componentes UI reutilizables
- Añadidos custom hooks (useApi, useForm)
- Centralizada configuración en constants.js
- Eliminado código duplicado en formularios
- Mejorado manejo de errores
- Añadida documentación

### v1.0.0 (Inicial)
- Versión inicial de la aplicación

## Licencia

Propiedad de Bold Software - Todos los derechos reservados.
