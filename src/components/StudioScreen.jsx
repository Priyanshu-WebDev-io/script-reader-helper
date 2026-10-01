import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  StatusBar, 
  TouchableOpacity 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Camera, 
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  useVideoOutput
} from 'react-native-vision-camera';
import { ArrowLeft } from 'lucide-react-native';
import { Prompter } from './Prompter';
import { VUMeter } from './VUMeter';
import { ControlsBar } from './ControlsBar';
import { ScriptModal } from './ScriptModal';
import { ExportModal } from './ExportModal';
import { useStudioStore } from '../store/useStudioStore';

export function StudioScreen({ onExit }) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const activeRecorderRef = useRef(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // VisionCamera 5 Permissions
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const hasPermission = hasCameraPermission && hasMicrophonePermission;

  // Front camera device for selfie teleprompter recording
  const device = useCameraDevice('front');

  // VisionCamera 5 Video Output with Audio enabled
  const videoOutput = useVideoOutput({
    enableAudio: true
  });

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
      if (!hasCameraPermission) {
        await requestCameraPermission();
      }
      if (!hasMicrophonePermission) {
        await requestMicrophonePermission();
      }
    })();
  }, [hasCameraPermission, hasMicrophonePermission, requestCameraPermission, requestMicrophonePermission]);

  // Timer refs
  const countdownTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Stop Recording
  const stopRecording = useCallback(async () => {
    if (activeRecorderRef.current && isRecording) {
      try {
        await activeRecorderRef.current.stopRecording();
      } catch (e) {
        console.warn('Error stopping recording:', e);
      }
      activeRecorderRef.current = null;
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

        // Start hardware camera recording via VisionCamera 5 Recorder
        (async () => {
          try {
            if (videoOutput) {
              const recorder = await videoOutput.createRecorder();
              activeRecorderRef.current = recorder;
              await recorder.startRecording(
                (filePath, reason) => {
                  addTake(filePath);
                },
                (error) => {
                  console.error('VisionCamera recording error:', error);
                  setIsRecording(false);
                  setRecordingStage('idle');
                }
              );
            }
          } catch (err) {
            console.error('Failed to start camera recording:', err);
          }
        })();

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
        }, 100);
      }
    }, 1000);
  }, [currentBeat, isRecording, videoOutput, setRecordingStage, setIsRecording, setCountdownNumber, addTake, setElapsedSeconds, recordingStage]);

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
          outputs={[videoOutput]}
        />
      ) : (
        <View className="absolute inset-0 bg-resolve-bg items-center justify-center p-8">
          <View className="w-10 h-10 bg-resolve-panel border border-resolve-border rounded-xs items-center justify-center mb-3">
            <View className="w-3 h-3 bg-resolve-accent" />
          </View>
          <Text className="text-resolve-text text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            RESOLVE MONITOR // SOURCE FEED
          </Text>
          <Text className="text-resolve-muted text-[11px] text-center max-w-[260px] font-mono leading-4">
            {hasPermission 
              ? 'Initializing front sensor feed...' 
              : 'Grant camera & microphone permissions to arm studio capture.'}
          </Text>
        </View>
      )}

      {/* =========================================================
          LAYER 1 (Foreground / UI): Absolute overlay containing
          Teleprompter, VU Meter, and Controls
      ========================================================= */}
      <View 
        className="absolute inset-0 justify-between z-10"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }}
        pointerEvents="box-none"
      >
        {/* Top Header: Back Button + Title + VU Meter */}
        <View className="flex-row justify-between items-center px-3 pt-2 z-20" pointerEvents="box-none">
          <View className="flex-row items-center gap-2 max-w-[65%]">
            <TouchableOpacity 
              className="w-8 h-8 bg-resolve-panel/90 border border-resolve-border rounded-xs items-center justify-center active:bg-resolve-border"
              onPress={() => {
                if (isRecording) {
                  stopRecording();
                }
                onExit();
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color="#DEDEDE" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2 bg-resolve-header/90 border border-resolve-border px-2.5 py-1 rounded-xs">
              <View className={`w-2 h-2 rounded-none ${isRecording ? 'bg-resolve-crimson' : 'bg-resolve-accent'}`} />
              <Text className="text-resolve-text text-[11px] font-bold uppercase tracking-wider font-mono" numberOfLines={1}>
                {currentScript?.title || 'TIMELINE MONITOR'}
              </Text>
            </View>
          </View>

          {/* Audio VU Meter */}
          <VUMeter isRecording={isRecording && recordingStage === 'recording'} />
        </View>

        {/* Center: Live Eye-Line Prompter */}
        <View className="flex-1 justify-center items-center px-4" pointerEvents="box-none">
          <Prompter
            beat={currentBeat}
            isRecording={isRecording}
            recordingStage={recordingStage}
            countdownNumber={countdownNumber}
            elapsedSeconds={elapsedSeconds}
          />
        </View>

        {/* Bottom: Studio Recording & Navigation Controls */}
        <View className="w-full px-3 pb-2" pointerEvents="box-none">
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
      </View>

      {/* Modals */}
      <ScriptModal
        visible={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        currentScript={currentScript}
        wpm={wpm}
        onSaveScript={(rawText, title) => setScript(rawText, title)}
        onWpmChange={(newWpm) => setWpm(newWpm)}
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
    backgroundColor: '#181818'
  }
});
