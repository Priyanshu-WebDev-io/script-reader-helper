// Client-side video stitching and export utilities

/**
 * Downloads any Blob to the user's computer
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Stitches multiple recorded video blobs into a single unified video file
 * using an off-screen HTML5 video + canvas + AudioContext pipeline.
 */
export async function stitchVideoBlobs(blobs, onProgress = () => {}) {
  if (!blobs || blobs.length === 0) {
    throw new Error('No video clips to stitch');
  }

  // If only 1 clip, no need to re-encode
  if (blobs.length === 1) {
    onProgress(100);
    return blobs[0];
  }

  return new Promise(async (resolve, reject) => {
    try {
      onProgress(5);

      // Create an offscreen video element
      const tempVideo = document.createElement('video');
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = false; // need audio
      tempVideo.playsInline = true;

      // Create a canvas for drawing frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Audio pipeline
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioDest = audioCtx.createMediaStreamDestination();
      const audioSource = audioCtx.createMediaElementSource(tempVideo);
      audioSource.connect(audioDest);
      // Optional: connect to destination if needed, but muted during export to avoid blaring sound

      // Load first video metadata to set canvas dimensions
      const firstUrl = URL.createObjectURL(blobs[0]);
      tempVideo.src = firstUrl;

      await new Promise(r => {
        tempVideo.onloadedmetadata = () => {
          canvas.width = tempVideo.videoWidth || 1080;
          canvas.height = tempVideo.videoHeight || 1920;
          r();
        };
      });

      // Combined stream: canvas video track + synthesized audio track
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000 // 6 Mbps studio quality
      });

      const outputChunks = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          outputChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        audioCtx.close();
        const finalBlob = new Blob(outputChunks, { type: mimeType });
        onProgress(100);
        resolve(finalBlob);
      };

      recorder.start(100);

      // Render loop
      let isRendering = true;
      const drawFrame = () => {
        if (!isRendering) return;
        if (tempVideo.readyState >= 2) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Sequentially play each blob
      for (let i = 0; i < blobs.length; i++) {
        const blobUrl = URL.createObjectURL(blobs[i]);
        tempVideo.src = blobUrl;

        await new Promise((clipResolve, clipReject) => {
          tempVideo.onended = () => {
            URL.revokeObjectURL(blobUrl);
            const progress = Math.round(((i + 1) / blobs.length) * 90);
            onProgress(progress);
            clipResolve();
          };

          tempVideo.onerror = (e) => {
            URL.revokeObjectURL(blobUrl);
            clipReject(e);
          };

          tempVideo.play().catch(clipReject);
        });
      }

      // Small 200ms grace period at end
      setTimeout(() => {
        isRendering = false;
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 200);

    } catch (err) {
      console.error('Error during video stitching:', err);
      // Fallback: return the first blob or combine raw webm blobs
      try {
        const rawBlob = new Blob(blobs, { type: 'video/webm' });
        resolve(rawBlob);
      } catch (fallbackErr) {
        reject(err);
      }
    }
  });
}
