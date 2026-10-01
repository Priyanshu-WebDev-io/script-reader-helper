import { parseScript, TONE_PROFILES } from './scriptParser';

/**
 * Script Loader Engine
 * 
 * Ingests, validates, and normalizes scripts from:
 * 1. Standard LLM JSON specification
 * 2. Markdown / Tagged Script format ([HOOK], [pause 1.5s], (stage cue))
 * 3. Raw plain text paragraphs
 */

/**
 * Validates whether an object complies with the ScriptCast JSON specification
 */
export function validateScriptSchema(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Script payload must be a valid JSON object.'] };
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Missing or invalid "title" field (string required).');
  }

  if (!Array.isArray(data.beats) || data.beats.length === 0) {
    errors.push('Script must contain a non-empty "beats" array.');
  } else {
    data.beats.forEach((beat, index) => {
      if (!beat || typeof beat !== 'object') {
        errors.push(`Beat #${index + 1} must be an object.`);
      } else if (!beat.spokenText || typeof beat.spokenText !== 'string' || !beat.spokenText.trim()) {
        errors.push(`Beat #${index + 1} is missing a non-empty "spokenText" string.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normalizes a JSON-based script into the app's internal format
 */
export function normalizeJsonScript(data, fallbackWpm = 150) {
  const wpm = Number(data.targetWpm) || fallbackWpm;
  const title = (data.title || 'Untitled Script').trim();
  const category = (data.category || 'General').trim();

  const beats = data.beats.map((beat, index) => {
    const rawSpoken = (beat.spokenText || '').trim();
    const words = rawSpoken.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Resolve tone
    let toneObj = TONE_PROFILES.default;
    if (typeof beat.tone === 'string') {
      const key = beat.tone.toLowerCase().trim();
      toneObj = TONE_PROFILES[key] || TONE_PROFILES.default;
    } else if (beat.tone && typeof beat.tone === 'object') {
      toneObj = {
        label: beat.tone.label || 'Natural',
        emoji: beat.tone.emoji || '🎙️',
        color: '#FFFFFF',
        bg: '#171717',
        coachingTip: beat.tone.coachingTip || 'Speak clearly.'
      };
    }

    const speakingDurationSec = Number(beat.speakingDurationSec) || Math.max(1.5, Math.round(((wordCount / wpm) * 60) * 10) / 10);
    const pauseAfterSec = typeof beat.pauseAfterSec === 'number' ? Math.max(0, beat.pauseAfterSec) : 1.0;
    const totalDurationSec = Math.round((speakingDurationSec + pauseAfterSec) * 10) / 10;

    // Emphasis words
    let emphasisWords = Array.isArray(beat.emphasisWords) ? beat.emphasisWords : [];
    if (emphasisWords.length === 0) {
      const capsMatches = rawSpoken.match(/\b[A-Z]{3,}\b/g);
      if (capsMatches) {
        emphasisWords = capsMatches.filter(w => !['THE', 'AND', 'FOR', 'YOU', 'WAS'].includes(w));
      }
    }

    return {
      id: beat.id || `beat-${index + 1}`,
      beatNumber: index + 1,
      section: (beat.section || `PART ${index + 1}`).toUpperCase().trim(),
      spokenText: rawSpoken,
      stageCues: beat.cues || beat.stageCues || null,
      tone: toneObj,
      wordCount,
      targetWpm: wpm,
      speakingDurationSec,
      pauseAfterSec,
      totalDurationSec,
      emphasisWords
    };
  });

  const totalWords = beats.reduce((acc, b) => acc + b.wordCount, 0);
  const totalDurationSec = Math.round(beats.reduce((acc, b) => acc + b.totalDurationSec, 0));

  // Generate plain text version for backward compatibility
  const rawTextRepresentation = beats.map(b => {
    let block = `[${b.section}]`;
    if (b.stageCues) block += ` (${b.stageCues})`;
    block += `\n${b.spokenText}`;
    if (b.pauseAfterSec > 0) block += `\n[pause ${b.pauseAfterSec}s]`;
    return block;
  }).join('\n\n');

  return {
    id: data.id || `script-${Date.now()}`,
    title,
    category,
    defaultWpm: wpm,
    targetDuration: `${totalDurationSec}s`,
    rawText: rawTextRepresentation,
    beats,
    parsedInfo: {
      beats,
      totalWords,
      totalDurationSec,
      estimatedMinutes: Math.floor(totalDurationSec / 60),
      estimatedSeconds: totalDurationSec % 60
    }
  };
}

/**
 * Universal Loader: Ingests raw input string and automatically
 * detects JSON vs Markdown/Text with resilient extraction.
 */
export function extractJsonCandidate(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();

  // 1. Check for markdown code fences: ```json ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    const candidate = fenceMatch[1].trim();
    if (candidate.startsWith('{') && candidate.endsWith('}')) {
      return candidate;
    }
  }

  // 2. Direct JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // 3. Conversational wrapper (e.g. "Here is your script: { ... } Hope it helps!")
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1).trim();
    return candidate;
  }

  return null;
}

export function validateAndParseJsonScript(rawInput, defaultWpm = 150, userAssignedTitle = '') {
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      valid: false,
      error: 'No JSON content provided. Please select a .json file or paste JSON text.',
      errors: ['No JSON content provided.'],
      script: null,
      detectedTitle: '',
      beatsCount: 0,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  const trimmed = rawInput.trim();
  const jsonCandidate = extractJsonCandidate(trimmed);

  if (!jsonCandidate) {
    return {
      valid: false,
      error: 'Only JSON format is accepted. Please provide a valid JSON object starting with { and ending with }.',
      errors: ['Format error: Input is not a JSON object.'],
      script: null,
      detectedTitle: '',
      beatsCount: 0,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  let parsedData;
  try {
    parsedData = JSON.parse(jsonCandidate);
  } catch (err) {
    return {
      valid: false,
      error: `JSON Syntax Error: ${err.message}`,
      errors: [`JSON Syntax Error: ${err.message}`],
      script: null,
      detectedTitle: '',
      beatsCount: 0,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
    return {
      valid: false,
      error: 'Script root must be a JSON object {...}',
      errors: ['Script root must be a JSON object {...}'],
      script: null,
      detectedTitle: '',
      beatsCount: 0,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  // Support alternative beat array keys (beats, scenes, blocks, takes)
  const rawBeats = parsedData.beats || parsedData.scenes || parsedData.blocks || parsedData.takes;

  if (!Array.isArray(rawBeats) || rawBeats.length === 0) {
    return {
      valid: false,
      error: 'Missing or empty "beats" array in JSON. Script must contain at least one beat.',
      errors: ['Missing or empty "beats" array in JSON.'],
      script: null,
      detectedTitle: parsedData.title || '',
      beatsCount: 0,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  // Validate individual beats
  const errors = [];
  rawBeats.forEach((b, index) => {
    if (!b || typeof b !== 'object') {
      errors.push(`Beat #${index + 1} must be an object.`);
      return;
    }
    const spoken = b.spokenText || b.text || b.script || b.speech || b.content;
    if (!spoken || typeof spoken !== 'string' || !spoken.trim()) {
      errors.push(`Beat #${index + 1} is missing spoken dialogue text.`);
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
      errors,
      script: null,
      detectedTitle: parsedData.title || '',
      beatsCount: rawBeats.length,
      totalDurationSec: 0,
      totalWords: 0
    };
  }

  // Auto-name: use custom title if provided, otherwise detected title, otherwise generate one
  const detectedTitle = (typeof parsedData.title === 'string' && parsedData.title.trim()) 
    ? parsedData.title.trim() 
    : '';

  const finalTitle = (userAssignedTitle && userAssignedTitle.trim())
    ? userAssignedTitle.trim()
    : (detectedTitle || `Script - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

  // Prepare normalized JSON
  const normalizedData = {
    ...parsedData,
    title: finalTitle,
    beats: rawBeats.map((b, idx) => ({
      ...b,
      id: b.id || `beat-${idx + 1}`,
      section: (b.section || `PART ${idx + 1}`).toUpperCase().trim(),
      spokenText: (b.spokenText || b.text || b.script || b.speech || b.content || '').trim()
    }))
  };

  const script = normalizeJsonScript(normalizedData, defaultWpm);
  script.title = finalTitle;

  return {
    valid: true,
    error: null,
    errors: [],
    script,
    detectedTitle,
    beatsCount: script.beats.length,
    totalDurationSec: script.parsedInfo.totalDurationSec,
    totalWords: script.parsedInfo.totalWords
  };
}

export function loadScriptFromInput(input, defaultWpm = 150) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return {
      success: false,
      error: 'Empty script input provided.'
    };
  }

  const trimmed = input.trim();
  const jsonCandidate = extractJsonCandidate(trimmed);

  // 1. Check if input is JSON
  if (jsonCandidate) {
    try {
      const parsedJson = JSON.parse(jsonCandidate);
      const validation = validateScriptSchema(parsedJson);

      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid JSON Schema: ${validation.errors.join(' ')}`,
          isJson: true,
          validationErrors: validation.errors
        };
      }

      const normalized = normalizeJsonScript(parsedJson, defaultWpm);
      return {
        success: true,
        isJson: true,
        script: normalized
      };
    } catch (err) {
      // If candidate was surrounded by {} but wasn't valid JSON, report error
      if (trimmed.startsWith('{') || trimmed.includes('```json')) {
        return {
          success: false,
          error: `JSON syntax error: ${err.message}`,
          isJson: true
        };
      }
    }
  }

  // 2. Parse as Markdown / Tagged text format
  const parsed = parseScript(trimmed, defaultWpm);
  if (!parsed.beats || parsed.beats.length === 0) {
    return {
      success: false,
      error: 'Could not extract any spoken beats from text.',
      isJson: false
    };
  }

  const script = {
    id: `script-${Date.now()}`,
    title: 'Custom Script',
    category: 'Custom',
    rawText: trimmed,
    defaultWpm,
    targetDuration: `${parsed.totalDurationSec}s`,
    beats: parsed.beats,
    parsedInfo: parsed
  };

  return {
    success: true,
    isJson: false,
    script
  };
}

/**
 * Serializes any loaded script into standard LLM JSON specification
 */
export function exportScriptToJson(script) {
  if (!script) return '{}';

  const exportObj = {
    $schema: 'https://scriptcast.studio/schema/v1.json',
    title: script.title || 'Untitled Script',
    category: script.category || 'General',
    targetWpm: script.defaultWpm || 150,
    targetDuration: script.targetDuration || '60s',
    beats: (script.beats || []).map(b => ({
      id: b.id,
      section: b.section,
      spokenText: b.spokenText,
      cues: b.stageCues || undefined,
      tone: typeof b.tone === 'object' ? b.tone.label : b.tone,
      pauseAfterSec: b.pauseAfterSec || 1.0,
      speakingDurationSec: b.speakingDurationSec,
      emphasisWords: (b.emphasisWords && b.emphasisWords.length > 0) ? b.emphasisWords : undefined
    }))
  };

  return JSON.stringify(exportObj, null, 2);
}


