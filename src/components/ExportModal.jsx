import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Play, 
  Pause, 
  Trash2, 
  Film, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  X,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { stitchVideoBlobs, downloadBlob } from '../utils/videoStitcher';

export default function ExportModal({
  isOpen,
  onClose,
  mode,
  beats,
  recordedTakes,
  continuousBlob,
  onClearRecordings
}) {
  const [isStitching, setIsStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [finalVideoBlob, setFinalVideoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(null);
  const videoPlayerRef = useRef(null);

  // Initialize export state when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      setFinalVideoBlob(null);
      return;
    }

    if (mode === 'continuous' && continuousBlob) {
      setFinalVideoBlob(continuousBlob);
      const url = URL.createObjectURL(continuousBlob);
      setPreviewUrl(url);
    } else if (mode === 'beat') {
      const takeKeys = Object.keys(recordedTakes);
      if (takeKeys.length > 0) {
        // Automatically stitch or prepare first take
        handleStitchAll();
      }
    }
  }, [isOpen, mode, continuousBlob]);

  const handleStitchAll = async () => {
    const blobs = [];
    beats.forEach(beat => {
      if (recordedTakes[beat.id]) {
        blobs.push(recordedTakes[beat.id]);
      }
    });

    if (blobs.length === 0) return;

    setIsStitching(true);
    setStitchProgress(10);

    try {
      const stitched = await stitchVideoBlobs(blobs, (progress) => {
        setStitchProgress(progress);
      });

      setFinalVideoBlob(stitched);
      const url = URL.createObjectURL(stitched);
      setPreviewUrl(url);

      // Trigger confetti celebration
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Stitch error:', err);
    } finally {
      setIsStitching(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!finalVideoBlob) return;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ScriptCast-Video-${timestamp}.webm`;
    downloadBlob(finalVideoBlob, filename);
  };

  const handleDownloadAudioOnly = () => {
    if (!finalVideoBlob) return;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ScriptCast-Audio-${timestamp}.webm`;
    downloadBlob(finalVideoBlob, filename);
  };

  const handlePreviewSingleTake = (beat) => {
    const blob = recordedTakes[beat.id];
    if (blob) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setSelectedBeatIndex(beat.id);
    }
  };

  if (!isOpen) return null;

  const recordedBeatsCount = Object.keys(recordedTakes).length;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glass-panel export-modal">
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge export-badge">
              <Film size={22} className="text-emerald" />
            </div>
            <div>
              <h2>Review & Export Studio Master</h2>
              <p>Your clean video & audio with facecam. Prompter overlays are not burned in.</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="export-modal-grid">
          
          {/* Left: Video Player Preview */}
          <div className="export-preview-col">
            <div className="video-player-frame glass-panel">
              {previewUrl ? (
                <video
                  ref={videoPlayerRef}
                  src={previewUrl}
                  controls
                  playsInline
                  className="export-video-element"
                />
              ) : (
                <div className="video-empty-state">
                  <Film size={40} className="text-muted" />
                  <p>No video generated yet.</p>
                </div>
              )}
            </div>

            {/* Stitching Progress Bar */}
            {isStitching && (
              <div className="stitch-progress-bar">
                <div className="progress-info">
                  <span>Stitching clips seamlessly...</span>
                  <span>{stitchProgress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${stitchProgress}%` }} />
                </div>
              </div>
            )}

            {/* Download Buttons */}
            <div className="export-actions-row">
              <button
                className="btn-studio-primary export-main-btn"
                onClick={handleDownloadVideo}
                disabled={!finalVideoBlob || isStitching}
              >
                <Download size={18} />
                <span>Download Clean Video (WebM/MP4)</span>
              </button>

              <button
                className="btn-studio-secondary"
                onClick={handleDownloadAudioOnly}
                disabled={!finalVideoBlob || isStitching}
                title="Download pristine audio track for podcasts or voiceovers"
              >
                <Volume2 size={16} />
                <span>Audio Only</span>
              </button>
            </div>
          </div>

          {/* Right: Takes Breakdown & Clips List */}
          <div className="export-clips-col glass-panel">
            <div className="clips-header">
              <h3>Recorded Takes ({mode === 'beat' ? `${recordedBeatsCount}/${beats.length}` : '1 Take'})</h3>
              {mode === 'beat' && (
                <button className="btn-stitch-rebuild" onClick={handleStitchAll} disabled={isStitching}>
                  <Sparkles size={14} />
                  <span>Re-Stitch</span>
                </button>
              )}
            </div>

            {mode === 'beat' ? (
              <div className="clips-list-scroll">
                {beats.map((beat, idx) => {
                  const hasTake = !!recordedTakes[beat.id];
                  return (
                    <div 
                      key={beat.id} 
                      className={`clip-item-card ${hasTake ? 'has-take' : 'missing-take'} ${selectedBeatIndex === beat.id ? 'selected' : ''}`}
                    >
                      <div className="clip-num">#{idx + 1}</div>
                      <div className="clip-info">
                        <span className="clip-section-tag">{beat.section}</span>
                        <p className="clip-text">{beat.spokenText}</p>
                      </div>
                      <div className="clip-actions">
                        {hasTake ? (
                          <button
                            className="btn-play-clip"
                            onClick={() => handlePreviewSingleTake(beat)}
                            title="Preview this take"
                          >
                            <Play size={13} fill="#ffffff" />
                            <span>Preview</span>
                          </button>
                        ) : (
                          <span className="unrecorded-badge">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="continuous-take-info">
                <CheckCircle2 size={32} className="text-emerald" />
                <h4>Continuous Master Take</h4>
                <p>Recorded smoothly with live prompter pacing.</p>
              </div>
            )}

            {/* Clear All Takes */}
            <div className="clear-session-row">
              <button 
                className="btn-danger-text" 
                onClick={() => {
                  if (confirm('Clear all recorded takes and start fresh?')) {
                    onClearRecordings();
                    onClose();
                  }
                }}
              >
                <Trash2 size={14} />
                <span>Reset All Recordings</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
