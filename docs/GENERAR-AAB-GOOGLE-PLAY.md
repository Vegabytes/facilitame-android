# Generar AAB para Google Play

## Datos de firma

- **Keystore**: `android/app/upload-keystore.jks`
- **Alias**: `facilitame`
- **Password**: `(wqvz@}2^sI2./eF+DQ.`
- **SHA1 esperado por Google Play**: `D0:B5:A8:27:E2:0B:AC:F5:BE:64:FD:97:E1:28:21:AB:7B:B2:DB:18`

## Pasos para generar el AAB

### 1. Actualizar version (si es necesario)

Editar `android/app/build.gradle`:

```groovy
versionCode 61        // Incrementar siempre (numero entero)
versionName "1.3.5"   // Version visible al usuario
```

### 2. Generar el AAB

Desde la carpeta `C:\f\android`:

```bash
./gradlew bundleRelease
```

### 3. Ubicacion del AAB generado

```
android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Subir a Google Play Console

1. Ir a Google Play Console
2. Seleccionar la app Facilitame
3. Produccion > Crear nueva version
4. Subir `app-release.aab`
5. Revisar y publicar

## Verificar firma del AAB (opcional)

Si necesitas verificar que el AAB esta firmado correctamente:

```bash
keytool -list -v -keystore android/app/upload-keystore.jks -storepass "(wqvz@}2^sI2./eF+DQ." -alias facilitame
```

El SHA1 debe ser: `D0:B5:A8:27:E2:0B:AC:F5:BE:64:FD:97:E1:28:21:AB:7B:B2:DB:18`

## Solucion de errores comunes

### "App bundle firmado con clave incorrecta"

Asegurate de que `build.gradle` tenga en `signingConfigs.release`:

```groovy
release {
    storeFile file('upload-keystore.jks')
    storePassword '(wqvz@}2^sI2./eF+DQ.'
    keyAlias 'facilitame'
    keyPassword '(wqvz@}2^sI2./eF+DQ.'
}
```

Y que `buildTypes.release` use `signingConfig signingConfigs.release` (NO `signingConfigs.debug`).

### "versionCode ya usado"

Incrementar `versionCode` en `build.gradle`. Debe ser mayor que el ultimo subido.
