import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Volume2, 
  Check, 
  Trash2, 
  Sliders, 
  HelpCircle,
  X
} from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../utils/sampleScripts';
import { parseScript } from '../utils/scriptParser';

export default function ScriptEditor({
  isOpen,
  onClose,
  currentRawScript,
  onApplyScript,
  baseWpm,
  setBaseWpm
}) {
  const [scriptText, setScriptText] = useState(currentRawScript || SAMPLE_SCRIPTS[0].rawText);
  const [selectedSampleId, setSelectedSampleId] = useState('shorts-hook');

  if (!isOpen) return null;

  // Real-time preview parse
  const parsed = parseScript(scriptText, baseWpm);

  // Load sample script
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setScriptText(sample.rawText);
  };

  // Clean raw LLM formatting (removes asterisks, markdown headings, etc.)
  const handleCleanScript = () => {
    let cleaned = scriptText
      .replace(/^#+\s+/gm, '') // Remove markdown headers #
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/^(Host|Narrator|Speaker|You):\s*/gmi, '') // Remove speaker prefixes
      .replace(/\[Visual:.*?\]/gi, '') // Remove visual stage cues
      .trim();
    setScriptText(cleaned);
  };

  const handleSaveAndStart = () => {
    onApplyScript(scriptText);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog glass-panel script-modal">
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <FileText size={20} className="text-cyan" />
            </div>
            <div>
              <h2>Script Studio & LLM Loader</h2>
              <p>Paste any script from ChatGPT, Claude, or Gemini. Everything parses 100% offline.</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Preset Sample Scripts */}
        <div className="samples-bar">
          <span className="samples-label">Quick Templates:</span>
          <div className="samples-list">
            {SAMPLE_SCRIPTS.map(sample => (
              <button
                key={sample.id}
                className={`sample-pill-btn ${selectedSampleId === sample.id ? 'active' : ''}`}
                onClick={() => handleSelectSample(sample)}
              >
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Text Area + Analysis Breakdown */}
        <div className="script-modal-grid">
          
          {/* Left: Input Textarea */}
          <div className="script-input-col">
            <div className="textarea-toolbar">
              <span className="toolbar-hint">
                Tip: Use <code>[HOOK]</code>, <code>[pause 2s]</code>, and <code>(look into lens)</code> for auto-cues.
              </span>
              <button className="btn-clean-text" onClick={handleCleanScript} title="Clean markdown & speaker prefixes">
                <Sparkles size={13} />
                <span>Format LLM Output</span>
              </button>
            </div>

            <textarea
              className="script-textarea"
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste your script here...&#10;&#10;Example:&#10;[HOOK] (Energetic, look into lens)&#10;Stop scrolling! This 3-second trick changes everything.&#10;[pause 1.5s]&#10;[PROBLEM] (Slow down)&#10;Most people never realize this..."
              rows={14}
            />
          </div>

          {/* Right: Live Script Intelligence & Pacing Stats */}
          <div className="script-stats-col glass-panel">
            <h3 className="stats-heading">Script Intelligence</h3>

            <div className="stat-cards-grid">
              <div className="stat-card">
                <span className="stat-label">Total Beats</span>
                <span className="stat-value">{parsed.beats.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Word Count</span>
                <span className="stat-value">{parsed.totalWords}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Est. Duration</span>
                <span className="stat-value text-emerald">
                  {parsed.estimatedMinutes > 0 ? `${parsed.estimatedMinutes}m ` : ''}{parsed.estimatedSeconds}s
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Target Pace</span>
                <span className="stat-value text-cyan">{baseWpm} WPM</span>
              </div>
            </div>

            {/* Base Pace Slider */}
            <div className="slider-control-group">
              <div className="slider-header">
                <span>Reading Pace (WPM)</span>
                <span className="slider-val">{baseWpm} WPM</span>
              </div>
              <input
                type="range"
                min="110"
                max="190"
                step="5"
                value={baseWpm}
                onChange={(e) => setBaseWpm(Number(e.target.value))}
                className="custom-range"
              />
              <div className="slider-labels">
                <span>110 (Deliberate)</span>
                <span>145 (Conversational)</span>
                <span>180 (Fast Hook)</span>
              </div>
            </div>

            {/* Tone Distribution */}
            <div className="tones-list-section">
              <h4 className="tones-title">Detected Tone Flow:</h4>
              <div className="tone-chips-container">
                {parsed.beats.map((beat, idx) => (
                  <div 
                    key={idx} 
                    className="tone-chip"
                    style={{ 
                      color: beat.tone.color,
                      borderColor: `${beat.tone.color}55`,
                      backgroundColor: beat.tone.bg
                    }}
                    title={`Beat ${idx+1}: ${beat.section} (${beat.speakingDurationSec}s)`}
                  >
                    <span>{beat.tone.emoji}</span>
                    <span>{beat.section}</span>
                    <span className="chip-time">{beat.speakingDurationSec}s</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline badge */}
            <div className="offline-notice">
              <Check size={14} className="text-emerald" />
              <span>Parsed 100% on device. No tokens or API costs.</span>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-studio-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-studio-primary load-btn"
            onClick={handleSaveAndStart}
            disabled={parsed.beats.length === 0}
          >
            <Check size={17} />
            <span>Load into Studio ({parsed.beats.length} Beats)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
