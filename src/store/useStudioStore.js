import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { parseScript } from '../utils/scriptParser';
import { loadScriptFromInput, validateAndParseJsonScript } from '../utils/scriptLoaderEngine';

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

let initialScripts = [];
try {
  const storedScripts = mmkvStorage?.getString('savedScripts');
  if (storedScripts) {
    const parsedStored = JSON.parse(storedScripts);
    if (Array.isArray(parsedStored)) {
      // Purge any legacy sample templates
      initialScripts = parsedStored.filter(s => s && s.id !== 'shorts-hook' && s.id !== 'tech-review' && !s.title?.includes('Viral Short') && !s.title?.includes('Tech Breakdown'));
      mmkvStorage?.set('savedScripts', JSON.stringify(initialScripts));
    }
  }
} catch (e) {
  // ignore
}

const initialPreset = initialScripts[0] || null;
const initialParsed = initialPreset ? (initialPreset.parsedInfo || parseScript(initialPreset.rawText, initialPreset.defaultWpm || 150)) : null;

export const useStudioStore = create((set, get) => ({
  scripts: initialScripts,
  currentScript: initialPreset,
  beats: initialPreset ? (initialPreset.beats || initialParsed?.beats || []) : [],
  parsedInfo: initialParsed,
  currentBeatIndex: 0,
  wpm: initialPreset?.defaultWpm || 150,

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

  deleteScript: (id) => {
    const { scripts, currentScript } = get();
    const updated = (scripts || []).filter(s => s.id !== id);
    const nextCurrent = currentScript?.id === id ? (updated[0] || null) : currentScript;
    set({ 
      scripts: updated,
      currentScript: nextCurrent,
      beats: nextCurrent?.beats || [],
      parsedInfo: nextCurrent?.parsedInfo || null
    });
    try {
      mmkvStorage?.set('savedScripts', JSON.stringify(updated));
    } catch (e) {}
  },

  setFreeRecordingMode: () => {
    const freeScript = {
      id: `free-${Date.now()}`,
      title: 'Free Recording Session',
      category: 'Free Form',
      defaultWpm: 150,
      targetDuration: '0s',
      rawText: '',
      beats: [
        {
          id: 'free-take-1',
          beatNumber: 1,
          section: 'FREE RECORD',
          spokenText: '',
          stageCues: 'Free recording • Teleprompter disarmed',
          tone: { label: 'Free', emoji: '🎬', color: '#DEDEDE', bg: '#222222' },
          wordCount: 0,
          targetWpm: 150,
          speakingDurationSec: 0,
          pauseAfterSec: 0,
          totalDurationSec: 0,
          emphasisWords: []
        }
      ],
      parsedInfo: {
        beats: [],
        totalWords: 0,
        totalDurationSec: 0,
        estimatedMinutes: 0,
        estimatedSeconds: 0
      }
    };
    set({
      currentScript: freeScript,
      beats: freeScript.beats,
      parsedInfo: freeScript.parsedInfo,
      currentBeatIndex: 0,
      recordingTakes: [],
      recordingStage: 'idle',
      elapsedSeconds: 0
    });
  },

  setScript: (rawTextOrJsonOrObj, title = '') => {
    const { wpm, scripts } = get();

    let updatedScript = null;

    if (rawTextOrJsonOrObj && typeof rawTextOrJsonOrObj === 'object' && Array.isArray(rawTextOrJsonOrObj.beats)) {
      // Direct script object passed
      updatedScript = {
        ...rawTextOrJsonOrObj,
        title: title || rawTextOrJsonOrObj.title || 'Untitled Script'
      };
    } else if (typeof rawTextOrJsonOrObj === 'string') {
      // Try strict JSON parser first
      const jsonRes = validateAndParseJsonScript(rawTextOrJsonOrObj, wpm, title);
      if (jsonRes.valid) {
        updatedScript = jsonRes.script;
      } else {
        const fallbackRes = loadScriptFromInput(rawTextOrJsonOrObj, wpm);
        if (fallbackRes.success) {
          updatedScript = {
            ...fallbackRes.script,
            title: title || fallbackRes.script.title
          };
        } else {
          return { success: false, error: jsonRes.error || fallbackRes.error };
        }
      }
    } else {
      return { success: false, error: 'Invalid script format' };
    }

    if (title && title.trim()) {
      updatedScript.title = title.trim();
    }

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
      if (typeof rawTextOrJsonOrObj === 'string') {
        mmkvStorage?.set('lastScript', rawTextOrJsonOrObj);
      }
    } catch (e) {
      // ignore
    }

    return { success: true, script: updatedScript };
  },

  loadPresetScript: (presetId) => {
    const { scripts, wpm } = get();
    const script = (scripts || []).find(s => s.id === presetId) || (scripts && scripts[0]) || null;
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
