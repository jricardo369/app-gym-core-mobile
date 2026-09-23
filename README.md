# LUA Studio — App Gym Core Mobile

App móvil híbrida para la gestión de gimnasio / estudio (reservación de clases, asistencias, paquetes, usuarios y administración).
Nombre comercial: **LUA Studio** (código/paquete anterior: `iRoda`).

> README anterior solo decía: `ionic serve --external + Safari`. Aquí está la documentación completa.

---

## 1. ¿Qué tiene la app?

### Stack técnico

| Capa | Tecnología / versión (según `package.json`) |
|---|---|
| Framework UI | Ionic Angular `^9.0.0` + `ionicons ^8.1.0` |
| Framework base | Angular `^22.1.3`, Angular CLI `^22.1.3` |
| Lenguaje | TypeScript `~6.0.3`, RxJS `~7.8.0`, `zone.js ^0.16.0` |
| Empaquetado móvil | Cordova (`cordova-android ^14.0.1`, `cordova-ios ^7.1.1`) + plugins Capacitor 5 (`app`, `haptics`, `keyboard`, `status-bar`) |
| Persistencia local | `@ionic/storage-angular ^4.0.0` (sesión `DatosUsuario`) |
| Estado | Angular Signals (`EstadoUsuarioService`) |
| Build | `@angular/build ^22.1.5`, salida a `www/` (ver `angular.json` y `capacitor.config.ts`) |
| Calidad / test | ESLint 9 + `angular-eslint`, Jasmine/Karma |
| CI iOS | `ci_post_clone.sh` (Xcode Cloud: `npm ci` → `ionic cordova build ios` → CocoaPods) |

Identidad / branding configurable en `src/app/app.config.ts`: variable `compania` (`general` | `lua` | `iroda`) cambia logo, fondo y avatares.

### Funcionalidades por rol

La app maneja 3 roles (ver `EstadoUsuarioService`: `isAdmin`, `isUser`, `isCoach`):

**Autenticación y cuenta**
- `login` — inicio de sesión (`POST IniciarSesion/iniciar-sesion`), guarda sesión en Storage, usa Signals.
- `recuperar` — recuperación de contraseña.
- `cambiarpass` — cambio de contraseña (`PUT Usuarios/cambio-contrasenia/`).
- `registro` — alta de nuevos usuarios (`POST Usuarios/`).
- `terminos` — aceptación de términos (`PUT Usuarios/terminos/:id`).
- `perfil` / `editarperfil/:idUsuario/...` — ver y editar perfil, teléfono/correo (`PUT Usuarios/actualizar-datos-perfil`), activar/desactivar, bloqueo por falta de pago, multas/faltas.

**Alumno (`user`)**
- `user` — home del alumno.
- `horarios/:fechaf` — horarios disponibles por fecha.
- `lugares/:fechaf/...` — mapa de lugares por clase/fecha, apartar/cancelar lugar, lista de espera.
- `clasesalumnos` / `asisalumno` / `asistenciasusuario` — mis clases y mis asistencias.
- `calalumno` — calendario del alumno.
- `paquetes/:idUsuario/:sociedad` — mis inscripciones/paquetes.

**Admin / Coach (`admin`)**
- `admin` — home del administrador.
- `caladmin` — calendario del admin.
- `horariosadmin/:fechaf/...` — horarios con vista administrativa.
- `asistentes/:idClase/...` — lista de asistentes por clase, pasar falta, expulsar.
- `clases` — catálogo de clases; `crearclase` (`POST Clases`), `editarclase/:idClase/...` (`PUT Clases`), eliminar (`DELETE Clases/:id`).
- `asuetos` — días de asueto; `nuevoasueto` (`POST Asuetos`), eliminar (`DELETE Asuetos?fecha=`).
- `crearpaquete/:idUsuario/...` — vender/crear paquete (`POST Inscripciones?fecha=&idUsuario=`).
- `modal-inf-ea` — modal de información/estado.

**Compartido**
- `home` — página de ejemplo/tab inicial de Ionic.
- `componentes/tabbar` — barra de navegación inferior reutilizable.
- `pipes/buscar.pipe.ts` y `pipes/filtro.pipe.ts` — filtrado/búsqueda en listas.
- `servicios/login.service.ts` (`LoginService`) — centraliza todas las llamadas al backend: usuarios, inscripciones, asistencias, lugares, lista de espera, clases, asuetos, multas, configuraciones, login.
- `servicios/estado-usuario.service.ts` — sesión global con Signals + Ionic Storage.
- `servicios/icons.service.ts` — registro de iconos.

### Rutas (resumen de `src/app/app-routing.module.ts`)

Todas con lazy-loading (`loadComponent`). Ruta raíz `''` → redirige a `login`.

`home`, `login`, `admin`, `recuperar`, `caladmin`, `paquetes/:idUsuario/:sociedad`, `perfil`, `user`, `calalumno`, `clases`, `asuetos`, `registro`, `crearclase`, `editarperfil/:...`, `editarclase/:...`, `nuevoasueto`, `crearpaquete/:idUsuario/:sociedad/:idRol`, `cambiarpass`, `clasesalumnos`, `asisalumno`, `asistentes/:idClase/...`, `horarios/:fechaf`, `horariosadmin/:fechaf/:idUser/:sociedad/:idRol`, `lugares/:fechaf/...`, `modal-inf-ea`, `asistenciasusuario`, `terminos`.

### Estructura del proyecto

```text
src/
  app/
    app-routing.module.ts   # rutas + lazy loading
    app.component.ts/html/scss
    app.config.ts           # API_URL, VERSION_PORTAL, branding por compañía
    paginas/                # 25 páginas (login, admin, user, clases, horarios, ...)
    componentes/tabbar/     # tabbar reutilizable
    servicios/              # login.service, estado-usuario.service, icons.service
    pipes/                  # filtro.pipe, buscar.pipe
    asistenciasusuario/
    home/
  assets/                   # logos, fondos, avatares
  environments/             # environment.ts / environment.prod.ts
  theme/variables.scss + global.scss
angular.json                # build a www/, lint, karma
capacitor.config.ts         # appName LUA Studio, webDir www
config.xml                  # Cordova: id com.luastudio.vjtech, v1.0.31, icon/splash Android+iOS
ionic.config.json           # proyecto angular, integración cordova
ci_post_clone.sh            # build Xcode Cloud
resources/                  # icon/splash Android + iOS
platforms/ - www/           # generados (no editar a mano)
```

Backend consumido (ver `src/app/app.config.ts`): por defecto `pro = true` → `http://3.18.216.78:8080/clock-in-api/`. Alternativas: QA y `http://localhost:8080/clock-in-api/` cambiando los flags `pro`/`qas`.

---

## 2. Lo que necesitas para arrancar el proyecto

### Requisitos previos

| Requisito | Versión / detalle |
|---|---|
| Node.js | `v22.x` (probado con `v22.23.2`) |
| npm | `10.x` (probado con `10.9.8`) |
| Ionic CLI | `npm i -g @ionic/cli` |
| Angular CLI | viene por dependencia (`@angular/cli ^22.1.3`); opcional global |
| Git | cualquiera reciente |
| Backend | API `clock-in-api` corriendo (prod por defecto, o local en `localhost:8080`) |
| Solo iOS | macOS + Xcode + CocoaPods (`gem install cocoapods`) |
| Solo Android | Android Studio + Android SDK + Java JDK compatible + variable `ANDROID_HOME`/`ANDROID_SDK_ROOT` |
| Ver en celular físico (dev) | PC y celular en la **misma red Wi-Fi** |

### Instalación (desde cero)

```bash
# 1. Clonar e instalar
git clone <url-del-repo>
cd app-gym-core-mobile
npm ci        # instalación limpia (usa package-lock.json)
# o: npm install

# 2. Correr en navegador (dev)
npm start
# o:
ionic serve
```

Abrir `http://localhost:8100`.

### Verla en tu celular (como dice el README original)

```bash
ionic serve --external
```

1. Corre el comando y copia la URL de red que imprime (ej. `http://192.168.x.x:8100`).
2. Conecta el celular a la **misma Wi-Fi**.
3. En el iPhone ábrela con **Safari**, en Android con Chrome.
4. Si no carga: revisa firewall, que no haya VPN activa y que el puerto 8100 esté libre.

### Scripts npm disponibles (`package.json`)

| Comando | Qué hace |
|---|---|
| `npm start` / `ng serve` | dev server |
| `npm run build` / `ng build` | build prod a `www/` |
| `npm run watch` | build dev en modo watch |
| `npm test` | tests Karma/Jasmine |
| `npm run lint` / `ng lint` | lint con ESLint |

### Cambiar de ambiente / backend

Edita `src/app/app.config.ts`:

```ts
var pro = true;   // prod: http://3.18.216.78:8080/clock-in-api/
var qas = false;  // QA si pro=false y qas=true
// si ambos false → local: http://localhost:8080/clock-in-api/
```

Para que Android físico/emulador permita `http://` (texto claro) ya existe `resources/android/xml/network_security_config.xml` referenciado desde `config.xml`.

### Compilar a Android / iOS (Cordova)

```bash
# Android (requiere Android Studio/SDK)
ionic cordova platform add android   # solo la primera vez
ionic cordova build android --prod --release
ionic cordova run android            # instala en dispositivo/emulador

# iOS (requiere macOS + Xcode + CocoaPods)
ionic cordova platform add ios       # solo la primera vez
ionic cordova build ios --prod --release
cd platforms/ios
pod install --repo-update
cd ../..
# luego abrir platforms/ios/*.xcworkspace en Xcode para firmar y correr
```

En Xcode Cloud esto lo hace solo `ci_post_clone.sh`.

### Checklist de problemas comunes

- **Puerto ocupado**: `ionic serve --port=8200 --external`.
- **`npm ci` falla**: borra `node_modules` + `package-lock` solo si es necesario, o usa `npm install`.
- **No se ve desde el celular**: misma Wi-Fi, sin VPN, permite Node en el firewall.
- **La API no responde**: confirma que `API_URL` en `app.config.ts` sea alcanzable desde tu red (en celular físico, `localhost` del PC **no** sirve; usa la IP LAN o la URL prod/QA).
- **Build iOS falla por pods**: `cd platforms/ios && pod install --repo-update`.
- **Build Android falla por SDK**: verifica `ANDROID_SDK_ROOT`, Java y licencias (`sdkmanager --licenses`).
- Estado de deuda técnica y siguientes pasos: ver `mejoras.md` (interfaces, Signals, interceptor HTTP, strict mode, tests, PWA).
