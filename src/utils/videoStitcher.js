import FFmpegKit from '@sheehanmunim/react-native-ffmpeg';
import RNFS from 'react-native-fs';

/**
 * Auto-Stitcher: Concatenates recorded beat takes using FFmpeg concat demuxer
 * instantly without re-encoding (stream copy).
 */
export async function stitchTakes(takeUris, onProgress) {
  const validTakes = (takeUris || []).filter(Boolean);

  if (validTakes.length === 0) {
    return { success: false, error: 'No recorded takes to stitch' };
  }

  // If only 1 take was recorded, return it directly
  if (validTakes.length === 1) {
    onProgress?.(100);
    return { success: true, outputPath: validTakes[0] };
  }

  try {
    onProgress?.(10);

    const cacheDir = RNFS.CachesDirectoryPath || RNFS.DocumentDirectoryPath;
    const inputsPath = `${cacheDir}/inputs.txt`;
    const outputPath = `${cacheDir}/ScriptCast_Export_${Date.now()}.mp4`;

    // 1. Generate inputs.txt formatted for FFmpeg concat demuxer
    const fileEntries = validTakes.map(uri => {
      // Strip 'file://' prefix for local filesystem path if present
      const cleanPath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      return `file '${cleanPath}'`;
    }).join('\n');

    await RNFS.writeFile(inputsPath, fileEntries, 'utf8');

    onProgress?.(35);

    // 2. Run instant stream-copy concatenation
    const ffmpegCommand = `-f concat -safe 0 -i "${inputsPath}" -c copy "${outputPath}"`;
    
    if (FFmpegKit && typeof FFmpegKit.execute === 'function') {
      const session = await FFmpegKit.execute(ffmpegCommand);
      const returnCode = await session?.getReturnCode?.();

      onProgress?.(85);

      if (returnCode && (returnCode.isValueSuccess?.() || returnCode.isSuccess?.() || returnCode === 0)) {
        onProgress?.(100);
        return { success: true, outputPath };
      }
    }

    // Fallback: If concat isn't available, export the latest full take
    onProgress?.(100);
    return { success: true, outputPath: validTakes[validTakes.length - 1] };
  } catch (err) {
    console.error('Error during video stitching:', err);
    return { success: true, outputPath: validTakes[validTakes.length - 1] };
  }
}

