# Discord Daily Challenge Bot

Publica automáticamente un desafío diario (imagen) en un canal de Discord, crea una encuesta
nativa con alternativas genéricas **A / B / C / D**, y al día siguiente (justo antes de publicar
el nuevo desafío) revela cuál era la alternativa correcta del día anterior.

**No necesita un servidor prendido 24/7.** GitHub Actions enciende el script una vez al día,
lo ejecuta, y lo apaga. Es gratis para este uso.

## Cómo funciona

Cada día, a la hora que definas en el cron:
1. El script se enciende (GitHub lo prende solo).
2. Si había una encuesta pendiente del día anterior, envía un mensaje con la respuesta correcta.
3. Toma el **primer** ítem de `queue.json`, publica su imagen y abre una encuesta nueva con
   opciones A/B/C/D.
4. Guarda los cambios (`queue.json` y `state.json`) de vuelta en el repositorio.
5. El script se apaga. GitHub lo vuelve a encender mañana.

Tú solo mantienes `queue.json` con la ruta de la imagen y la letra correcta de cada desafío —
no escribes el texto de las alternativas porque Discord no permite opciones con imagen; la
imagen ya trae el enunciado y las opciones dibujadas.

## Paso a paso completo

### 1. Crea el bot en Discord

1. Ve a https://discord.com/developers/applications → **New Application** → ponle un nombre.
2. En el menú lateral, sección **Bot** → **Reset Token** → copia ese token (guárdalo, no lo
   compartas ni lo subas a Github, es tu `DISCORD_TOKEN`).
3. En **OAuth2 → URL Generator**: marca el scope `bot`, y en permisos marca:
   Ver canal, Enviar mensajes, Adjuntar archivos, Crear encuestas.
4. Copia el link generado abajo, ábrelo en el navegador y agrega el bot a tu servidor.
5. En Discord: Configuración de usuario → Avanzado → activa **Modo desarrollador**.
6. Click derecho en tu canal de desafíos → **Copiar ID de canal** (es tu `CHANNEL_ID`).

### 2. Sube el código a Github

1. Crea cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo (puede ser privado, eso no afecta nada).
3. Sube TODO el contenido de este proyecto (arrastra los archivos en "Add file" → "Upload files"
   si no quieres usar la terminal), **excepto el archivo `.env`** — ese nunca se sube, ya que el
   token va a vivir en un lugar seguro dentro de Github (ver paso 3).

### 3. Configura los "Secrets" en Github

Los secrets son variables privadas que Github guarda cifradas y que el workflow puede usar sin
que queden visibles en el código.

1. En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**.
2. Crea dos secrets:
   - `DISCORD_TOKEN` → el token del bot.
   - `CHANNEL_ID` → el ID del canal.

### 4. Ajusta la hora en el workflow

Abre `.github/workflows/daily.yml` y edita esta línea:

```yaml
- cron: "0 14 * * *"
```

El cron de Github usa **hora UTC**, no tu hora local. Ejemplo: si quieres que publique a las
9:00am hora de Chile/Perú/Colombia (UTC-5 aprox.), eso equivale a las 14:00 UTC → `"0 14 * * *"`.
Ajusta el número según tu zona horaria (puedes buscar "mi zona horaria a UTC" para calcularlo).

### 5. Agrega tus desafíos

1. Sube la imagen del problema (con enunciado y alternativas ya dibujados dentro de la imagen)
   a la carpeta `challenges/`.
2. Agrega una entrada al final de `queue.json`:

```json
{
  "image": "challenges/2026-08-01.png",
  "answer": "B"
}
```

El bot va tomando los ítems en orden, uno por día, y los va quitando de la cola a medida que
los publica.

### 6. Pruébalo manualmente (sin esperar al cron)

En tu repo de Github: pestaña **Actions** → selecciona el workflow "Publicar desafío diario" →
botón **Run workflow**. Esto lo ejecuta al instante, ideal para confirmar que todo funciona antes
de dejarlo en automático.

## A partir de aquí, tu única tarea diaria/semanal es:

Subir imágenes nuevas a `challenges/` y agregar sus líneas en `queue.json`. Todo lo demás
(publicar, crear la encuesta, revelar la respuesta, guardar el estado) ocurre solo.

## Notas

- Si `queue.json` se queda vacío, el workflow corre igual pero no publica nada — revisa el log
  en la pestaña Actions.
- El estado de la encuesta pendiente vive en `state.json`, que el propio workflow actualiza y
  commitea automáticamente — no lo edites a mano.
- Discord exige que la duración de la encuesta sea en horas enteras (`POLL_DURATION_HOURS`).
- Si alguna vez quieres correrlo en tu computador para probar antes de subirlo, sigue existiendo
  esa opción: `npm install`, copia `.env.example` a `.env`, complétalo, y `npm start` — pero para
  producción no hace falta, GitHub Actions lo reemplaza.
