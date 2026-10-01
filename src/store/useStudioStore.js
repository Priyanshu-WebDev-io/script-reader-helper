import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { parseScript } from '../utils/scriptParser';
import { loadScriptFromInput } from '../utils/scriptLoaderEngine';
import { SAMPLE_SCRIPTS } from '../utils/sampleScripts';

let mmkvStorage = null;
try {
  mmkvStorage = createMMKV({ id: 'scriptcast-studio-storage' });
} catch (e) {
  console.warn('MMKV initialization fallback:', e);
}

let initialSavedVideos = [];
try {
  const stored = mmkvStorage?.getString('savedVideos');
  if (stored) {
    initialSavedVideos = JSON.parse(stored);
  }
} catch (e) {
  // ignore
}

let initialScripts = SAMPLE_SCRIPTS;
try {
  const storedScripts = mmkvStorage?.getString('savedScripts');
  if (storedScripts) {
    const parsedStored = JSON.parse(storedScripts);
    if (Array.isArray(parsedStored) && parsedStored.length > 0) {
      initialScripts = parsedStored;
    }
  }
} catch (e) {
  // ignore
}

const initialPreset = initialScripts[0] || SAMPLE_SCRIPTS[0];
const initialParsed = initialPreset.parsedInfo || parseScript(initialPreset.rawText, initialPreset.defaultWpm || 150);

export const useStudioStore = create((set, get) => ({
  scripts: initialScripts,
  currentScript: initialPreset,
  beats: initialPreset.beats || initialParsed.beats,
  parsedInfo: initialParsed,
  currentBeatIndex: 0,
  wpm: initialPreset.defaultWpm || 150,

  savedVideos: initialSavedVideos,
  recordingTakes: [],
  isRecording: false,
  recordingStage: 'idle',
  countdownNumber: 3,
  elapsedSeconds: 0,

  addSavedVideo: (video) => {
    const { savedVideos } = get();
    const updated = [video, ...savedVideos];
    set({ savedVideos: updated });
    try {
      mmkvStorage?.set('savedVideos', JSON.stringify(updated));
    } catch (e) {}
  },

  deleteSavedVideo: (id) => {
    const { savedVideos } = get();
    const updated = savedVideos.filter(v => v.id !== id);
    set({ savedVideos: updated });
    try {
      mmkvStorage?.set('savedVideos', JSON.stringify(updated));
    } catch (e) {}
  },

  setScript: (rawTextOrJson, title = 'Custom LLM Script') => {
    const { wpm, scripts } = get();
    const result = loadScriptFromInput(rawTextOrJson, wpm);

    if (result.success) {
      const updatedScript = {
        ...result.script,
        title: title || result.script.title
      };

      const existingIdx = (scripts || []).findIndex(s => s.id === updatedScript.id);
      let updatedScriptsList = [...(scripts || [])];
      if (existingIdx >= 0) {
        updatedScriptsList[existingIdx] = updatedScript;
      } else {
        updatedScriptsList = [updatedScript, ...(scripts || [])];
      }

      set({
        scripts: updatedScriptsList,
        currentScript: updatedScript,
        beats: updatedScript.beats,
        parsedInfo: updatedScript.parsedInfo,
        wpm: updatedScript.defaultWpm || wpm,
        currentBeatIndex: 0,
        recordingTakes: [],
        recordingStage: 'idle',
        elapsedSeconds: 0
      });

      try {
        mmkvStorage?.set('savedScripts', JSON.stringify(updatedScriptsList));
        mmkvStorage?.set('lastScript', rawTextOrJson);
      } catch (e) {
        // ignore
      }

      return { success: true, script: updatedScript };
    } else {
      return { success: false, error: result.error };
    }
  },

  loadPresetScript: (presetId) => {
    const { scripts, wpm } = get();
    const script = (scripts || []).find(s => s.id === presetId) || SAMPLE_SCRIPTS.find(s => s.id === presetId) || (scripts && scripts[0]);
    if (script) {
      const parsed = script.parsedInfo || parseScript(script.rawText, script.defaultWpm || wpm);
      set({
        currentScript: script,
        beats: script.beats || parsed.beats,
        parsedInfo: script.parsedInfo || parsed,
        wpm: script.defaultWpm || wpm,
        currentBeatIndex: 0,
        recordingTakes: [],
        recordingStage: 'idle',
        elapsedSeconds: 0
      });
    }
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
