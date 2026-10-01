import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing, 
  cancelAnimation 
} from 'react-native-reanimated';
import { Eye, Sparkles, Volume2 } from 'lucide-react-native';

export function Prompter({
  beat,
  isRecording,
  recordingStage,
  countdownNumber,
  elapsedSeconds
}) {
  if (!beat) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No script beat loaded.</Text>
      </View>
    );
  }

  const {
    spokenText,
    stageCues,
    tone,
    speakingDurationSec,
    pauseAfterSec,
    emphasisWords,
    targetWpm
  } = beat;

  // Reanimated translateY for smooth linear prompter scroll
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

  // Dynamic Word Highlighting
  const words = spokenText.split(/\s+/);
  const progressRatio = speakingDurationSec > 0 
    ? Math.min(1, elapsedSeconds / speakingDurationSec) 
    : 0;
  const activeWordIndex = Math.min(
    words.length - 1, 
    Math.floor(progressRatio * words.length)
  );

  return (
    <View style={styles.container}>
      {/* Top Lens Guide - Keep creator staring at the front camera lens */}
      <View style={styles.lensAnchor}>
        <Eye size={13} color="#38BDF8" />
        <Text style={styles.lensText}>LOOK DIRECTLY INTO THE FRONT LENS</Text>
      </View>

      {/* Dynamic Director Cue Banner: When to Speak / Pause / Stop */}
      <View style={styles.statusBannerRow}>
        {recordingStage === 'countdown' && (
          <View style={[styles.statusBadge, styles.badgeCountdown]}>
            <Text style={styles.countdownDigit}>{countdownNumber}</Text>
            <Text style={styles.badgeText}>Get ready to speak...</Text>
          </View>
        )}

        {recordingStage === 'recording' && (
          <View style={[styles.statusBadge, styles.badgeRecording]}>
            <View style={styles.redDot} />
            <Text style={styles.badgeTextBold}>SPEAK NOW</Text>
            <Text style={styles.badgeTimer}>{elapsedSeconds.toFixed(1)}s / {speakingDurationSec}s</Text>
          </View>
        )}

        {recordingStage === 'paused' && (
          <View style={[styles.statusBadge, styles.badgePause]}>
            <Text style={styles.badgeTextBold}>PAUSE & HOLD ({pauseAfterSec}s)</Text>
            <Text style={styles.badgeSub}>Hold eye contact</Text>
          </View>
        )}

        {recordingStage === 'finished' && (
          <View style={[styles.statusBadge, styles.badgeFinished]}>
            <Text style={styles.badgeTextFinished}>🛑 STOP - TAKE COMPLETE</Text>
          </View>
        )}

        {recordingStage === 'idle' && (
          <View style={[styles.statusBadge, styles.badgeIdle]}>
            <Text style={styles.badgeTextIdle}>Ready • Tap Record when prepared</Text>
          </View>
        )}
      </View>

      {/* Tone Badge & Pacing Metric */}
      <View style={[styles.toneBadge, { borderColor: tone?.color || '#3B82F6', backgroundColor: tone?.bg || 'rgba(59, 130, 246, 0.2)' }]}>
        <Text style={styles.toneEmoji}>{tone?.emoji || '🎙️'}</Text>
        <Text style={[styles.toneLabel, { color: tone?.color || '#3B82F6' }]}>{tone?.label || 'Natural Cadence'}</Text>
        <Text style={styles.toneDivider}>•</Text>
        <Text style={styles.tonePace}>{targetWpm} WPM</Text>
      </View>

      {/* Stage Cue Tip (e.g. look into lens, smile) */}
      {stageCues ? (
        <View style={styles.stageCueBadge}>
          <Sparkles size={12} color="#FBBF24" />
          <Text style={styles.stageCueText}>{stageCues}</Text>
        </View>
      ) : null}

      {/* Teleprompter Text Card with Reanimated translateY */}
      <View style={styles.prompterCard}>
        <Animated.View style={[styles.scrollContent, animatedStyle]}>
          <Text style={styles.prompterText}>
            {words.map((word, idx) => {
              const isPassed = recordingStage === 'recording' && idx < activeWordIndex;
              const isActive = recordingStage === 'recording' && idx === activeWordIndex;
              const isEmphasis = emphasisWords.some(ew => 
                word.toLowerCase().replace(/[^a-z0-9]/g, '') === ew.toLowerCase().replace(/[^a-z0-9]/g, '')
              );

              return (
                <Text
                  key={idx}
                  style={[
                    styles.wordNormal,
                    isPassed && styles.wordPassed,
                    isActive && styles.wordActive,
                    isEmphasis && styles.wordEmphasis
                  ]}
                >
                  {word}{' '}
                </Text>
              );
            })}
          </Text>
        </Animated.View>

        {/* Visual Pacing Progress Bar */}
        {recordingStage === 'recording' && (
          <View style={styles.pacingBarTrack}>
            <View style={[styles.pacingBarFill, { width: `${Math.round(progressRatio * 100)}%` }]} />
          </View>
        )}
      </View>

      {/* Vocal Coach Directive */}
      <View style={styles.coachFooter}>
        <Volume2 size={12} color="#38BDF8" />
        <Text style={styles.coachText}>{tone?.coachingTip || 'Speak clearly.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14
  },
  lensAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)'
  },
  lensText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  statusBannerRow: {
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  badgeCountdown: {
    backgroundColor: '#D97706'
  },
  countdownDigit: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900'
  },
  badgeRecording: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  redDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF'
  },
  badgePause: {
    backgroundColor: '#7C3AED'
  },
  badgeFinished: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  badgeIdle: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  badgeTextBold: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  badgeTimer: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  badgeSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12
  },
  badgeTextFinished: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700'
  },
  badgeTextIdle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500'
  },
  toneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1
  },
  toneEmoji: {
    fontSize: 12
  },
  toneLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  toneDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10
  },
  tonePace: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  stageCueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  stageCueText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600'
  },
  prompterCard: {
    width: '100%',
    backgroundColor: 'rgba(9, 11, 16, 0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    overflow: 'hidden',
    minHeight: 120,
    maxHeight: 220
  },
  scrollContent: {
    width: '100%'
  },
  prompterText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#FFFFFF',
    fontWeight: '600'
  },
  wordNormal: {
    color: 'rgba(255, 255, 255, 0.95)'
  },
  wordPassed: {
    color: '#64748B'
  },
  wordActive: {
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    fontWeight: '900'
  },
  wordEmphasis: {
    color: '#FBBF24',
    textDecorationLine: 'underline',
    fontWeight: '800'
  },
  pacingBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  pacingBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8'
  },
  coachFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  coachText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500'
  }
});
