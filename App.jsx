import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity 
} from 'react-native';
import { 
  Camera, 
  useCameraDevice 
} from 'react-native-vision-camera';
import { Prompter } from './src/components/Prompter';
import { VUMeter } from './src/components/VUMeter';
import { ControlsBar } from './src/components/ControlsBar';
import { ScriptModal } from './src/components/ScriptModal';
import { ExportModal } from './src/components/ExportModal';
import { useStudioStore } from './src/store/useStudioStore';

export default function App() {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Front camera device for selfie teleprompter recording
  const device = useCameraDevice('front');

  // Zustand Studio Store
  const {
    currentScript,
    beats,
    currentBeatIndex,
    wpm,
    recordingTakes,
    isRecording,
    recordingStage,
    countdownNumber,
    elapsedSeconds,
    setScript,
    setWpm,
    setCurrentBeatIndex,
    nextBeat,
    previousBeat,
    setIsRecording,
    setRecordingStage,
    setCountdownNumber,
    setElapsedSeconds,
    addTake,
    retakeCurrentBeat,
    clearTakes
  } = useStudioStore();

  const currentBeat = beats[currentBeatIndex] || null;
  const recordedCount = recordingTakes.filter(Boolean).length;

  // Request native camera & mic permissions
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermission();
      const microphoneStatus = await Camera.requestMicrophonePermission();
      setHasPermission(cameraStatus === 'granted' && microphoneStatus === 'granted');
    })();
  }, []);

  // Timer refs
  const countdownTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Stop Recording
  const stopRecording = useCallback(async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
      } catch (e) {
        console.warn('Error stopping recording:', e);
      }
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setIsRecording(false);
    setRecordingStage('finished');
  }, [isRecording, setIsRecording, setRecordingStage]);

  // Start Recording Beat with 3-2-1 Countdown
  const startRecording = useCallback(() => {
    if (!currentBeat || isRecording) return;

    setRecordingStage('countdown');
    setIsRecording(true);
    setCountdownNumber(3);
    let count = 3;

    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;

        // Transition to active recording
        setRecordingStage('recording');

        // Start hardware camera recording
        if (cameraRef.current) {
          try {
            cameraRef.current.startRecording({
              onRecordingFinished: (video) => {
                addTake(video.path);
              },
              onRecordingError: (error) => {
                console.error('VisionCamera recording error:', error);
                setIsRecording(false);
                setRecordingStage('idle');
              }
            });
          } catch (err) {
            console.error('Failed to start camera recording:', err);
          }
        }

        // Pacing & duration tracker
        const startTime = Date.now();
        setElapsedSeconds(0);

        recordingTimerRef.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          setElapsedSeconds(elapsed);

          // Transition to pause cue if specified in beat
          if (elapsed >= currentBeat.speakingDurationSec && recordingStage !== 'paused') {
            if (currentBeat.pauseAfterSec > 0.5) {
              setRecordingStage('paused');
            }
          }

          // Auto-stop when beat duration is reached (+ 1s buffer)
          if (elapsed >= currentBeat.totalDurationSec + 1.2) {
            stopRecording();
          }
        }, 100);
      }
    }, 1000);
  }, [currentBeat, isRecording, setRecordingStage, setIsRecording, setCountdownNumber, addTake, setElapsedSeconds, recordingStage, stopRecording]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* =========================================================
          LAYER 0 (Background): Raw Sensor Data Only (<Camera>)
          Because VisionCamera only captures what the hardware sees,
          the prompter UI and buttons are NEVER burned into the MP4!
      ========================================================= */}
      {hasPermission && device ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.cameraFallback]}>
          <Text style={styles.fallbackTitle}>Camera Preview</Text>
          <Text style={styles.fallbackSubtitle}>
            {hasPermission 
              ? 'Front camera initializing...' 
              : 'Grant camera & microphone permissions to start facecam recording.'}
          </Text>
        </View>
      )}

      {/* =========================================================
          LAYER 1 (Foreground / UI): Absolute overlay containing
          Teleprompter, VU Meter, and Controls
      ========================================================= */}
      <SafeAreaView style={styles.uiOverlayLayer} pointerEvents="box-none">
        
        {/* Top Header: VU Meter on top right */}
        <View style={styles.topHeaderRow} pointerEvents="box-none">
          <View style={styles.appTitleBadge}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.appTitleText}>ScriptCast Studio</Text>
          </View>

          {/* Audio VU Meter */}
          <VUMeter isRecording={isRecording && recordingStage === 'recording'} />
        </View>

        {/* Center: Live Eye-Line Prompter */}
        <View style={styles.prompterWrapper} pointerEvents="box-none">
          <Prompter
            beat={currentBeat}
            isRecording={isRecording}
            recordingStage={recordingStage}
            countdownNumber={countdownNumber}
            elapsedSeconds={elapsedSeconds}
          />
        </View>

        {/* Bottom: Studio Recording & Navigation Controls */}
        <View style={styles.bottomControlsWrapper} pointerEvents="box-none">
          <ControlsBar
            currentBeatIndex={currentBeatIndex}
            totalBeats={beats.length}
            isRecording={isRecording}
            hasTake={currentBeat ? !!recordingTakes[currentBeatIndex] : false}
            recordedCount={recordedCount}
            onPrevious={previousBeat}
            onNext={nextBeat}
            onStartRecord={startRecording}
            onStopRecord={stopRecording}
            onRetake={retakeCurrentBeat}
            onOpenScript={() => setIsScriptModalOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        </View>

      </SafeAreaView>

      {/* Modals */}
      <ScriptModal
        visible={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        currentRawText={currentScript.rawText}
        onApplyScript={(text) => setScript(text)}
        currentWpm={wpm}
        onChangeWpm={setWpm}
      />

      <ExportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        beats={beats}
        recordingTakes={recordingTakes}
        onClearSession={clearTakes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B10'
  },
  cameraFallback: {
    backgroundColor: '#0F121C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  fallbackSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center'
  },
  uiOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12
  },
  appTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(9, 11, 16, 0.78)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444'
  },
  appTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  prompterWrapper: {
    width: '100%',
    alignItems: 'center'
  },
  bottomControlsWrapper: {
    width: '100%'
  }
});
