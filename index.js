require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  PollLayoutType,
} = require('discord.js');

const QUEUE_PATH = path.join(__dirname, 'queue.json');
const STATE_PATH = path.join(__dirname, 'state.json');

const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']; // soporta hasta 6 alternativas si algún día las necesitas

// ---------- utilidades de almacenamiento ----------

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadQueue() {
  return readJSON(QUEUE_PATH, []);
}

function saveQueue(queue) {
  writeJSON(QUEUE_PATH, queue);
}

function loadState() {
  // state = { pending: { messageId, channelId, answer, alternativesCount } | null }
  return readJSON(STATE_PATH, { pending: null });
}

function saveState(state) {
  writeJSON(STATE_PATH, state);
}

// ---------- lógica principal ----------

async function revealPreviousAnswer(client, state) {
  if (!state.pending) return;

  const { channelId, answer } = state.pending;
  try {
    const channel = await client.channels.fetch(channelId);
    await channel.send(`📊 ¡La encuesta de ayer terminó! La alternativa correcta era **${answer}**.`);
  } catch (err) {
    console.error('No se pudo enviar la respuesta correcta del desafío anterior:', err);
  }

  state.pending = null;
  saveState(state);
}

async function postNextChallenge(client) {
  const queue = loadQueue();
  const state = loadState();

  if (queue.length === 0) {
    console.log('La cola de desafíos (queue.json) está vacía. No hay nada que publicar hoy.');
    return;
  }

  const next = queue.shift();
  const imagePath = path.join(__dirname, next.image);

  if (!fs.existsSync(imagePath)) {
    console.error(`No se encontró la imagen ${imagePath}. Se descarta este ítem de la cola.`);
    saveQueue(queue);
    return;
  }

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  const attachment = new AttachmentBuilder(imagePath);

  // 1) Publicar la imagen del problema
  await channel.send({ files: [attachment] });

  // 2) Publicar la encuesta nativa con alternativas genéricas A/B/C/D
  const durationHours = Number(process.env.POLL_DURATION_HOURS || 24);
  const pollMessage = await channel.send({
    poll: {
      question: { text: '¿Cuál es la alternativa correcta?' },
      answers: ANSWER_LABELS.slice(0, 4).map((label) => ({ text: label })),
      duration: durationHours,
      allowMultiselect: false,
      layoutType: PollLayoutType.Default,
    },
  });

  // 3) Guardar en el estado que esta encuesta queda pendiente de revelar
  state.pending = {
    messageId: pollMessage.id,
    channelId: channel.id,
    answer: next.answer,
  };
  saveState(state);
  saveQueue(queue);

  console.log(`Desafío publicado (${next.image}). Respuesta correcta guardada: ${next.answer}`);
}

async function dailyJob(client) {
  const state = loadState();
  // Primero revela la respuesta del desafío anterior (si quedó uno pendiente)
  await revealPreviousAnswer(client, state);
  // Luego publica el desafío de hoy
  await postNextChallenge(client);
}

// ---------- arranque del bot: corre una sola vez y se cierra ----------
// El horario ya no lo controla este script, lo controla el "schedule" del
// workflow de GitHub Actions (ver .github/workflows/daily.yml).

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Bot conectado como ${client.user.tag}`);

  try {
    await dailyJob(client);
    console.log('Job diario completado con éxito.');
  } catch (err) {
    console.error('Error en el job diario:', err);
    process.exitCode = 1;
  } finally {
    client.destroy();
    process.exit(process.exitCode ?? 0);
  }
});

client.login(process.env.DISCORD_TOKEN);
