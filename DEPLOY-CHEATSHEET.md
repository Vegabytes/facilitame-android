# Facilítame - Chuleta de Despliegue

## Requisitos previos
- Node.js instalado
- EAS CLI: `npm install -g eas-cli`
- Estar logueado: `npx eas login`

---

## Builds

### Construir para producción (stores)
```bash
# Android (Google Play)
npx eas build --platform android --profile production

# iOS (App Store)
npx eas build --platform ios --profile production

# Ambas plataformas
npx eas build --platform all --profile production
```

### Construir para pruebas internas
```bash
# Android APK (instalable directamente)
npx eas build --platform android --profile preview

# iOS (TestFlight interno)
npx eas build --platform ios --profile preview
```

### Ver estado de builds
```bash
# Lista de builds recientes
npx eas build:list

# Solo Android
npx eas build:list --platform android

# Solo iOS
npx eas build:list --platform ios
```

---

## Submit (Subir a stores)

### Google Play Store
```bash
# Subir el último build de Android
npx eas submit --platform android --latest

# Subir un build específico por ID
npx eas submit --platform android --id BUILD_ID
```

### Apple App Store
```bash
# Subir el último build de iOS
npx eas submit --platform ios --latest

# Subir un build específico por ID
npx eas submit --platform ios --id BUILD_ID
```

### Ambas stores a la vez
```bash
npx eas submit --platform all --latest
```

---

## Flujo completo de despliegue

### 1. Construir y subir Android
```bash
npx eas build --platform android --profile production
# Esperar a que termine...
npx eas submit --platform android --latest
```

### 2. Construir y subir iOS
```bash
npx eas build --platform ios --profile production
# Esperar a que termine...
npx eas submit --platform ios --latest
```

### 3. Todo en un comando (build + submit automático)
```bash
# Android
npx eas build --platform android --profile production --auto-submit

# iOS
npx eas build --platform ios --profile production --auto-submit

# Ambos
npx eas build --platform all --profile production --auto-submit
```

---

## Comandos útiles

### Ver credenciales configuradas
```bash
npx eas credentials
```

### Actualizar versión
```bash
# Ver versión actual
npx eas build:version:get

# Sincronizar versión con stores
npx eas build:version:sync
```

### Cancelar build en progreso
```bash
npx eas build:cancel
```

### Ver logs de un build
```bash
npx eas build:view BUILD_ID
```

---

## Configuración (eas.json)

El archivo `eas.json` contiene la configuración de builds y submits:

- **production**: Builds para las stores (AAB/IPA firmados)
- **preview**: Builds para pruebas internas (APK instalable)
- **development**: Builds de desarrollo con Expo Dev Client

---

## Credenciales

### Android (Google Play)
- **Keystore**: Gestionado por EAS (facilitame-key)
- **Service Account**: `facilitame-6ab1d-a35e52bc1476.json`

### iOS (App Store)
- **Certificados**: Gestionados por EAS
- **API Key**: Configurada en App Store Connect (6YZNT7VRB6)

---

## URLs útiles

- **EAS Dashboard**: https://expo.dev/accounts/facilitame2024/projects/facilitame
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com

---

## Solución de problemas

### Build de Android falla con "google-services.json missing"
El archivo debe estar en la raíz del proyecto y NO en `.gitignore`

### Error de permisos en Google Play
Verificar que el Service Account tenga permisos en:
Google Play Console > Usuarios y permisos

### Error de credenciales en iOS
```bash
npx eas credentials --platform ios
```

---

## Notas

- Los builds tardan ~10-20 minutos
- Después de subir a Google Play, hay que aprobar la versión manualmente en la consola
- Después de subir a App Store, hay que enviar a revisión en App Store Connect
- La primera vez que se sube, Apple tarda 24-48h en revisar
