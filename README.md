# Backend Nube — Hidroponía Pro

Backend mínimo que expone las dos rutas que tu app Flutter necesita en Modo Nube:

- `GET /lecturas/ultima` — la app lo consulta cada 5 segundos.
- `POST /lecturas` — la app lo llama desde "Registrar lectura manual".

## Probarlo en tu computadora primero (opcional pero recomendado)

```bash
cd backend-nube
npm install
npm start
```

Abre `http://localhost:3000` en el navegador — deberías ver un JSON confirmando que el servidor está vivo.

Prueba mandar una lectura de ejemplo:

```bash
curl -X POST http://localhost:3000/lecturas \
  -H "Content-Type: application/json" \
  -d '{"valores": {"ph": 6.2, "conductividad_ce": 1.5, "nitrogeno_n": 45, "fosforo_p": 20, "potasio_k": 60, "temperatura": 22, "humedad": 75}}'
```

Y luego confirma que la puedas leer de vuelta:

```bash
curl http://localhost:3000/lecturas/ultima
```

Si ambas responden bien, ya está listo para subir a Railway.

## Desplegar en Railway

1. Si es un proyecto nuevo: crea un repositorio en GitHub con estos 3 archivos (`server.js`, `package.json`, este `README.md`) y conéctalo a Railway (New Project → Deploy from GitHub repo).
2. Si YA tienes un backend en Railway con otra estructura: copia el contenido de `server.js` dentro de tu proyecto existente (o al menos las dos rutas `/lecturas/ultima` y `/lecturas`), agrega `cors` a tu `package.json` si no lo tienes, y haz `git add . && git commit -m "agrega ruta /lecturas/ultima" && git push`.
3. Railway va a detectar el `package.json`, correr `npm install` y luego `npm start` automáticamente.
4. Cuando termine de desplegar, copia la URL pública que te da Railway (algo como `https://tu-proyecto.up.railway.app`).

## Configurar la app

1. Abre la app → menú ⋮ → Ajustes de Red.
2. Selecciona "☁️ Nube / Internet directo".
3. Pega la URL de Railway en el campo de texto.
4. Presiona "Probar conexión con GET /lecturas/ultima" — si acabas de desplegar y todavía no has mandado ninguna lectura, verás un 404 ("Todavía no hay ninguna lectura guardada") en vez del error anterior de "no tiene la ruta" — eso significa que la ruta YA existe, solo falta que le mandes datos.
5. Manda una lectura de prueba con `curl` (como arriba, mmm usando tu URL de Railway en vez de localhost) o desde el botón "Registrar lectura manual" dentro de la app.
6. Vuelve a presionar "Probar conexión" — ahora debería decir "✅ Conexión exitosa".
7. Guarda la configuración. La app empezará a jalar esa lectura automáticamente cada 5 segundos.

## Nota sobre persistencia

Este backend guarda la última lectura en un archivo local (`lecturas.json`). Es suficiente para lo que tu app necesita ahora mismo (solo lee "la última"), pero **no conserva historial** ni sobrevive a un nuevo despliegue en Railway (el disco se reinicia con cada `git push`). Si más adelante quieres que el backend también guarde histórico completo (no solo la última lectura), lo correcto es agregar una base de datos — Railway ofrece Postgres gratis en el mismo proyecto — y puedo ayudarte a conectarlo cuando lo necesites.
