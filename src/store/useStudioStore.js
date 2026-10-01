import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { parseScript } from '../utils/scriptParser';
import { SAMPLE_SCRIPTS } from '../utils/sampleScripts';

let mmkvStorage = null;
try {
  mmkvStorage = new MMKV({ id: 'scriptcast-studio-storage' });
} catch (e) {
  console.warn('MMKV initialization fallback:', e);
}

const initialPreset = SAMPLE_SCRIPTS[0];
const initialParsed = parseScript(initialPreset.rawText, initialPreset.defaultWpm || 150);

export const useStudioStore = create((set, get) => ({
  scripts: SAMPLE_SCRIPTS,
  currentScript: initialPreset,
  beats: initialParsed.beats,
  parsedInfo: initialParsed,
  currentBeatIndex: 0,
  wpm: 150,

  recordingTakes: [],
  isRecording: false,
  recordingStage: 'idle',
  countdownNumber: 3,
  elapsedSeconds: 0,

  setScript: (rawText, title = 'Custom LLM Script') => {
    const { wpm } = get();
    const parsed = parseScript(rawText, wpm);
    const updatedScript = {
      id: `script-${Date.now()}`,
      title,
      category: 'Custom',
      rawText,
      defaultWpm: wpm,
      targetDuration: `${parsed.totalDurationSec}s`
    };

    set({
      currentScript: updatedScript,
      beats: parsed.beats,
      parsedInfo: parsed,
      currentBeatIndex: 0,
      recordingTakes: [],
      recordingStage: 'idle',
      elapsedSeconds: 0
    });

    try {
      mmkvStorage?.set('lastScript', rawText);
    } catch (e) {
      // ignore
    }
  },

  loadPresetScript: (presetId) => {
    const preset = SAMPLE_SCRIPTS.find(s => s.id === presetId) || SAMPLE_SCRIPTS[0];
    const { wpm } = get();
    const parsed = parseScript(preset.rawText, wpm);

    set({
      currentScript: preset,
      beats: parsed.beats,
      parsedInfo: parsed,
      currentBeatIndex: 0,
      recordingTakes: [],
      recordingStage: 'idle',
      elapsedSeconds: 0
    });
  },

  setWpm: (wpm) => {
    const { currentScript } = get();
    const parsed = parseScript(currentScript.rawText, wpm);
    set({
      wpm,
      beats: parsed.beats,
      parsedInfo: parsed
    });
    try {
      mmkvStorage?.set('userWpm', wpm);
    } catch (e) {
      // ignore
    }
  },

  setCurrentBeatIndex: (index) => {
    const { beats } = get();
    if (index >= 0 && index < beats.length) {
      set({
        currentBeatIndex: index,
        recordingStage: 'idle',
        elapsedSeconds: 0
      });
    }
  },

  nextBeat: () => {
    const { currentBeatIndex, beats } = get();
    if (currentBeatIndex < beats.length - 1) {
      set({
        currentBeatIndex: currentBeatIndex + 1,
        recordingStage: 'idle',
        elapsedSeconds: 0
      });
    }
  },

  previousBeat: () => {
    const { currentBeatIndex } = get();
    if (currentBeatIndex > 0) {
      set({
        currentBeatIndex: currentBeatIndex - 1,
        recordingStage: 'idle',
        elapsedSeconds: 0
      });
    }
  },

  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordingStage: (recordingStage) => set({ recordingStage }),
  setCountdownNumber: (countdownNumber) => set({ countdownNumber }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),

  addTake: (uri) => {
    const { recordingTakes, currentBeatIndex } = get();
    const updated = [...recordingTakes];
    updated[currentBeatIndex] = uri;
    set({ recordingTakes: updated });
  },

  retakeCurrentBeat: () => {
    const { recordingTakes, currentBeatIndex } = get();
    const updated = [...recordingTakes];
    delete updated[currentBeatIndex];
    set({
      recordingTakes: updated,
      recordingStage: 'idle',
      elapsedSeconds: 0
    });
  },

  clearTakes: () => {
    set({
      recordingTakes: [],
      currentBeatIndex: 0,
      recordingStage: 'idle',
      elapsedSeconds: 0,
      isRecording: false
    });
  }
}));
