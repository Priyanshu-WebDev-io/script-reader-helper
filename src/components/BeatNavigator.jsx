import React from 'react';
import { CheckCircle2, Circle, Play, RotateCcw, Video } from 'lucide-react';

export default function BeatNavigator({
  beats,
  currentBeatIndex,
  onSelectBeat,
  recordedTakes,
  isRecording
}) {
  const recordedCount = Object.keys(recordedTakes).length;
  const progressPercent = beats.length > 0 ? (recordedCount / beats.length) * 100 : 0;

  return (
    <div className="beat-navigator-panel glass-panel">
      <div className="beat-nav-header">
        <div className="beat-nav-title">
          <Video size={16} className="text-cyan" />
          <span>Script Beats Sequence</span>
        </div>
        <div className="beat-nav-progress-text">
          <span>{recordedCount} of {beats.length} recorded</span>
          <span className="percent-badge">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="beat-progress-track">
        <div 
          className="beat-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Beats List */}
      <div className="beats-scroll-list">
        {beats.map((beat, index) => {
          const isCurrent = index === currentBeatIndex;
          const isDone = !!recordedTakes[beat.id];

          return (
            <button
              key={beat.id}
              className={`beat-item-btn ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}
              onClick={() => !isRecording && onSelectBeat(index)}
              disabled={isRecording}
            >
              <div className="beat-item-status">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald" />
                ) : isCurrent ? (
                  <div className="current-beat-indicator" />
                ) : (
                  <Circle size={14} className="text-muted" />
                )}
              </div>

              <div className="beat-item-info">
                <div className="beat-item-top">
                  <span className="beat-index">#{index + 1}</span>
                  <span 
                    className="beat-tag" 
                    style={{ 
                      color: beat.tone?.color || '#3b82f6',
                      backgroundColor: beat.tone?.bg || 'rgba(59, 130, 246, 0.1)'
                    }}
                  >
                    {beat.section}
                  </span>
                  <span className="beat-duration">{beat.speakingDurationSec}s</span>
                </div>
                <p className="beat-text-snippet">
                  {beat.spokenText.length > 55 
                    ? beat.spokenText.substring(0, 52) + '...' 
                    : beat.spokenText}
                </p>
              </div>

              {isDone && (
                <div className="beat-done-badge" title="Recorded take saved">
                  <span>Take ready</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
