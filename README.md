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
3. Toma la **primera fila** de `queue.csv`, publica su imagen y abre una encuesta nueva con
   opciones A/B/C/D.
4. Guarda los cambios (`queue.csv` y `state.json`) de vuelta en el repositorio.
5. El script se apaga. GitHub lo vuelve a encender mañana.

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
3. Sube el contenido de este proyecto (arrastra los archivos en "Add file" → "Upload files"),
   **excepto el archivo `.env`** — ese nunca se sube, el token va en un Secret (ver paso 4).

⚠️ **Importante:** la carpeta `.github/workflows/` normalmente no se sube bien arrastrándola
junto con el resto, porque muchos navegadores no preservan carpetas ocultas al arrastrar.
Súbela así, aparte, para asegurarte de que quede bien:

1. En tu repositorio, click **"Add file" → "Create new file"**.
2. En el cuadro de nombre del archivo escribe exactamente: `.github/workflows/daily.yml`
   (al escribir las barras `/`, Github crea las carpetas solo).
3. Abre el archivo `daily.yml` de este proyecto, copia todo su contenido y pégalo en el editor.
4. Click **"Commit new file"**.

Recién después de esto, en la pestaña **Actions** de tu repositorio debería aparecer listado
"Publicar desafío diario" como workflow real — no la opción de "set up yourself".

### 3. Sube las imágenes a la carpeta `challenges/`

1. Entra a la carpeta `challenges/` dentro de tu repositorio (haz click en ella).
2. Click **"Add file" → "Upload files"**.
3. Arrastra o selecciona las imágenes de tus desafíos.
4. Commit.

Repite esto cada vez que tengas imágenes nuevas — puedes subir varias de una vez.

### 4. Configura los "Secrets" en Github

Los secrets son variables privadas que Github guarda cifradas y que el workflow puede usar sin
que queden visibles en el código.

1. En tu repositorio: **Settings → Secrets and variables → Actions → New repository secret**.
2. Crea dos secrets:
   - `DISCORD_TOKEN` → el token del bot.
   - `CHANNEL_ID` → el ID del canal.

### 5. Ajusta la hora en el workflow

Abre `.github/workflows/daily.yml` (dentro de tu repo en Github, con el lápiz de editar) y
cambia esta línea:

```yaml
- cron: "0 14 * * *"
```

El cron de Github usa **hora UTC**, no tu hora local. Ejemplo: 9:00am hora de Chile/Perú/Colombia
(UTC-5 aprox.) equivale a las 14:00 UTC → `"0 14 * * *"`. Busca "mi zona horaria a UTC" para
calcular el número exacto que te corresponde.

### 6. Agrega tus desafíos a la "planilla" (`queue.csv`)

`queue.csv` es literalmente una tabla de 2 columnas — imagen y respuesta — igual que un Excel,
solo que en formato de texto plano:

```csv
image,answer
challenges/2026-08-01.png,B
challenges/2026-08-02.png,A
```

Puedes editarlo de tres formas, la que te acomode más:

- **Directo en Github:** entra al archivo `queue.csv`, click en el lápiz de editar, y Github lo
  muestra como una tabla editable (botón "Edit" tiene una vista de tabla, no solo texto plano).
- **En Excel o Google Sheets:** ábrelo (Excel reconoce `.csv` directo), edítalo con columnas
  normales, y luego lo vuelves a exportar/guardar como `.csv` y lo subes reemplazando el archivo
  en Github.
- **A mano:** cada fila es `nombre-de-la-imagen,letra-correcta`.

La columna `image` debe decir la ruta dentro del repositorio, por ejemplo
`challenges/2026-08-01.png` — o sea, el nombre exacto del archivo que subiste en el paso 3,
con el prefijo `challenges/` adelante.

El bot va tomando la primera fila cada día y la va borrando de `queue.csv` a medida que la usa,
así que la "planilla" se va achicando sola.

### 7. Pruébalo manualmente (sin esperar al cron)

En tu repo de Github: pestaña **Actions** → selecciona el workflow "Publicar desafío diario" →
botón **Run workflow**. Esto lo ejecuta al instante, ideal para confirmar que todo funciona antes
de dejarlo en automático.

## A partir de aquí, tu única tarea es:

1. Subir imágenes nuevas a `challenges/`.
2. Agregar sus filas en `queue.csv` (imagen + letra correcta).

Todo lo demás (publicar, crear la encuesta, revelar la respuesta, guardar el estado) ocurre solo.

## Notas

- Si `queue.csv` se queda sin filas, el workflow corre igual pero no publica nada — revisa el
  log en la pestaña Actions.
- El estado de la encuesta pendiente vive en `state.json`, que el propio workflow actualiza y
  commitea automáticamente — no lo edites a mano.
- Discord exige que la duración de la encuesta sea en horas enteras (`POLL_DURATION_HOURS`).
- Si alguna vez quieres correrlo en tu computador para probar antes de subirlo: `npm install`,
  copia `.env.example` a `.env`, complétalo, y `npm start` — pero para producción no hace falta,
  GitHub Actions lo reemplaza.
