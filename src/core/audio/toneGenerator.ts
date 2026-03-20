import { SOUND_DURATION_MS, SOUND_PAUSE_MS, SOUND_REPEATS } from '../constants';

let audioContext: AudioContext | null = null;
let isPlaying = false;
let currentTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playTone(frequency: number, volume: number = 0.5): void {
  if (isPlaying) {
    return;
  }
  
  isPlaying = true;
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  
  playSequence(frequency, volume);
}

function playSequence(frequency: number, volume: number): void {
  let repeat = 0;
  
  function playBeep(): void {
    if (repeat >= SOUND_REPEATS) {
      isPlaying = false;
      return;
    }
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + SOUND_DURATION_MS / 1000
    );
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + SOUND_DURATION_MS / 1000);
    
    repeat++;
    
    currentTimeout = setTimeout(() => {
      playBeep();
    }, SOUND_DURATION_MS + SOUND_PAUSE_MS);
  }
  
  playBeep();
}

export function stopSound(): void {
  isPlaying = false;
  
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
}

export function isSoundPlaying(): boolean {
  return isPlaying;
}
