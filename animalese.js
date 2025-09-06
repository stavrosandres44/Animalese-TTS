let AUDIO_PATH = 'animalese/female/voice_1/';
const AUDIO_EXT = '.aac';

// ===== Pausas base (pueden ser sobreescritas por voz) =====
let WORD_DELAY_MS = 55;               // Pausa entre palabras
let LETTER_DELAY_MS = 0;              // Pausa entre letras (0 = máximo flujo)
let OVERLAP_MS = 0;                   // ✅ Solape entre letras para evitar "deletreo"

const COMMAND_SOUND = 'assets/sfx/angry.mp3';

const textbox = document.getElementById('textbox');
const sayBtn = document.getElementById('sayBtn');
const sayBtnText = document.getElementById('sayBtnText');
const sayBtnIcon = document.getElementById('sayBtnIcon');
const sayBtnPlayIcon = document.getElementById('sayBtnPlayIcon');
const sweetBtn = document.getElementById('sweetBtn');
const sweetDropdown = document.getElementById('sweetDropdown');
const dropdownOptions = document.querySelectorAll('.dropdown-option');

textbox.addEventListener('input', () => {
  sayBtn.disabled = textbox.value.trim().length === 0;
});

let dropdownOpen = false;
sweetBtn.addEventListener('click', function (e) {
  e.preventDefault();
  dropdownOpen = !dropdownOpen;
  sweetDropdown.classList.toggle('open', dropdownOpen);
});

document.addEventListener('click', function (e) {
  if (!sweetBtn.contains(e.target) && !sweetDropdown.contains(e.target)) {
    sweetDropdown.classList.remove('open');
    dropdownOpen = false;
  }
});

// ===== Audio cache & contexto único =====
let audioContext = null;
const bufferCache = new Map(); // key = ruta completa del audio

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

async function fetchDecodeToBuffer(path) {
  if (bufferCache.has(path)) return bufferCache.get(path);
  const ac = ensureAudioContext();
  const res = await fetch(path);
  const arr = await res.arrayBuffer();
  const buf = await ac.decodeAudioData(arr);
  bufferCache.set(path, buf);
  return buf;
}

async function getLetterBuffer(letter) {
  const path = `${AUDIO_PATH}${letter}${AUDIO_EXT}`;
  return fetchDecodeToBuffer(path);
}

async function getCommandBuffer() {
  return fetchDecodeToBuffer(COMMAND_SOUND);
}

// ===== Ajustes por voz (para evitar deletreo en voces con colas más largas) =====
const VOICE_SETTINGS = {
  default: { letterDelayMs: 0, overlapMs: 30, wordDelayMs: 55 },
  big_sister: { letterDelayMs: 0, overlapMs: 60, wordDelayMs: 40 },
  snooty: { letterDelayMs: 0, overlapMs: 60, wordDelayMs: 40 },
};

function normalizeVoiceKey(v) {
  const s = String(v || '').toLowerCase().replace(/-/g, '_');
  // Evitar regex con barras invertidas en este editor: colapsamos espacios "a mano"
  const parts = s.trim().split(' ').filter(Boolean);
  return parts.join('_');
}

function applyVoiceSettings(voiceKey) {
  const key = normalizeVoiceKey(voiceKey);
  const s = VOICE_SETTINGS[key] || VOICE_SETTINGS.default;
  LETTER_DELAY_MS = s.letterDelayMs;
  OVERLAP_MS = s.overlapMs;
  WORD_DELAY_MS = s.wordDelayMs;
}

// Al cambiar la voz, aplicamos settings y limpiamos la caché
if (sweetDropdown && dropdownOptions.length) {
  dropdownOptions.forEach(option => {
    option.addEventListener('click', function () {
      dropdownOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');

      const img = this.querySelector('img');
      const text = this.innerText.replace('check', '').trim();
      sweetBtn.innerHTML = `<img src="${img.src}" alt="${img.alt}"> ${text}`;

      const selectedVoice = this.dataset.voice;
      AUDIO_PATH = `animalese/female/${selectedVoice}/`;
      bufferCache.clear();
      applyVoiceSettings(selectedVoice); // ✅ aplica solapes específicos
      console.log('Voice changed to:', AUDIO_PATH, 'settings:', { LETTER_DELAY_MS, OVERLAP_MS, WORD_DELAY_MS });

      sweetDropdown.classList.remove('open');
      dropdownOpen = false;
    });
  });
}

function setSayPlaying(isPlaying) {
  if (isPlaying) {
    sayBtnText.textContent = 'Playing';
    sayBtn.disabled = true;
    sayBtnIcon.style.display = 'none';
    sayBtnPlayIcon.style.display = '';
  } else {
    sayBtnText.textContent = 'Say!';
    sayBtn.disabled = textbox.value.trim().length === 0;
    sayBtnIcon.style.display = '';
    sayBtnPlayIcon.style.display = 'none';
  }
}

let pitch = 1.0;
let variation = 0.0; // (reservado)

document.addEventListener('pitchChanged', (e) => {
  if (!isNaN(e.detail.pitch) && isFinite(e.detail.pitch)) {
    pitch = e.detail.pitch;
  }
});

document.addEventListener('variationChanged', (e) => {
  if (!isNaN(e.detail.variation) && isFinite(e.detail.variation)) {
    variation = e.detail.variation;
  }
});

// ===== Reproductor con timeline + solape y envolvente (anti-clicks) =====
async function playAnimalese(text, onComplete) {
  const ac = ensureAudioContext();
  const letters = text.toLowerCase();

  // Asegura settings por defecto la primera vez
  if (LETTER_DELAY_MS === undefined || OVERLAP_MS === undefined || WORD_DELAY_MS === undefined) {
    applyVoiceSettings('default');
  }

  // Pre-carga de buffers necesarios
  const neededKeys = new Set();
  for (let i = 0; i < letters.length; i++) {
    if (letters.startsWith('[angry]', i)) { neededKeys.add('[angry]'); i += 6; continue; }
    const l = letters[i];
    if (l >= 'a' && l <= 'z') neededKeys.add(l);
  }
  await Promise.all(Array.from(neededKeys).map(k => k === '[angry]' ? getCommandBuffer() : getLetterBuffer(k)));

  let t = ac.currentTime + 0.05; // pequeño offset de seguridad
  let lastSource = null;

  const overlapS = Math.max(0, OVERLAP_MS) / 1000;
  const letterGapS = Math.max(0, LETTER_DELAY_MS) / 1000;
  const wordGapS = Math.max(0, WORD_DELAY_MS) / 1000;

  for (let i = 0; i < letters.length; i++) {
    if (letters.startsWith('[angry]', i)) {
      const buf = await getCommandBuffer();
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start(t);
      t += buf.duration; // sfx no se solapa
      lastSource = src;
      i += 6;
      continue;
    }

    const l = letters[i];

    if (l === ' ') { t += wordGapS; continue; }

    if (l >= 'a' && l <= 'z') {
      const buf = await getLetterBuffer(l);

      const src = ac.createBufferSource();
      src.buffer = buf;
      const gain = ac.createGain();

      // Pitch en cents
      const detuneCents = Math.log2(pitch) * 1200;
      try { src.detune.value = detuneCents; } catch(_) {}

      // Envolvente corta para evitar clicks y permitir solape limpio
      const ATTACK = 0.005, RELEASE = 0.02; // 5ms de ataque, 20ms de caída
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(1, t + ATTACK);
      const endTime = t + buf.duration;
      gain.gain.setValueAtTime(1, endTime - RELEASE);
      gain.gain.linearRampToValueAtTime(0, endTime);

      src.connect(gain);
      gain.connect(ac.destination);
      src.start(t);

      // Programar el inicio de la siguiente letra con solape
      t += Math.max(0, buf.duration - overlapS) + letterGapS;
      lastSource = src;
      continue;
    }

    // Otros caracteres: usa gap de letra
    t += letterGapS;
  }

  if (lastSource) {
    lastSource.addEventListener('ended', () => { if (typeof onComplete === 'function') onComplete(); });
  } else {
    if (typeof onComplete === 'function') onComplete();
  }
}

function sayIt() {
  const text = textbox.value.trim();
  if (text.length === 0) return;
  setSayPlaying(true);
  playAnimalese(text, () => setSayPlaying(false));
}


