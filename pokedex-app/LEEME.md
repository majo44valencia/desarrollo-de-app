# PokéScan: guía del proyecto

App móvil hecha con **Ionic + Angular + Capacitor**. El profe muestra la imagen de un Pokémon, le tomas una foto con el celular y la app te dice **qué Pokémon es** y muestra toda su información.

Esta guía tiene tres partes:

1. [Qué hace la app y cómo está hecha](#1-qué-hace-la-app)
2. [Cómo correrla en el PC (navegador)](#2-correr-la-app-en-el-pc-navegador)
3. [Cómo correrla en el celular con cable USB](#3-correr-la-app-en-el-celular-con-cable-usb)

Al final hay una sección de [problemas comunes](#4-problemas-comunes-y-soluciones).

---

## 1. Qué hace la app

| Pantalla | Qué hace |
|---|---|
| **Login** | Iniciar sesión con correo y contraseña. |
| **Registro** | Crear cuenta con nombre, correo y contraseña (mínimo 6 caracteres, con confirmación). |
| **Inicio** | Saluda al usuario. Tiene un **botón de Pokébola para escanear** (abre la cámara), la opción de **elegir una foto de la galería**, un **buscador** por nombre o número y el **historial "Mis escaneos"**. |
| **Ficha del Pokémon** | Imagen oficial, número, nombre, categoría, **tipos en español** con su color, **descripción en español**, altura, peso, habilidades y **estadísticas base** con barras animadas. |

### Cómo funciona el escaneo

```
Foto con la cámara ──► Gemini (IA de Google) ──► "pikachu" ──► PokeAPI ──► Ficha del Pokémon
```

1. La app toma la foto con el plugin de cámara de Capacitor.
2. Envía la foto a **Gemini**, la IA de Google que reconoce imágenes, y le pregunta qué Pokémon hay en la imagen.
3. Gemini responde con el nombre, por ejemplo `pikachu`.
4. La app busca ese nombre en la **PokeAPI** (https://pokeapi.co), una API gratuita con los datos de los 1025 Pokémon.
5. Se muestra la ficha y el Pokémon queda guardado en el historial del usuario.

> Si un modelo de Gemini está saturado, la app prueba automáticamente con otro modelo de respaldo.

### Login local (sin Firebase)

Los usuarios se guardan **en el mismo celular** (`localStorage`). La contraseña **no se guarda en texto plano**: se guarda cifrada con **SHA-256**. Cada usuario tiene su propio historial de escaneos.

Las pantallas de inicio y de ficha están protegidas con **guards**: si no has iniciado sesión, la app te manda al login.

### Tecnologías usadas

| Tecnología | Para qué |
|---|---|
| **Ionic 9** | Componentes visuales para móvil (botones, inputs, alertas, etc.) |
| **Angular 21** | Framework de la app (componentes, rutas, servicios, signals) |
| **Capacitor 8** | Convierte la app web en app Android y da acceso a la cámara |
| **@capacitor/camera** | Tomar la foto o elegirla de la galería |
| **Gemini API** | IA que reconoce el Pokémon en la foto |
| **PokeAPI** | Datos de los Pokémon (gratis, sin clave) |

### Estructura de archivos importantes

```
pokedex-app/
├── src/app/
│   ├── config.ts                 ← CLAVE DE GEMINI y modelos de IA
│   ├── app.routes.ts             ← rutas: /login, /registro, /home, /pokemon/:id
│   ├── core/
│   │   ├── auth.service.ts       ← registro, login, logout (local, SHA-256)
│   │   ├── guards.ts             ← protege las páginas que requieren sesión
│   │   ├── escaner.service.ts    ← cámara + envío de la foto a Gemini
│   │   ├── pokemon.service.ts    ← consultas a la PokeAPI, tipos y stats en español
│   │   └── historial.service.ts  ← Pokémon escaneados por cada usuario
│   ├── pages/
│   │   ├── login/                ← pantalla de inicio de sesión
│   │   ├── register/             ← pantalla de registro
│   │   ├── pokemon-detail/       ← ficha del Pokémon
│   │   └── auth.scss             ← estilos compartidos de login y registro
│   └── home/                     ← pantalla principal (escanear, buscar, historial)
├── android/                      ← proyecto Android nativo (lo genera Capacitor)
├── capacitor.config.ts           ← nombre de la app (PokéScan) e id (com.pokescan.app)
└── package.json                  ← dependencias
```

### La clave de Gemini

La clave está en `src/app/config.ts`:

```ts
geminiApiKey: 'AQ.....',
```

Ya viene puesta y funcionando. Si quieres usar **tu propia clave** (es gratis):
1. Entra a https://aistudio.google.com/apikey con tu cuenta de Google.
2. Toca **Create API key** y copia la clave.
3. Pégala en `src/app/config.ts`, reemplazando la que está.

> La clave gratuita tiene un límite de usos por minuto. No subas el proyecto a un repositorio público porque la clave quedaría expuesta.

---

## 2. Correr la app en el PC (navegador)

### Lo que necesitas instalar (una sola vez)

1. **Node.js** versión **22 LTS o más nueva**: https://nodejs.org (descarga la versión LTS).
   Para comprobarlo, en una terminal escribe `node -v`. Debe salir `v22.12` o más, o `v24.x`.
2. **Visual Studio Code** (recomendado): https://code.visualstudio.com

### Pasos

1. Descomprime el ZIP, por ejemplo en `Documentos\pokedex-app`.
2. Abre esa carpeta en VS Code: **Archivo → Abrir carpeta**.
3. Abre una terminal en VS Code (**Terminal → Nueva terminal**) y escribe:

```bash
npm install
```

Esto descarga las librerías y crea la carpeta `node_modules`. Tarda unos minutos y **solo se hace la primera vez**.

4. Para correr la app:

```bash
npx ng serve --port 8100
```

5. Abre en el navegador **http://localhost:8100**.

Tip: presiona **F12 → icono de celular** (o `Ctrl + Shift + M`) para verla con tamaño de celular.
En el PC, el botón de escanear abre la cámara web o te deja subir una imagen.

Para detenerla, presiona `Ctrl + C` en la terminal.

---

## 3. Correr la app en el celular con cable USB

### A. Lo que necesitas instalar en el PC (una sola vez)

1. **Node.js** (ver la sección 2).
2. **Android Studio**: https://developer.android.com/studio
   - Instálalo con las opciones por defecto. La primera vez que lo abras, deja que descargue el **Android SDK** (pide aceptar licencias).
   - Android Studio ya trae su propio **Java (JDK 21)**, así que no necesitas instalar Java aparte.

### B. Preparar el celular (una sola vez)

1. **Activar las opciones de desarrollador:**
   - Ve a **Ajustes → Acerca del teléfono** (en Xiaomi: *Información del teléfono*; en Samsung: *Información del software*).
   - Toca **7 veces seguidas** sobre **"Número de compilación"** (en Xiaomi: *Versión de MIUI/HyperOS*).
   - Saldrá el mensaje "Ahora eres desarrollador".
2. **Activar la depuración USB:**
   - Ve a **Ajustes → Sistema → Opciones de desarrollador** (o busca "Opciones de desarrollador" en el buscador de Ajustes).
   - Activa **"Depuración USB"**.
   - En **Xiaomi** activa también **"Instalar vía USB"**.
3. **Conectar el cable** al PC. Usa un cable de **datos**: algunos cables solo cargan.
4. En el celular aparecerá **"¿Permitir la depuración USB?"**. Marca **"Permitir siempre desde este equipo"** y toca **Permitir**.
5. Si el celular pregunta qué hacer con el USB, elige **"Transferencia de archivos"**.

### C. Correr la app en el celular

En la terminal de VS Code, dentro de la carpeta del proyecto:

```bash
# 1. Compilar la app web
npx ng build

# 2. Copiar la app al proyecto Android
npx cap sync android

# 3. Abrir el proyecto en Android Studio
npx cap open android
```

En **Android Studio**:

1. Espera a que termine el **"Gradle sync"** (barra de progreso abajo a la derecha). **La primera vez puede tardar 10–30 minutos** porque descarga muchas cosas. Las siguientes veces es rápido.
2. Arriba, en la lista de dispositivos, debe aparecer tu celular (ej. *Xiaomi Redmi Note…*).
3. Dale al botón verde **▶ Run 'app'**.
4. La app se instala y se abre sola en el celular.
5. La primera vez que toques **Escanear**, dale **Permitir** al permiso de cámara.

### Opción sin abrir Android Studio (por terminal)

Si ya tienes Android Studio instalado y el celular conectado:

```bash
npx ng build
npx cap run android
```

Te mostrará la lista de dispositivos conectados. Elige tu celular con las flechas y presiona Enter.

> Si sale un error de **JAVA_HOME** o de versión de Java, en esa misma terminal escribe primero
> (PowerShell en VS Code):
> ```powershell
> $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
> $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
> ```
> y vuelve a ejecutar `npx cap run android`.

### ¿Hiciste cambios en el código?

Cada vez que cambies algo dentro de `src/`, repite:

```bash
npx ng build
npx cap sync android
```

Y vuelve a darle **▶ Run** en Android Studio.

### Usar un emulador (celular virtual) en vez de un celular real

1. En Android Studio: **Tools → Device Manager → Create Virtual Device**.
2. Elige un teléfono (ej. *Pixel 8*), luego una imagen de Android (la recomendada) y dale **Finish**.
3. Selecciónalo arriba en la lista de dispositivos y dale **▶ Run**.

> En el emulador la cámara es simulada. Para probar el escaneo es mejor el celular real, o usar la opción **"Elegir foto de la galería"**.

### Generar el APK para pasarlo por WhatsApp

En Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
Al terminar, toca **"locate"** en el aviso. El archivo queda en:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Para instalarlo, envíalo al celular como **documento**, ábrelo, permite **"instalar de esta fuente"** y dale **Instalar**. Si sale Play Protect, elige **"Instalar de todas formas"**.

---

## 4. Problemas comunes y soluciones

| Problema | Solución |
|---|---|
| `The Angular CLI requires a minimum Node.js version…` | Actualiza Node.js a la versión LTS desde https://nodejs.org |
| `'npx' no se reconoce como un comando…` | Node.js no está instalado o falta reiniciar el PC después de instalarlo. |
| El celular **no aparece** en Android Studio | Revisa que la depuración USB esté activada, cambia el cable o el puerto USB, desconecta y vuelve a conectar, y acepta el aviso "Permitir depuración USB" en el celular. |
| Sale **"unauthorized"** al conectar | Desbloquea el celular y acepta el aviso de depuración USB. |
| Xiaomi: `INSTALL_FAILED_USER_RESTRICTED` | Activa **"Instalar vía USB"** en las opciones de desarrollador (pide iniciar sesión en la cuenta Mi). |
| Gradle falla con **"Unsupported class file major version"** | Tu Java es demasiado nuevo. En Android Studio ve a **File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** y elige **"jbr-21"** (el que trae Android Studio). |
| Gradle falla con **"Could not download…"** | Es un problema de internet. Vuelve a darle **Sync** o **Run**: lo que ya se descargó no se baja otra vez. |
| La app dice **"La IA está saturada"** | Gemini está ocupado o se pasó el límite gratuito por minuto. Espera unos segundos e intenta otra vez. |
| La app dice **"La clave de Gemini no es válida"** | Saca una clave nueva (sección 1) y pégala en `src/app/config.ts`. Luego repite `npx ng build` y `npx cap sync android`. |
| **"No se encontró ningún Pokémon en la foto"** | Toma la foto más de cerca, que el Pokémon ocupe casi toda la imagen y con buena luz. |
| La ficha no carga | El celular necesita **internet** para la IA y para la PokeAPI. |
| Hice cambios y en el celular no se ven | Te faltó `npx ng build` y `npx cap sync android` antes de darle Run. |

---

## Comandos de resumen

```bash
npm install                 # solo la primera vez
npx ng serve --port 8100    # ver la app en el navegador del PC

npx ng build                # compilar
npx cap sync android        # copiar al proyecto Android
npx cap open android        # abrir en Android Studio y darle ▶ Run
npx cap run android         # o instalar directo en el celular conectado por USB
```
