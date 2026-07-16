# Cartera Valentin — PWA

Frontend Nuxt 3 instalable (PWA real) + funciones serverless que leen/escriben
directo al Google Sheet "Cartera Valentin" vía la API oficial de Sheets.
El Sheet sigue siendo la única base de datos — esto solo reemplaza el
Apps Script Web App por algo instalable de verdad.

## 1. Cuenta de servicio de Google (una sola vez)

1. https://console.cloud.google.com → crear proyecto.
2. APIs y servicios → Biblioteca → habilitar **Google Sheets API**.
3. APIs y servicios → Credenciales → Crear credenciales → **Cuenta de servicio**.
4. Entrar a la cuenta de servicio → pestaña Claves → Agregar clave → JSON. Descarga un archivo.
5. Copiar el email de la cuenta de servicio (`...gserviceaccount.com`).
6. En el Google Sheet "Cartera Valentin" → Compartir → pegar ese email → permiso **Editor**.

## 2. Variables de entorno

Copiá `.env.example` a `.env` (para probar local) y completá:

- `GOOGLE_SHEET_ID`: el ID en la URL del Sheet, entre `/d/` y `/edit`.
- `GOOGLE_SERVICE_ACCOUNT_KEY`: el contenido completo del JSON descargado, pegado como una sola línea.

## 3. Correr local (opcional, para probar antes de deployar)

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## 4. Deploy a Vercel (gratis)

1. Subí esta carpeta a un repo de GitHub (puede ser privado).
2. https://vercel.com → Add New Project → importá el repo.
3. En "Environment Variables" cargá `GOOGLE_SHEET_ID` y `GOOGLE_SERVICE_ACCOUNT_KEY` (los mismos valores del paso 2).
4. Deploy. Vercel detecta Nuxt automáticamente.
5. Te da una URL tipo `tu-proyecto.vercel.app` — esa es la app.

## 5. Instalar en el celular

Abrí la URL de Vercel en Chrome del celular → menú (⋮) → **Instalar app** (o "Agregar a
pantalla de inicio"). A diferencia del Apps Script, esta vez es una PWA real: queda
instalada, con su propio ícono, y el manifest está configurado para modo standalone.

## Notas

- Sigue habiendo un límite: cada acción hace una llamada a la Google Sheets API, así que
  necesitás conexión — no hay modo offline (para eso habría que agregar una cola local,
  es un paso más si lo necesitás más adelante).
- Multi-dispositivo: como todo vive en Vercel + el Sheet, ya funciona desde cualquier
  dispositivo que abra la misma URL — no hace falta nada extra para eso.
