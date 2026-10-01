import React from 'react';
import { Mic, Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AudioMeter({ audioMetrics, isMicActive }) {
  const { volumePercent = 0, status = 'silent', label = 'Silence', frequencies = [] } = audioMetrics || {};

  // Color mapping based on status
  const getStatusColor = () => {
    switch (status) {
      case 'clipping':
        return '#ef4444';
      case 'loud':
        return '#f59e0b';
      case 'optimal':
        return '#10b981';
      case 'quiet':
        return '#38bdf8';
      default:
        return '#64748b';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="audio-meter-panel glass-panel">
      <div className="audio-meter-header">
        <div className="audio-meter-title">
          <Mic size={15} style={{ color: isMicActive ? '#10b981' : '#64748b' }} />
          <span>Voice Quality & Level</span>
        </div>
        <div className="audio-status-pill" style={{ color: statusColor, borderColor: `${statusColor}44` }}>
          {status === 'optimal' && <CheckCircle2 size={12} />}
          {status === 'clipping' && <AlertTriangle size={12} />}
          <span>{label}</span>
        </div>
      </div>

      {/* Segmented LED VU Meter Bar */}
      <div className="vu-meter-track">
        <div 
          className="vu-meter-fill" 
          style={{ 
            width: `${Math.min(100, volumePercent)}%`,
            background: volumePercent > 85 
              ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #ef4444 95%)'
              : volumePercent > 65 
                ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 90%)'
                : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
          }}
        />
        {/* Threshold Markers */}
        <div className="threshold-marker target-zone" title="Ideal Voice Zone (25% - 75%)" />
        <div className="threshold-marker clip-zone" title="Clipping Warning (>85%)" />
      </div>

      {/* Mini frequency bar visualizer */}
      <div className="frequency-visualizer">
        {frequencies && frequencies.length > 0 ? (
          frequencies.slice(0, 16).map((val, idx) => (
            <div
              key={idx}
              className="freq-bar"
              style={{
                height: `${Math.max(12, (val / 255) * 100)}%`,
                backgroundColor: volumePercent > 85 ? '#ef4444' : idx < 10 ? '#10b981' : '#f59e0b'
              }}
            />
          ))
        ) : (
          <div className="freq-bar-placeholder">
            <span>{isMicActive ? 'Listening for voice...' : 'Microphone inactive'}</span>
          </div>
        )}
      </div>

      <div className="meter-footer">
        <span className="meter-label">Noise Floor</span>
        <span className="meter-label-target">Target Vocal Range</span>
        <span className="meter-label-clip">Peak / Clip</span>
      </div>
    </div>
  );
}
