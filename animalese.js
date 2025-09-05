let AUDIO_PATH = 'animalese/female/voice_1/';
const AUDIO_EXT = '.aac';
const DELAY_MS = 125;
const WORD_DELAY_MS = 55;
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

function playCommandSound(callback) {
  const cmdAudio = new Audio(COMMAND_SOUND);
  cmdAudio.play();
  cmdAudio.onended = () => callback();
}

let pitch = 1.0;
let variation = 0.0;

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

async function playAnimalese(text, onComplete) {
  const letters = text.toLowerCase().split('');
  let current = 0;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  async function playNext() {
    if (current >= letters.length) {
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    if (text.slice(current).startsWith('[angry]')) {
      current += 7;
      playCommandSound(playNext);
      return;
    }

    const l = letters[current];

    if (l === ' ') {
      current++;
      setTimeout(playNext, WORD_DELAY_MS);
      return;
    }

    if (l >= 'a' && l <= 'z') {
      try {
        const response = await fetch(AUDIO_PATH + l + AUDIO_EXT);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const detuneCents = Math.log2(pitch) * 1200;
        source.detune.value = detuneCents;

        source.connect(audioContext.destination);
        source.start();

        current++;
        setTimeout(playNext, DELAY_MS);
        return;
      } catch (e) {
        console.error('Error playing letter:', l, e);
      }
    }

    current++;
    setTimeout(playNext, DELAY_MS);
  }

  playNext();
}

function sayIt() {
  const text = textbox.value.trim();
  if (text.length === 0) return;
  setSayPlaying(true);
  playAnimalese(text, () => setSayPlaying(false));
}
