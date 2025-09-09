let AUDIO_PATH = 'animalese/female/voice_1/';
const AUDIO_EXT = '.aac';
const DELAY_MS = 125;
const WORD_DELAY_MS = 55;

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

dropdownOptions.forEach(option => {
  option.addEventListener('click', function () {
    dropdownOptions.forEach(opt => opt.classList.remove('selected'));
    this.classList.add('selected');

    const img = this.querySelector('img');
    const text = this.innerText.replace('check', '').trim();
    sweetBtn.innerHTML = `<img src="${img.src}" alt="${img.alt}"> ${text}`;

    const selectedVoice = this.dataset.voice;
    AUDIO_PATH = `animalese/female/${selectedVoice}/`;
    console.log('Voice changed to:', AUDIO_PATH);

    preloadAudios(AUDIO_PATH); // recargar los audios de la voz seleccionada

    sweetDropdown.classList.remove('open');
    dropdownOpen = false;
  });
});

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

// --- Precarga de audios ---
const audioCache = {};
function preloadAudios(basePath) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  audioCache[basePath] = {};
  letters.forEach(l => {
    const audio = new Audio(basePath + l + AUDIO_EXT);
    audio.load();
    audioCache[basePath][l] = audio;
  });
}

// Precargar todas las voces desde el inicio
['voice_1', 'voice_2', 'voice_3', 'voice_4'].forEach(v => {
  preloadAudios(`animalese/female/${v}/`);
});

function getAudio(letter, basePath) {
  if (audioCache[basePath] && audioCache[basePath][letter]) {
    return audioCache[basePath][letter].cloneNode();
  }
  return null;
}

function playAnimalese(text, onComplete) {
  const letters = text.toLowerCase().split('');
  let current = 0;

  function playNext() {
    if (current >= letters.length) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const l = letters[current];
    let delay = DELAY_MS;

    if (l >= 'a' && l <= 'z') {
      const audio = getAudio(l, AUDIO_PATH);
      if (audio) audio.play();
    } else if (l === ' ') {
      delay = WORD_DELAY_MS;
    }

    current++;
    setTimeout(playNext, delay);
  }

  playNext();
}

function sayIt() {
  const text = textbox.value.trim();
  if (text.length === 0) return;
  setSayPlaying(true);
  playAnimalese(text, () => setSayPlaying(false));
}
