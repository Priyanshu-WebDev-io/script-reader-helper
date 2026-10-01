import React from 'react';
import { 
  Video, 
  Layers, 
  ScrollText, 
  Settings, 
  Download, 
  FileText, 
  ShieldCheck, 
  Smartphone,
  Tv,
  Square
} from 'lucide-react';

export default function Navbar({ 
  mode, 
  setMode, 
  aspectRatio, 
  setAspectRatio, 
  onOpenScriptModal, 
  onOpenSettings, 
  onOpenExport, 
  recordedCount, 
  totalBeats,
  isRecording,
  recordingTimeFormatted
}) {
  return (
    <header className="navbar-header glass-panel">
      <div className="navbar-container">
        
        {/* Brand / Logo */}
        <div className="navbar-brand">
          <div className="brand-icon-wrapper">
            <div className="brand-dot"></div>
            <Video className="brand-icon" size={20} />
          </div>
          <div>
            <h1 className="brand-title">
              ScriptCast <span className="brand-badge">PRO</span>
            </h1>
            <p className="brand-subtitle">Facecam Prompter & Vocal Coach</p>
          </div>
        </div>

        {/* Center: Mode & Aspect Ratio Controls */}
        <div className="navbar-center">
          {/* Mode Switcher */}
          <div className="segmented-control">
            <button
              className={`segmented-btn ${mode === 'beat' ? 'active' : ''}`}
              onClick={() => !isRecording && setMode('beat')}
              disabled={isRecording}
              title="Record sentence-by-sentence with instant retakes and auto-stitch"
            >
              <Layers size={15} />
              <span>Beat-by-Beat</span>
              <span className="badge-count">
                {recordedCount}/{totalBeats}
              </span>
            </button>
            <button
              className={`segmented-btn ${mode === 'continuous' ? 'active' : ''}`}
              onClick={() => !isRecording && setMode('continuous')}
              disabled={isRecording}
              title="Continuous live scrolling teleprompter"
            >
              <ScrollText size={15} />
              <span>Continuous</span>
            </button>
          </div>

          {/* Aspect Ratio Switcher */}
          <div className="aspect-control">
            <button
              className={`aspect-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
              onClick={() => setAspectRatio('9:16')}
              title="9:16 Vertical (Shorts, Reels, TikTok)"
            >
              <Smartphone size={14} />
              <span>9:16</span>
            </button>
            <button
              className={`aspect-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
              onClick={() => setAspectRatio('16:9')}
              title="16:9 Landscape (YouTube, Desktop)"
            >
              <Tv size={14} />
              <span>16:9</span>
            </button>
            <button
              className={`aspect-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
              onClick={() => setAspectRatio('1:1')}
              title="1:1 Square (Feed posts)"
            >
              <Square size={13} />
              <span>1:1</span>
            </button>
          </div>
        </div>

        {/* Right Side: Status, Actions, Export */}
        <div className="navbar-actions">
          {/* Recording Timer if Active */}
          {isRecording && (
            <div className="live-recording-indicator">
              <span className="rec-pulse-dot"></span>
              <span className="rec-text">REC {recordingTimeFormatted}</span>
            </div>
          )}

          {/* Offline privacy pill */}
          <div className="offline-pill" title="Runs 100% on your device. Zero cloud processing or data transfer.">
            <ShieldCheck size={14} className="text-emerald" />
            <span>100% Offline</span>
          </div>

          {/* Load/Change Script */}
          <button 
            className="btn-studio-secondary" 
            onClick={onOpenScriptModal}
            disabled={isRecording}
          >
            <FileText size={16} />
            <span>Script</span>
          </button>

          {/* Settings */}
          <button 
            className="btn-studio-icon" 
            onClick={onOpenSettings} 
            title="Studio Settings"
          >
            <Settings size={18} />
          </button>

          {/* Review & Export */}
          <button 
            className={`btn-studio-primary ${recordedCount > 0 ? 'has-recordings' : ''}`}
            onClick={onOpenExport}
            disabled={isRecording}
          >
            <Download size={16} />
            <span>Export Video</span>
            {recordedCount > 0 && (
              <span className="export-counter">{recordedCount}</span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
