import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import CameraStudio from './components/CameraStudio';
import AudioMeter from './components/AudioMeter';
import BeatNavigator from './components/BeatNavigator';
import ScriptEditor from './components/ScriptEditor';
import ExportModal from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { SAMPLE_SCRIPTS } from './utils/sampleScripts';
import { parseScript, formatTime } from './utils/scriptParser';
import { AudioQualityAnalyzer } from './utils/audioAnalyzer';
import { playCountdownBeep, playStartRecordingChime, playStopRecordingChime } from './utils/audioCues';
import './App.css';

export default function App() {
  // App Modes: 'beat' (Beat-by-Beat with retakes & stitch) or 'continuous' (Smooth prompter)
  const [mode, setMode] = useState('beat');
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9' | '1:1'

  // Script State
  const [rawScript, setRawScript] = useState(SAMPLE_SCRIPTS[0].rawText);
  const [baseWpm, setBaseWpm] = useState(SAMPLE_SCRIPTS[0].defaultWpm || 145);
  const [parsedScript, setParsedScript] = useState(() => parseScript(SAMPLE_SCRIPTS[0].rawText, 145));
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);

  // Hardware Media Stream
  const [mediaStream, setMediaStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [isMirrored, setIsMirrored] = useState(true);

  // Audio Analysis
  const [audioMetrics, setAudioMetrics] = useState({
    volumePercent: 0,
    status: 'silent',
    label: 'Listening...',
    frequencies: []
  });
  const audioAnalyzerRef = useRef(null);

  // Studio Teleprompter & Recording Preferences
  const [fontSize, setFontSize] = useState(24);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [soundCuesEnabled, setSoundCuesEnabled] = useState(true);
  const [continuousWpm, setContinuousWpm] = useState(140);
  const [continuousScrollOffset, setContinuousScrollOffset] = useState(0);

  // Recording State & Engine
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStage, setRecordingStage] = useState('idle'); // 'idle' | 'countdown' | 'recording' | 'paused' | 'finished'
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedTakes, setRecordedTakes] = useState({}); // beat.id -> Blob
  const [continuousBlob, setContinuousBlob] = useState(null);

  // Modals
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Refs for timers and recorder
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Update parsed script whenever raw text or base WPM changes
  useEffect(() => {
    const res = parseScript(rawScript, baseWpm);
    setParsedScript(res);
    setCurrentBeatIndex(prev => Math.min(prev, Math.max(0, res.beats.length - 1)));
  }, [rawScript, baseWpm]);

  // Request & Initialize Media Stream
  const initMedia = useCallback(async ({ videoId, audioId } = {}) => {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.stop();
      }

      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
          deviceId: videoId ? { exact: videoId } : undefined
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: audioId ? { exact: audioId } : undefined
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      setIsCameraActive(true);

      // Start Audio Quality Analyzer
      const analyzer = new AudioQualityAnalyzer(stream, (metrics) => {
        setAudioMetrics(metrics);
      });
      analyzer.start();
      audioAnalyzerRef.current = analyzer;
    } catch (err) {
      console.warn('Camera/mic access error:', err);
      setIsCameraActive(false);
    }
  }, [mediaStream]);

  // Initialize on mount
  useEffect(() => {
    initMedia();
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      if (audioAnalyzerRef.current) audioAnalyzerRef.current.stop();
    };
  }, []);

  const currentBeat = parsedScript.beats[currentBeatIndex] || null;

  // Clean Stop MediaRecorder helper
  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // START RECORDING A BEAT (with 3-2-1 countdown & pacing timer)
  const startRecordingBeat = useCallback(() => {
    if (!mediaStream || isRecording || !currentBeat) return;

    setRecordingStage('countdown');
    setIsRecording(true);
    setCountdownNumber(countdownSeconds);
    let count = countdownSeconds;

    if (soundCuesEnabled) playCountdownBeep(520);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        if (soundCuesEnabled) playCountdownBeep(520);
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;

        // Transition to active recording
        setRecordingStage('recording');
        if (soundCuesEnabled) playStartRecordingChime();

        // Start MediaRecorder
        try {
          recordedChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm';

          const recorder = new MediaRecorder(mediaStream, {
            mimeType,
            videoBitsPerSecond: 6000000
          });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setRecordedTakes(prev => ({
              ...prev,
              [currentBeat.id]: blob
            }));
            setIsRecording(false);
            setRecordingStage('finished');
            if (soundCuesEnabled) playStopRecordingChime();
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;

          // Track Elapsed Seconds and auto-cue pauses
          const startTime = Date.now();
          setElapsedSeconds(0);

          recordingTimerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setElapsedSeconds(elapsed);

            // Check if reached speaking target
            if (elapsed >= currentBeat.speakingDurationSec && recordingStage !== 'paused') {
              if (currentBeat.pauseAfterSec > 0.5) {
                setRecordingStage('paused');
              }
            }

            // If elapsed exceeds total beat duration + 1s grace, auto wrap
            if (elapsed >= currentBeat.totalDurationSec + 1.2) {
              stopRecordingBeat();
            }
          }, 100);

        } catch (recErr) {
          console.error('MediaRecorder error:', recErr);
          setIsRecording(false);
          setRecordingStage('idle');
        }
      }
    }, 1000);
  }, [mediaStream, isRecording, currentBeat, countdownSeconds, soundCuesEnabled, recordingStage]);

  // STOP RECORDING A BEAT
  const stopRecordingBeat = useCallback(() => {
    stopMediaRecorder();
  }, [stopMediaRecorder]);

  // RETAKE BEAT
  const retakeBeat = useCallback(() => {
    if (isRecording || !currentBeat) return;
    setRecordedTakes(prev => {
      const copy = { ...prev };
      delete copy[currentBeat.id];
      return copy;
    });
    setRecordingStage('idle');
    setElapsedSeconds(0);
    startRecordingBeat();
  }, [isRecording, currentBeat, startRecordingBeat]);

  // CONTINUOUS MODE RECORDING
  const startContinuous = useCallback(() => {
    if (!mediaStream || isRecording) return;
    setRecordingStage('countdown');
    setIsRecording(true);
    setCountdownNumber(countdownSeconds);
    let count = countdownSeconds;

    if (soundCuesEnabled) playCountdownBeep(520);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
        if (soundCuesEnabled) playCountdownBeep(520);
      } else {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;

        setRecordingStage('recording');
        if (soundCuesEnabled) playStartRecordingChime();

        try {
          recordedChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm';

          const recorder = new MediaRecorder(mediaStream, {
            mimeType,
            videoBitsPerSecond: 6000000
          });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setContinuousBlob(blob);
            setIsRecording(false);
            setRecordingStage('finished');
            if (soundCuesEnabled) playStopRecordingChime();
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;

          const startTime = Date.now();
          recordingTimerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setElapsedSeconds(elapsed);
            // Auto scroll based on WPM
            const pixelsPerSecond = (continuousWpm / 60) * 18;
            setContinuousScrollOffset(elapsed * pixelsPerSecond);
          }, 100);

        } catch (e) {
          console.error('Continuous recorder error:', e);
          setIsRecording(false);
        }
      }
    }, 1000);
  }, [mediaStream, isRecording, countdownSeconds, soundCuesEnabled, continuousWpm]);

  const stopContinuous = useCallback(() => {
    stopMediaRecorder();
  }, [stopMediaRecorder]);

  // Keyboard Shortcuts: Space to record/stop, Arrows for beat navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a modal or input
      if (isScriptModalOpen || isExportModalOpen || isSettingsModalOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (mode === 'beat') {
          if (!isRecording) startRecordingBeat();
          else stopRecordingBeat();
        } else {
          if (!isRecording) startContinuous();
          else stopContinuous();
        }
      } else if (e.code === 'ArrowRight' && !isRecording && mode === 'beat') {
        e.preventDefault();
        setCurrentBeatIndex(prev => Math.min(parsedScript.beats.length - 1, prev + 1));
        setRecordingStage('idle');
        setElapsedSeconds(0);
      } else if (e.code === 'ArrowLeft' && !isRecording && mode === 'beat') {
        e.preventDefault();
        setCurrentBeatIndex(prev => Math.max(0, prev - 1));
        setRecordingStage('idle');
        setElapsedSeconds(0);
      } else if (e.code === 'KeyR' && !isRecording && mode === 'beat' && currentBeat && recordedTakes[currentBeat.id]) {
        e.preventDefault();
        retakeBeat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isScriptModalOpen, 
    isExportModalOpen, 
    isSettingsModalOpen, 
    isRecording, 
    mode, 
    startRecordingBeat, 
    stopRecordingBeat, 
    startContinuous, 
    stopContinuous,
    retakeBeat,
    currentBeat,
    recordedTakes,
    parsedScript.beats.length
  ]);

  const recordedCount = Object.keys(recordedTakes).length;

  return (
    <div className="studio-app-root">
      
      {/* Top Studio Navbar */}
      <Navbar
        mode={mode}
        setMode={(newMode) => {
          setMode(newMode);
          setRecordingStage('idle');
          setElapsedSeconds(0);
        }}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        recordedCount={recordedCount}
        totalBeats={parsedScript.beats.length}
        isRecording={isRecording}
        recordingTimeFormatted={formatTime(Math.floor(elapsedSeconds))}
      />

      {/* Main Studio Work Area */}
      <main className="studio-main-grid">
        
        {/* Left Column: Script Beats Sequencer */}
        <aside className="studio-left-col">
          <BeatNavigator
            beats={parsedScript.beats}
            currentBeatIndex={currentBeatIndex}
            onSelectBeat={(index) => {
              setCurrentBeatIndex(index);
              setRecordingStage('idle');
              setElapsedSeconds(0);
            }}
            recordedTakes={recordedTakes}
            isRecording={isRecording}
          />
        </aside>

        {/* Center: Facecam Studio Frame with Eye-line Prompter */}
        <section className="studio-center-col">
          <CameraStudio
            videoStream={mediaStream}
            isCameraActive={isCameraActive}
            onRequestPermissions={initMedia}
            aspectRatio={aspectRatio}
            isMirrored={isMirrored}
            setIsMirrored={setIsMirrored}
            currentBeat={mode === 'beat' ? currentBeat : {
              allScriptText: parsedScript.beats.map(b => b.spokenText).join('\n\n')
            }}
            currentBeatIndex={currentBeatIndex}
            totalBeats={parsedScript.beats.length}
            onPreviousBeat={() => {
              setCurrentBeatIndex(prev => Math.max(0, prev - 1));
              setRecordingStage('idle');
              setElapsedSeconds(0);
            }}
            onNextBeat={() => {
              setCurrentBeatIndex(prev => Math.min(parsedScript.beats.length - 1, prev + 1));
              setRecordingStage('idle');
              setElapsedSeconds(0);
            }}
            isRecording={isRecording}
            recordingStage={recordingStage}
            countdownNumber={countdownNumber}
            elapsedSeconds={elapsedSeconds}
            onStartRecordBeat={startRecordingBeat}
            onStopRecordBeat={stopRecordingBeat}
            onRetakeBeat={retakeBeat}
            hasExistingTake={currentBeat ? !!recordedTakes[currentBeat.id] : false}
            targetWpm={currentBeat ? currentBeat.targetWpm : baseWpm}
            fontSize={fontSize}
            setFontSize={setFontSize}
            mode={mode}
            onStartContinuous={startContinuous}
            onStopContinuous={stopContinuous}
            continuousWpm={continuousWpm}
            setContinuousWpm={setContinuousWpm}
            continuousScrollOffset={continuousScrollOffset}
          />
        </section>

        {/* Right Column: Real-time Audio Quality & Voice Coaching Feedback */}
        <aside className="studio-right-col">
          <AudioMeter
            audioMetrics={audioMetrics}
            isMicActive={isCameraActive}
          />

          {/* Quick Keyboard Shortcuts Cheatsheet */}
          <div className="shortcuts-panel glass-panel">
            <h4 className="shortcuts-title">Studio Shortcuts</h4>
            <div className="shortcut-row">
              <kbd>Space</kbd>
              <span>Record / Stop</span>
            </div>
            <div className="shortcut-row">
              <kbd>→</kbd>
              <span>Next Beat</span>
            </div>
            <div className="shortcut-row">
              <kbd>←</kbd>
              <span>Previous Beat</span>
            </div>
            <div className="shortcut-row">
              <kbd>R</kbd>
              <span>Retake Beat</span>
            </div>
          </div>
        </aside>

      </main>

      {/* Modals */}
      <ScriptEditor
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        currentRawScript={rawScript}
        onApplyScript={(newScript) => {
          setRawScript(newScript);
          setRecordedTakes({});
          setCurrentBeatIndex(0);
          setRecordingStage('idle');
          setElapsedSeconds(0);
        }}
        baseWpm={baseWpm}
        setBaseWpm={setBaseWpm}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        mode={mode}
        beats={parsedScript.beats}
        recordedTakes={recordedTakes}
        continuousBlob={continuousBlob}
        onClearRecordings={() => {
          setRecordedTakes({});
          setContinuousBlob(null);
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isMirrored={isMirrored}
        setIsMirrored={setIsMirrored}
        countdownSeconds={countdownSeconds}
        setCountdownSeconds={setCountdownSeconds}
        soundCuesEnabled={soundCuesEnabled}
        setSoundCuesEnabled={setSoundCuesEnabled}
        defaultWpm={baseWpm}
        setDefaultWpm={setBaseWpm}
        selectedAudioDeviceId={selectedAudioDeviceId}
        setSelectedAudioDeviceId={setSelectedAudioDeviceId}
        selectedVideoDeviceId={selectedVideoDeviceId}
        setSelectedVideoDeviceId={setSelectedVideoDeviceId}
        onReinitMedia={initMedia}
      />

    </div>
  );
}
