import React, { useRef, useEffect, useState } from 'react';
import { 
  Camera, 
  VideoOff, 
  RotateCw, 
  Play, 
  Square, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Type, 
  Sliders,
  Sparkles,
  Check
} from 'lucide-react';
import PrompterOverlay from './PrompterOverlay';

export default function CameraStudio({
  videoStream,
  isCameraActive,
  onRequestPermissions,
  aspectRatio,
  isMirrored,
  setIsMirrored,
  currentBeat,
  currentBeatIndex,
  totalBeats,
  onPreviousBeat,
  onNextBeat,
  isRecording,
  recordingStage,
  countdownNumber,
  elapsedSeconds,
  onStartRecordBeat,
  onStopRecordBeat,
  onRetakeBeat,
  hasExistingTake,
  targetWpm,
  fontSize,
  setFontSize,
  mode,
  // Continuous mode props
  onStartContinuous,
  onStopContinuous,
  continuousWpm,
  setContinuousWpm,
  continuousScrollOffset
}) {
  const videoRef = useRef(null);
  const continuousPrompterRef = useRef(null);

  // Bind media stream to video element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Handle continuous prompter scrolling
  useEffect(() => {
    if (mode === 'continuous' && continuousPrompterRef.current) {
      continuousPrompterRef.current.scrollTop = continuousScrollOffset;
    }
  }, [continuousScrollOffset, mode]);

  return (
    <div className="camera-studio-container">
      
      {/* Studio Aspect Box */}
      <div className={`video-aspect-frame aspect-${aspectRatio.replace(':', '-')}`}>
        
        {/* Real-time Video Stream */}
        {isCameraActive && videoStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`studio-video-feed ${isMirrored ? 'mirrored' : ''}`}
          />
        ) : (
          <div className="camera-offline-placeholder">
            <VideoOff size={48} className="text-muted" />
            <h3>Camera is Standby</h3>
            <p>Grant camera & microphone access to activate your facecam studio.</p>
            <button className="btn-studio-primary mt-3" onClick={onRequestPermissions}>
              <Camera size={16} />
              <span>Enable Facecam & Mic</span>
            </button>
          </div>
        )}

        {/* Studio Overlay Guides & Watermark */}
        <div className="studio-frame-guides">
          <div className="rec-badge-corner">
            <span className={`status-dot ${isRecording ? 'dot-recording' : 'dot-standby'}`} />
            <span>{isRecording ? 'LIVE TAKE' : 'STANDBY'}</span>
          </div>

          <div className="aspect-badge-corner">
            <span>{aspectRatio}</span>
          </div>
        </div>

        {/* Teleprompter In-Frame / Eye-Line View */}
        <div className="studio-prompter-dock">
          {mode === 'beat' ? (
            <PrompterOverlay
              currentBeat={currentBeat}
              isRecording={isRecording}
              recordingStage={recordingStage}
              countdownNumber={countdownNumber}
              elapsedSeconds={elapsedSeconds}
              targetWpm={targetWpm}
              fontSize={fontSize}
              showDirectLensGuide={true}
            />
          ) : (
            // Continuous Prompter View
            <div className="continuous-prompter-box glass-panel" ref={continuousPrompterRef}>
              <div className="continuous-eye-target-line">
                <span className="target-arrow">▶</span>
                <div className="target-line-bar" />
              </div>
              <div className="continuous-text-container" style={{ fontSize: `${fontSize}px` }}>
                {currentBeat ? (
                  <p className="continuous-text">{currentBeat.allScriptText}</p>
                ) : (
                  <p className="text-muted">Load a script to start teleprompter</p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Studio Controls Bar Below Camera */}
      <div className="studio-controls-bar glass-panel">
        
        {/* Left: Prompter Formatting Controls */}
        <div className="controls-left">
          <button 
            className="btn-control-icon" 
            onClick={() => setIsMirrored(prev => !prev)} 
            title="Mirror camera selfie view"
          >
            <RotateCw size={16} />
          </button>

          <div className="font-size-group">
            <button 
              className="btn-control-icon font-btn" 
              onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
              title="Decrease text size"
            >
              A-
            </button>
            <span className="font-size-val">{fontSize}px</span>
            <button 
              className="btn-control-icon font-btn" 
              onClick={() => setFontSize(prev => Math.min(36, prev + 2))}
              title="Increase text size"
            >
              A+
            </button>
          </div>
        </div>

        {/* Center: Main Record & Beat Navigation */}
        <div className="controls-center">
          {mode === 'beat' ? (
            <div className="beat-record-controls">
              {/* Previous Beat */}
              <button 
                className="btn-control-icon" 
                onClick={onPreviousBeat} 
                disabled={currentBeatIndex === 0 || isRecording}
                title="Previous beat"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Big Record Button */}
              {!isRecording ? (
                <button 
                  className="btn-main-record pulse-hover" 
                  onClick={onStartRecordBeat}
                  title="Record this beat"
                >
                  <div className="record-red-inner" />
                  <span>RECORD BEAT #{currentBeatIndex + 1}</span>
                </button>
              ) : (
                <button 
                  className="btn-main-stop" 
                  onClick={onStopRecordBeat}
                  title="Stop recording"
                >
                  <Square size={18} fill="#ffffff" />
                  <span>STOP BEAT</span>
                </button>
              )}

              {/* Next Beat */}
              <button 
                className="btn-control-icon" 
                onClick={onNextBeat} 
                disabled={currentBeatIndex === totalBeats - 1 || isRecording}
                title="Next beat"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            // Continuous Mode Main Button
            <div className="continuous-record-controls">
              {!isRecording ? (
                <button 
                  className="btn-main-record pulse-hover" 
                  onClick={onStartContinuous}
                >
                  <div className="record-red-inner" />
                  <span>START CONTINUOUS TAKE</span>
                </button>
              ) : (
                <button 
                  className="btn-main-stop" 
                  onClick={onStopContinuous}
                >
                  <Square size={18} fill="#ffffff" />
                  <span>STOP RECORDING</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Retake & Pacing adjustments */}
        <div className="controls-right">
          {mode === 'beat' && hasExistingTake && !isRecording && (
            <button 
              className="btn-retake" 
              onClick={onRetakeBeat} 
              title="Retake this beat"
            >
              <RotateCcw size={15} />
              <span>Retake Beat</span>
            </button>
          )}

          {mode === 'continuous' && (
            <div className="wpm-stepper">
              <span className="wpm-label">Pace: {continuousWpm} WPM</span>
              <input
                type="range"
                min="90"
                max="220"
                step="5"
                value={continuousWpm}
                onChange={(e) => setContinuousWpm(Number(e.target.value))}
                className="wpm-slider"
              />
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
