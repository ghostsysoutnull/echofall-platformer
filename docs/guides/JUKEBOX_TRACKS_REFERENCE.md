# Jukebox Special Tracks Reference

This document outlines the stylistic and technical composition of the exclusive 80s synthwave/arcade-inspired tracks available in the Jukebox. These tracks are designed to evoke the feeling of classic SEGA arcade games (like *Outrun*) and the broader synthwave aesthetic.

## Track Overviews

### 1. Neon Coastline (`JUKEBOX_NEON_COASTLINE`)
*   **Tempo:** 120 BPM (Mid-Tempo Groove)
*   **Vibe:** Deep, warm, and atmospheric. A realistic, evolving 80s analog synthwave track.
*   **Instrumentation & Composition:**
    *   **Pad:** A deep, warm analog-style pad playing an Am7 chord (110.00, 130.81, 164.81, 220.00 Hz) using sawtooth waves with slight detuning for analog warmth.
    *   **Filter:** A slow, sweeping filter LFO (0.05 Hz) modulating the pad's lowpass filter to create an evolving soundscape.
    *   **Bass:** A plucky, resonant square-wave bass playing a driving 8th-note pattern with octave jumps (55.00 Hz to 110.00 Hz). It uses a sharp filter envelope (2000 Hz decaying to 400 Hz) for a "plucky" attack.
    *   **Drums:** A heavy, gated snare on beats 2 and 4, created using filtered noise and a sharp gain envelope with a hold phase.
    *   **Lead:** A shimmering, delayed sawtooth synth lead playing notes from the A minor pentatonic scale (440.00, 523.25, 659.25, 880.00 Hz) on specific 8th-note subdivisions.

### 2. Ocean Drive '86 (`JUKEBOX_OCEAN_DRIVE_86`)
*   **Tempo:** 145 BPM (Fast)
*   **Vibe:** High-energy, optimistic, and punchy. The ultimate "start your engines" track, heavily inspired by the "Splash Wave" style.
*   **Instrumentation & Composition:**
    *   **Pad:** Lush, jazzy electric piano/synth chords (73.42, 110.00, 146.83 Hz) with a subtle sine LFO for vibrato.
    *   **Bass:** A galloping 16th-note sawtooth bassline (55 Hz) with a tight, punchy envelope.
    *   **Drums:** A driving four-on-the-floor kick drum and busy percussion with high-passed noise for hi-hats/cymbals.
    *   **Lead:** Bright, brassy FM-style synth leads (triangle/sine mix) carrying a highly melodic, catchy hook, often with a delayed echo effect.

### 3. Passing Breeze (`JUKEBOX_PASSING_BREEZE`)
*   **Tempo:** 120 BPM (Mid-Tempo Groove)
*   **Vibe:** Smooth, breezy, and slightly tropical. Perfect for a relaxed cruise past pixelated palm trees, inspired by the "Magical Sound Shower" style.
*   **Instrumentation & Composition:**
    *   **Pad:** Warm, sweeping sine-wave synth pads playing a Cmaj7-ish chord (130.81, 164.81, 196.00, 246.94 Hz) with a slow LFO.
    *   **Bass:** A bouncy, syncopated "slap bass" style square-wave synth (65.41 Hz / C2) playing a groovy 16th-note pattern.
    *   **Percussion:** Latin-inspired percussion (congas, cowbells) using short, pitched sine bursts.
    *   **Lead:** A playful, syncopated marimba or steel-drum-like triangle-wave synth lead.

### 4. Midnight Circuit (`JUKEBOX_MIDNIGHT_CIRCUIT`)
*   **Tempo:** 155 BPM (Very Fast)
*   **Vibe:** Intense, slightly darker, and highly competitive. Think neon city lights blurring past your windshield at 2 AM.
*   **Instrumentation & Composition:**
    *   **Bass:** A deep, aggressive square-wave bass (41.20 Hz / E1) playing a relentless rolling 16th-note pattern.
    *   **Arpeggiator:** A fast, continuous sawtooth arpeggiator playing an E minor arpeggio (164.81, 196.00, 246.94, 329.63 Hz).
    *   **Drums:** Heavy, gated-reverb drum machine hits, specifically a massive snare on beats 2 and 4.
    *   **Lead:** Piercing, soaring square-wave synth leads hitting high notes (E5, G5) with long sustain and delay.

---

## AI Agent Guide: Composing in the "Neon Coastline" Style

If you are an AI agent tasked with generating a new track in the style of `JUKEBOX_NEON_COASTLINE` (realistic 80s analog synthwave), follow these compositional and technical guidelines using the Web Audio API structure established in `audio/tracks.js`.

### 1. The Foundation: Warm Analog Pads
*   **Waveform:** Use `sawtooth` oscillators.
*   **Chords:** Use extended chords (Minor 7ths, Major 7ths, 9ths). Avoid simple triads.
*   **Analog Warmth:** Instantiate multiple oscillators for the chord notes and apply a slight, random `detune` value (e.g., `(Math.random() - 0.5) * 10`) to each to simulate analog oscillator drift.
*   **Movement:** Route the pad through a `lowpass` filter and modulate the filter's `frequency` with a very slow `sine` LFO (e.g., 0.05 Hz) to create a sweeping, evolving texture.

### 2. The Groove: Plucky, Driving Bass
*   **Waveform:** Use `square` or `sawtooth` waves.
*   **Pattern:** Use a driving 8th-note or 16th-note pattern. Incorporate octave jumps (e.g., alternating between A1 and A2) to create momentum.
*   **Envelope:** The bass *must* be plucky. Use `exponentialRampToValueAtTime` on a GainNode to create a sharp attack and quick decay.
*   **Filter Envelope:** For extra "pluck," apply an envelope to a `lowpass` filter on the bass, starting high (e.g., 2000 Hz) and decaying rapidly (e.g., to 400 Hz) alongside the volume envelope.

### 3. The Beat: Gated Drums
*   **The Snare:** The defining drum sound of this era is the gated snare.
*   **Implementation:** Use a noise source (`makeNoiseSource`) routed through a `bandpass` filter (around 1000-1500 Hz).
*   **The Gate Envelope:** The volume envelope is crucial. It needs a sharp attack, a brief *hold* phase where the volume stays constant, and then a very rapid release.
    ```javascript
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.4, now + 0.01); // Attack
    g.gain.setValueAtTime(0.4, now + 0.15);               // HOLD (The "Gate")
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); // Rapid Release
    ```

### 4. The Hook: Shimmering Leads
*   **Waveform:** Use `sawtooth` or `square` waves.
*   **Melody:** Use pentatonic scales (Minor or Major) for a classic, nostalgic feel. Play sparse, syncopated melodies rather than continuous streams of notes.
*   **Effects:** The lead *must* have delay/echo. If the `aux.delay` node is available in the environment, route the lead's gain node to it.

### 5. Code Structure Example
When generating the code, follow the established pattern:
1.  Initialize `nodes` and `timers` arrays.
2.  Create continuous elements (Pads, LFOs) and push them to `nodes`.
3.  Create a `setInterval` loop for the rhythmic elements (Bass, Drums, Leads).
4.  Inside the loop, use `ctx.currentTime` to schedule precise audio events using `setValueAtTime` and `exponentialRampToValueAtTime`.
5.  Push the interval ID to `timers`.
6.  Return `{ nodes, timers }`.