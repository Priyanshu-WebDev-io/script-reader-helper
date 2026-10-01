import React, { useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Gauge, 
  Clock, 
  PauseCircle, 
  AlertCircle,
  Eye,
  Volume2
} from 'lucide-react';

export default function PrompterOverlay({
  currentBeat,
  isRecording,
  recordingStage, // 'countdown' | 'recording' | 'paused' | 'finished' | 'idle'
  countdownNumber,
  elapsedSeconds,
  targetWpm,
  fontSize,
  showDirectLensGuide
}) {
  const prompterBoxRef = useRef(null);

  if (!currentBeat) {
    return (
      <div className="prompter-overlay-empty glass-panel">
        <p>No script beat loaded. Paste or select a script to begin.</p>
      </div>
    );
  }

  const {
    spokenText = '',
    stageCues = '',
    tone = {},
    speakingDurationSec = 3,
    pauseAfterSec = 1,
    emphasisWords = [],
    section = 'BEAT'
  } = currentBeat;

  // Calculate pacing progress % during recording
  const progressRatio = speakingDurationSec > 0 
    ? Math.min(1, elapsedSeconds / speakingDurationSec) 
    : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // Split words for animated pacing highlight
  const words = spokenText.split(/\s+/);
  const activeWordIndex = Math.min(
    words.length - 1, 
    Math.floor(progressRatio * words.length)
  );

  return (
    <div className="prompter-overlay-container">

      {/* Top Lens Guide (Keeps creator looking right at the webcam!) */}
      {showDirectLensGuide && (
        <div className="lens-anchor-guide">
          <Eye size={14} className="text-cyan animate-pulse" />
          <span>Look directly into the camera lens above</span>
        </div>
      )}

      {/* Director Status Banner: Tells user WHEN TO SPEAK, WHEN TO STOP, WHEN TO PAUSE */}
      <div className="director-status-banner">
        {recordingStage === 'countdown' && (
          <div className="stage-pill stage-countdown countdown-anim">
            <span className="countdown-digit">{countdownNumber}</span>
            <span>Get ready to speak...</span>
          </div>
        )}

        {recordingStage === 'recording' && (
          <div className="stage-pill stage-speak pulse-red">
            <span className="live-dot" />
            <span className="stage-title">SPEAK NOW</span>
            <span className="stage-timer">{elapsedSeconds.toFixed(1)}s / {speakingDurationSec}s</span>
          </div>
        )}

        {recordingStage === 'paused' && (
          <div className="stage-pill stage-pause">
            <PauseCircle size={16} />
            <span className="stage-title">PAUSE & HOLD ({pauseAfterSec}s)</span>
            <span className="stage-desc">Don't speak • Hold eye contact</span>
          </div>
        )}

        {recordingStage === 'finished' && (
          <div className="stage-pill stage-stop">
            <span className="stage-title">🛑 STOP - TAKE COMPLETE</span>
          </div>
        )}

        {recordingStage === 'idle' && (
          <div className="stage-pill stage-idle">
            <span>Ready • Press Record when prepared</span>
          </div>
        )}
      </div>

      {/* Tone & Coach Directive Header */}
      <div 
        className="prompter-tone-badge" 
        style={{ 
          color: tone.color || '#3b82f6', 
          backgroundColor: tone.bg || 'rgba(59, 130, 246, 0.15)',
          borderColor: `${tone.color}55`
        }}
      >
        <span className="tone-emoji">{tone.emoji || '🎙️'}</span>
        <span className="tone-label">{tone.label || 'Natural Cadence'}</span>
        <span className="tone-divider">•</span>
        <span className="pace-metric">Target: {targetWpm} WPM</span>
      </div>

      {/* Stage Cue Tip (if present in script) */}
      {stageCues && (
        <div className="director-cue-tip">
          <Sparkles size={13} className="text-amber" />
          <span>{stageCues}</span>
        </div>
      )}

      {/* The Teleprompter Text Box with Dynamic Pacing Highlight */}
      <div 
        className="prompter-text-card glass-panel" 
        ref={prompterBoxRef}
        style={{ fontSize: `${fontSize}px` }}
      >
        <p className="prompter-text-content">
          {words.map((word, idx) => {
            const isWordPassed = recordingStage === 'recording' && idx <= activeWordIndex;
            const isWordActive = recordingStage === 'recording' && idx === activeWordIndex;
            const isEmphasis = emphasisWords.some(ew => 
              word.toLowerCase().replace(/[^a-z0-9]/g, '') === ew.toLowerCase().replace(/[^a-z0-9]/g, '')
            );

            return (
              <span
                key={idx}
                className={`prompter-word ${isWordActive ? 'word-active' : ''} ${isWordPassed ? 'word-passed' : ''} ${isEmphasis ? 'word-emphasis' : ''}`}
              >
                {word}{' '}
              </span>
            );
          })}
        </p>

        {/* Visual Pacing Progress Bar */}
        {recordingStage === 'recording' && (
          <div className="pacing-track">
            <div 
              className="pacing-runner" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Vocal Coach Actionable Tip */}
      <div className="voice-coach-footer glass-pill">
        <Volume2 size={13} className="text-cyan" />
        <span className="coach-text">{tone.coachingTip || 'Speak clearly with measured breathing.'}</span>
      </div>

    </div>
  );
}
