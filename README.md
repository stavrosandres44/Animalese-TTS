# Animalese-TTS

This is a fully client-side TTS (Text-to-Speech) engine that simulates the iconic "Animalese" voice from *Animal Crossing: New Horizons*. It works by combining individual audio samples—each representing a letter of the alphabet—to recreate phrases and sentences based on the text input by the user.

All audio samples have been **ripped directly from the game**, preserving the authentic vocal texture and rhythm found in the original Animalese voices. This makes the experience as accurate and faithful to the game as possible.

## 🎤 How It Works

* When you type a sentence in the textbox and hit **Say!**, the script reads the text one letter at a time.
* Each letter is mapped to a corresponding `.aac` audio clip that mimics the way characters talk in *Animal Crossing*.
* These sounds are played sequentially with a short delay between letters and a slightly longer pause between words.

The system is lightweight, fast, and doesn't require any server or API. It runs entirely in the browser.

## 🎭 Voice Personalities

The TTS system includes multiple voice variations, each based on a personality type found in the game. These include:

* **Sweet** – soft, cute, and bubbly
* **Peppy** – fast-paced, excited, and cheerful
* **Big Sister** – mature, calm, and slightly deeper
* **Snooty** – elegant, posh, and sharp

Each voice personality corresponds to a different folder of audio clips, giving a unique tone and delivery to the same input text.

You can change the voice by selecting from the dropdown menu above the input box. The choice of personality affects which set of letter sounds is used when speaking.

## ⚙️ Features

* ✅ **Authentic Animalese sound** (ripped from *New Horizons*)
* ✅ **Multiple personalities**, each with distinct voice characteristics
* ✅ **Customizable pitch and pitch variation** via sliders
* ✅ **Command system** – special effects like `[angry]` can be inserted inline to trigger expressive sounds
* ✅ **Responsive UI** that updates the play button, dropdown, and pitch controls in real time
* ✅ **No servers, no tracking, 100% local**

## 🔊 Special Commands

You can include certain keywords in the text to trigger sound effects. For example:

* `[angry]` — pauses speech and plays a custom angry sound before continuing

These commands can be typed anywhere in your input and will be detected and executed inline.
