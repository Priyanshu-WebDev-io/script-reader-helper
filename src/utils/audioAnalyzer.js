// Real-time audio analyzer for voice quality, decibel level, and speaking detection

export class AudioQualityAnalyzer {
  constructor(mediaStream, onUpdate) {
    this.mediaStream = mediaStream;
    this.onUpdate = onUpdate;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.animationId = null;
    this.isActive = false;

    // Smoothing & calibration
    this.smoothedVolume = 0;
    this.noiseFloor = 8; // threshold %
    this.speakingThreshold = 18; // threshold %
  }

  start() {
    try {
      if (!this.mediaStream || this.mediaStream.getAudioTracks().length === 0) {
        console.warn('AudioQualityAnalyzer: No audio track available');
        return;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.65;

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      this.isActive = true;
      this.tick();
    } catch (err) {
      console.error('Failed to initialize audio analyzer:', err);
    }
  }

  tick = () => {
    if (!this.isActive || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate Average Frequency Energy / RMS
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const rawVolume = (sum / dataArray.length / 255) * 100;

    // Smooth volume response
    this.smoothedVolume = this.smoothedVolume * 0.4 + rawVolume * 0.6;
    const volumePercent = Math.min(100, Math.round(this.smoothedVolume));

    // Voice quality rating
    let status = 'silent';
    let label = 'Quiet / Room Tone';
    let color = '#94a3b8'; // slate

    if (volumePercent > 88) {
      status = 'clipping';
      label = 'Mic Clipping (Too Loud)';
      color = '#ef4444'; // red
    } else if (volumePercent >= 65) {
      status = 'loud';
      label = 'High Energy / Loud';
      color = '#f59e0b'; // amber
    } else if (volumePercent >= 22) {
      status = 'optimal';
      label = 'Optimal Studio Level';
      color = '#10b981'; // green
    } else if (volumePercent >= this.noiseFloor) {
      status = 'quiet';
      label = 'Slightly Quiet';
      color = '#38bdf8'; // light blue
    }

    const isSpeaking = volumePercent >= this.speakingThreshold;

    if (this.onUpdate) {
      this.onUpdate({
        volumePercent,
        status,
        label,
        color,
        isSpeaking,
        frequencies: Array.from(dataArray.slice(0, 32)) // small subset for visualizer
      });
    }

    this.animationId = requestAnimationFrame(this.tick);
  };

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        // ignore
      }
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
  }
}
