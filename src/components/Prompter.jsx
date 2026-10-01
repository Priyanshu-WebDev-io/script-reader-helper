import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  cancelAnimation 
} from 'react-native-reanimated';
import { Eye, Volume2 } from 'lucide-react-native';

export function Prompter({
  beat,
  isRecording,
  recordingStage,
  countdownNumber,
  elapsedSeconds
}) {
  if (!beat) {
    return (
      <View className="w-full px-4 items-center gap-2">
        <Text className="text-resolve-muted text-xs font-mono">NO SCRIPT ARMED</Text>
      </View>
    );
  }

  const {
    spokenText,
    stageCues,
    tone,
    speakingDurationSec,
    pauseAfterSec,
    emphasisWords = [],
    targetWpm
  } = beat;

  const translateY = useSharedValue(0);

  useEffect(() => {
    if (recordingStage === 'recording') {
      translateY.value = 0;
      translateY.value = withTiming(-60, {
        duration: speakingDurationSec * 1000,
        easing: Easing.linear
      });
    } else {
      cancelAnimation(translateY);
      translateY.value = 0;
    }
  }, [recordingStage, speakingDurationSec]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const words = (spokenText || '').split(/\s+/);
  const progressRatio = speakingDurationSec > 0 
    ? Math.min(1, elapsedSeconds / speakingDurationSec) 
    : 0;
  const activeWordIndex = Math.min(
    words.length - 1, 
    Math.floor(progressRatio * words.length)
  );

  return (
    <View className="w-full px-4 items-center gap-2">
      {/* Top Lens Guide (NLE Crosshair / Safe Zone) */}
      <View className="flex-row items-center gap-1.5 bg-resolve-header border border-resolve-border px-2.5 py-1 rounded-xs">
        <Eye size={11} color="#F26D21" />
        <Text className="text-resolve-muted font-mono text-[10px] tracking-wider uppercase">
          OPTICAL TARGET // FRONT LENS
        </Text>
      </View>

      {/* Recording Stage Monitor Banner */}
      <View className="h-8 justify-center items-center w-full">
        {recordingStage === 'countdown' && (
          <View className="flex-row items-center gap-2 bg-resolve-accent px-3 py-1 rounded-xs">
            <Text className="text-black font-mono text-sm font-black">{countdownNumber}</Text>
            <Text className="text-black font-mono text-[11px] font-bold uppercase tracking-wider">COUNTDOWN</Text>
          </View>
        )}

        {recordingStage === 'recording' && (
          <View className="flex-row items-center gap-2 bg-resolve-crimson border border-resolve-crimsonDark px-3 py-1 rounded-xs">
            <View className="w-2 h-2 bg-white rounded-none" />
            <Text className="text-white font-mono text-[11px] font-bold uppercase tracking-wider">ON AIR</Text>
            <Text className="text-white/90 font-mono text-[10px] ml-1">
              {elapsedSeconds.toFixed(1)}s / {speakingDurationSec}s
            </Text>
          </View>
        )}

        {recordingStage === 'paused' && (
          <View className="bg-resolve-panel border border-resolve-accent px-3 py-1 rounded-xs">
            <Text className="text-resolve-accent font-mono text-[10px] font-bold uppercase tracking-wider">
              HOLD CUT ({pauseAfterSec}s)
            </Text>
          </View>
        )}

        {recordingStage === 'finished' && (
          <View className="bg-resolve-panel border border-resolve-border px-3 py-1 rounded-xs">
            <Text className="text-resolve-text font-mono text-[10px] font-bold uppercase tracking-wider">
              TAKE CAPTURED
            </Text>
          </View>
        )}

        {recordingStage === 'idle' && (
          <View className="bg-resolve-recessed border border-resolve-border px-3 py-1 rounded-xs">
            <Text className="text-resolve-muted font-mono text-[10px] tracking-wider uppercase">
              STANDBY • ARMED AT {targetWpm || 150} WPM
            </Text>
          </View>
        )}
      </View>

      {/* Stage Cue Tip (Director Prompt) */}
      {stageCues ? (
        <View className="bg-resolve-recessed border-l-2 border-resolve-accent px-2.5 py-1 rounded-xs max-w-[90%]">
          <Text className="text-resolve-text font-mono text-[11px] font-semibold tracking-wide uppercase">
            [ CUE: {stageCues.toUpperCase()} ]
          </Text>
        </View>
      ) : null}

      {/* Teleprompter Monitor Card */}
      <View className="w-full bg-resolve-panel/95 border border-resolve-border rounded-xs px-5 py-4 max-h-56 overflow-hidden justify-center items-center">
        <Animated.View className="w-full" style={animatedStyle}>
          <Text className="text-center leading-7">
            {words.map((word, idx) => {
              const isPassed = recordingStage === 'recording' && idx < activeWordIndex;
              const isActive = recordingStage === 'recording' && idx === activeWordIndex;
              const isEmphasis = (emphasisWords || []).some(ew => 
                word.toLowerCase().replace(/[^a-z0-9]/g, '') === ew.toLowerCase().replace(/[^a-z0-9]/g, '')
              );

              return (
                <Text
                  key={idx}
                  className={`text-lg font-medium tracking-tight ${
                    isActive 
                      ? 'text-black bg-resolve-accent font-bold px-1 rounded-xs' 
                      : isPassed 
                        ? 'text-resolve-dim' 
                        : isEmphasis 
                          ? 'text-resolve-text underline font-bold' 
                          : 'text-resolve-text'
                  }`}
                >
                  {word}{' '}
                </Text>
              );
            })}
          </Text>
        </Animated.View>

        {/* Pacing Progress Timecode Line */}
        {recordingStage === 'recording' && (
          <View className="w-full h-1 bg-resolve-recessed mt-3 rounded-none overflow-hidden">
            <View 
              className="h-full bg-resolve-accent" 
              style={{ width: `${Math.round(progressRatio * 100)}%` }} 
            />
          </View>
        )}
      </View>

      {/* Metadata Track Footer */}
      <View className="flex-row items-center gap-1.5 pt-0.5">
        <Volume2 size={11} color="#888888" />
        <Text className="text-resolve-muted font-mono text-[10px] tracking-wider uppercase">
          {targetWpm || 150} WPM • TONE: {tone?.label?.toUpperCase() || 'NATURAL'}
        </Text>
      </View>
    </View>
  );
}
