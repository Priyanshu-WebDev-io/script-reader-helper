import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Camera, 
  Mic, 
  Volume2, 
  Bell, 
  RotateCw, 
  Monitor, 
  Sliders, 
  Check, 
  X 
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  isMirrored,
  setIsMirrored,
  countdownSeconds,
  setCountdownSeconds,
  soundCuesEnabled,
  setSoundCuesEnabled,
  defaultWpm,
  setDefaultWpm,
  selectedAudioDeviceId,
  setSelectedAudioDeviceId,
  selectedVideoDeviceId,
  setSelectedVideoDeviceId,
  onReinitMedia
}) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate camera and mic devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const vList = devices.filter(d => d.kind === 'videoinput');
          const aList = devices.filter(d => d.kind === 'audioinput');
          setVideoDevices(vList);
          setAudioDevices(aList);
        })
        .catch(err => console.error('Device enum error:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glass-panel settings-modal">
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Settings size={20} className="text-cyan" />
            </div>
            <div>
              <h2>Studio & Hardware Settings</h2>
              <p>Configure camera, microphone, countdown, and pacing preferences.</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="settings-body-content">
          
          {/* Camera Selection */}
          <div className="settings-section">
            <div className="settings-row-label">
              <Camera size={16} className="text-cyan" />
              <div>
                <label>Video Camera</label>
                <p>Choose facecam device</p>
              </div>
            </div>
            <select
              className="settings-select"
              value={selectedVideoDeviceId}
              onChange={(e) => {
                setSelectedVideoDeviceId(e.target.value);
                onReinitMedia({ videoId: e.target.value });
              }}
            >
              <option value="">Default System Camera</option>
              {videoDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.substring(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className="settings-section">
            <div className="settings-row-label">
              <Mic size={16} className="text-emerald" />
              <div>
                <label>Microphone Input</label>
                <p>Choose crisp audio source</p>
              </div>
            </div>
            <select
              className="settings-select"
              value={selectedAudioDeviceId}
              onChange={(e) => {
                setSelectedAudioDeviceId(e.target.value);
                onReinitMedia({ audioId: e.target.value });
              }}
            >
              <option value="">Default System Microphone</option>
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.substring(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Mirror Camera View */}
          <div className="settings-section toggle-section">
            <div className="settings-row-label">
              <RotateCw size={16} className="text-muted" />
              <div>
                <label>Mirror Facecam View</label>
                <p>Flip horizontally for natural selfie view</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isMirrored}
                onChange={(e) => setIsMirrored(e.target.checked)}
              />
              <span className="slider-round" />
            </label>
          </div>

          {/* Sound Cues (Beep on 3-2-1 and Stop) */}
          <div className="settings-section toggle-section">
            <div className="settings-row-label">
              <Volume2 size={16} className="text-amber" />
              <div>
                <label>Audio Director Cues</label>
                <p>Play subtle synthesizer beeps on 3-2-1 countdown & wrap cues</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundCuesEnabled}
                onChange={(e) => setSoundCuesEnabled(e.target.checked)}
              />
              <span className="slider-round" />
            </label>
          </div>

          {/* Countdown Duration */}
          <div className="settings-section">
            <div className="settings-row-label">
              <Bell size={16} className="text-indigo" />
              <div>
                <label>Pre-Roll Countdown</label>
                <p>Seconds to get into character before recording starts</p>
              </div>
            </div>
            <div className="segmented-options">
              {[2, 3, 5].map(sec => (
                <button
                  key={sec}
                  className={`sec-btn ${countdownSeconds === sec ? 'active' : ''}`}
                  onClick={() => setCountdownSeconds(sec)}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-studio-primary" onClick={onClose}>
            <Check size={16} />
            <span>Done</span>
          </button>
        </div>

      </div>
    </div>
  );
}
