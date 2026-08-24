// ==========================================
// BACKEND MÍNIMO PARA MODO NUBE - HIDROPONÍA PRO
// ==========================================
// Este servidor expone exactamente las rutas que la app Flutter
// (main.dart) espera cuando está en Modo Nube:
//
//   GET  /lecturas/ultima   -> devuelve la última lectura guardada
//   POST /lecturas          -> guarda una nueva lectura (captura manual
//                               desde la app, o la que tú quieras enviar
//                               desde tu propio hardware/script)
//
// La app llama a GET /lecturas/ultima cada 5 segundos mientras el Modo
// Nube esté activo con esta URL configurada (ver
// NetworkConfigService/ApiService.fetchLecturaNube() en main.dart).
//
// Persistencia: se guarda en un archivo local (lecturas.json) para que
// la última lectura sobreviva si el proceso se reinicia. En Railway el
// disco es efímero entre despliegues (se borra al hacer un nuevo
// `git push`), así que esto es solo para reinicios normales del
// contenedor, no para conservar historial permanente. Si más adelante
// quieres histórico real, lo correcto es agregar una base de datos
// (Railway ofrece Postgres gratis) — este archivo es intencionalmente
// simple para resolver el error que tenías ahora mismo.

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARCHIVO_DATOS = path.join(__dirname, 'lecturas.json');

app.use(cors());
app.use(express.json());

// Claves que la app espera reconocer (deben coincidir con kSensores en
// main.dart). Cualquier otra clave que mandes se ignora al leer, pero se
// guarda igual por si la usas para otra cosa.
const CLAVES_VALIDAS = [
  'ph',
  'conductividad_ce',
  'nitrogeno_n',
  'fosforo_p',
  'potasio_k',
  'temperatura',
  'humedad',
];

function leerUltimaLectura() {
  try {
    if (!fs.existsSync(ARCHIVO_DATOS)) return null;
    const contenido = fs.readFileSync(ARCHIVO_DATOS, 'utf8');
    if (!contenido.trim()) return null;
    return JSON.parse(contenido);
  } catch (e) {
    console.error('⚠️ Error leyendo lecturas.json:', e);
    return null;
  }
}

function guardarUltimaLectura(registro) {
  try {
    fs.writeFileSync(ARCHIVO_DATOS, JSON.stringify(registro, null, 2), 'utf8');
  } catch (e) {
    console.error('⚠️ Error guardando lecturas.json:', e);
  }
}

// --------------------------------------
// GET / -> health check simple, útil para confirmar que el servidor
// está vivo desde el navegador o con curl.
// --------------------------------------
app.get('/', (req, res) => {
  res.json({
    ok: true,
    servicio: 'Backend Nube - Hidroponía Pro',
    rutas: ['GET /lecturas/ultima', 'POST /lecturas'],
  });
});

// --------------------------------------
// GET /lecturas/ultima
// --------------------------------------
// La app hace polling a esta ruta cada 5 segundos en Modo Nube. Debe
// responder 200 con un JSON que tenga las lecturas, ya sea plano:
//   { "ph": 6.2, "conductividad_ce": 1.5, ... }
// o envuelto en "valores" (así es como responde este servidor):
//   { "fecha": "...", "valores": { "ph": 6.2, ... } }
// Ambos formatos los acepta ApiService.fetchLecturaNube() en main.dart.
app.get('/lecturas/ultima', (req, res) => {
  const ultima = leerUltimaLectura();
  if (!ultima) {
    // Nada guardado todavía: 404 es la respuesta correcta (la app lo
    // interpreta como "sin datos aún", no como error de servidor caído).
    return res.status(404).json({ error: 'Todavía no hay ninguna lectura guardada.' });
  }
  return res.status(200).json(ultima);
});

// --------------------------------------
// POST /lecturas
// --------------------------------------
// La app manda esto desde "Registrar lectura manual" (modo Nube) con
// body: { "valores": { ...claves... }, "fecha": "2026-08-24T..." }
// También puedes usar esta misma ruta desde tu propio script/hardware
// (por ejemplo un cronjob que lea sensores reales) mandando el mismo
// formato de JSON.
app.post('/lecturas', (req, res) => {
  const body = req.body || {};
  const valoresEntrada = body.valores && typeof body.valores === 'object' ? body.valores : body;

  const valores = {};
  for (const clave of CLAVES_VALIDAS) {
    const v = valoresEntrada[clave];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      valores[clave] = v;
    }
  }

  if (Object.keys(valores).length === 0) {
    return res.status(400).json({
      error: 'No se recibió ninguna clave numérica válida. Claves esperadas: ' + CLAVES_VALIDAS.join(', '),
    });
  }

  const registro = {
    fecha: body.fecha || new Date().toISOString(),
    valores,
  };

  guardarUltimaLectura(registro);
  return res.status(200).json({ ok: true, guardado: registro });
});

// --------------------------------------
// 404 genérico para cualquier otra ruta
// --------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`✅ Backend Nube escuchando en el puerto ${PORT}`);
});
