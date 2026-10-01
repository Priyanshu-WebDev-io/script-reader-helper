// Intelligent script parser and voice director analyzer

export const TONE_PROFILES = {
  hook: {
    label: 'High Energy Hook',
    emoji: '⚡️',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    wpmMultiplier: 1.15,
    coachingTip: 'Punch the first 3 words with maximum presence. Look dead into the lens.'
  },
  problem: {
    label: 'Empathetic / Relatable',
    emoji: '🤝',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    wpmMultiplier: 0.95,
    coachingTip: 'Slow down slightly. Speak as if talking one-on-one with a trusted friend.'
  },
  solution: {
    label: 'Warm & Authoritative',
    emoji: '💡',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    wpmMultiplier: 1.0,
    coachingTip: 'Clear, steady pitch. Let your vocal authority shine through crisp diction.'
  },
  thoughtful: {
    label: 'Dramatic & Reflective',
    emoji: '🤔',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    wpmMultiplier: 0.85,
    coachingTip: 'Lower your pitch by half an octave. Leave ample room for the pauses.'
  },
  climax: {
    label: 'Urgent & Inspiring',
    emoji: '🔥',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    wpmMultiplier: 1.1,
    coachingTip: 'Build vocal momentum. Increase energy toward the final takeaway.'
  },
  cta: {
    label: 'Friendly Call-to-Action',
    emoji: '📣',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    wpmMultiplier: 1.05,
    coachingTip: 'Warm smile, upbeat cadence. Make it sound effortless and inviting.'
  },
  default: {
    label: 'Natural & Conversational',
    emoji: '🎙️',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    wpmMultiplier: 1.0,
    coachingTip: 'Keep a relaxed, natural cadence. Breathe from your diaphragm.'
  }
};

/**
 * Infers tone profile based on section tags and keywords
 */
function inferTone(sectionTag, text, stageCues) {
  const combined = `${sectionTag} ${text} ${stageCues}`.toLowerCase();

  if (/hook|stop scrolling|attention|secret|trick|viral/i.test(combined)) {
    return TONE_PROFILES.hook;
  }
  if (/problem|struggle|mistake|pain|frustrat|worst/i.test(combined)) {
    return TONE_PROFILES.problem;
  }
  if (/solution|here is what|how to|step|secret|truth|rebuilt/i.test(combined)) {
    return TONE_PROFILES.solution;
  }
  if (/pause|reflect|think|quiet|whisper|truth that nobody|slow down/i.test(combined)) {
    return TONE_PROFILES.thoughtful;
  }
  if (/climax|important|start now|urgent|remember|power|key/i.test(combined)) {
    return TONE_PROFILES.climax;
  }
  if (/call to action|cta|follow|subscribe|comment|share|save this/i.test(combined)) {
    return TONE_PROFILES.cta;
  }

  return TONE_PROFILES.default;
}

/**
 * Extracts pause length from pause tags e.g. [pause 2.0s] or (pause 1s)
 */
function extractPauseSeconds(text) {
  const match = text.match(/\[pause\s*([\d\.]+)?s?\]|\(pause\s*([\d\.]+)?s?\)/i);
  if (match) {
    const val = parseFloat(match[1] || match[2]);
    return !isNaN(val) ? val : 1.5;
  }
  if (text.includes('...') || text.toLowerCase().includes('[pause]')) {
    return 1.0;
  }
  return 0.5; // natural breath pause between beats
}

/**
 * Parses raw LLM / written script text into structured beats with director cues
 */
export function parseScript(rawText, baseWpm = 145) {
  if (!rawText || !rawText.trim()) {
    return { beats: [], totalWords: 0, estimatedDurationSec: 0 };
  }

  // Split raw text into paragraphs / blocks
  const blocks = rawText
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  const beats = [];
  let beatIndex = 1;
  let currentSection = 'INTRO';

  for (const block of blocks) {
    // Check if block has a section header tag like [HOOK], [PROBLEM], etc.
    let blockText = block;
    const sectionMatch = blockText.match(/^\[([A-Z\s\-_0-9]+)\]/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toUpperCase().trim();
      blockText = blockText.replace(/^\[[A-Z\s\-_0-9]+\]/i, '').trim();
    }

    // Extract stage directions in parentheses e.g. (Look directly into the lens)
    const stageCues = [];
    const cueRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = cueRegex.exec(blockText)) !== null) {
      stageCues.push(match[1].trim());
    }

    // Check pause tags
    const pauseSec = extractPauseSeconds(blockText);

    // Clean spoken text: remove [tags], (cues), clean double spaces
    let spokenText = blockText
      .replace(/\[pause[^\]]*\]/gi, '')
      .replace(/\(pause[^\)]*\)/gi, '')
      .replace(/\([^\)]+\)/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/^[A-Za-z0-9\s]+:\s*/, '') // Remove speaker labels like "Host: "
      .replace(/\s+/g, ' ')
      .trim();

    if (!spokenText) {
      // Might be a pure pause block
      if (pauseSec > 0 && beats.length > 0) {
        beats[beats.length - 1].pauseAfterSec = Math.max(beats[beats.length - 1].pauseAfterSec, pauseSec);
      }
      continue;
    }

    // Detect emphasis words (e.g. *word*, **word**, or ALL CAPS words with length >= 3)
    const emphasisWords = [];
    const starMatches = spokenText.match(/\*+([^*]+)\*+/g);
    if (starMatches) {
      starMatches.forEach(m => emphasisWords.push(m.replace(/\*/g, '')));
    }
    const capsMatches = spokenText.match(/\b[A-Z]{3,}\b/g);
    if (capsMatches) {
      capsMatches.forEach(w => {
        if (!['THE', 'AND', 'FOR', 'YOU', 'WAS'].includes(w)) {
          emphasisWords.push(w);
        }
      });
    }

    // Clean stars from spoken text
    spokenText = spokenText.replace(/\*/g, '');

    // Split long blocks into distinct sentences if too long (> 30 words) for bite-sized beats
    const words = spokenText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const tone = inferTone(currentSection, spokenText, stageCues.join(' '));
    const targetWpm = Math.round(baseWpm * tone.wpmMultiplier);
    const speakingDurationSec = Math.max(1.5, (wordCount / targetWpm) * 60);

    beats.push({
      id: `beat-${beatIndex++}`,
      beatNumber: beats.length + 1,
      section: currentSection,
      spokenText,
      stageCues: stageCues.length > 0 ? stageCues.join(' • ') : null,
      tone,
      wordCount,
      targetWpm,
      speakingDurationSec: Math.round(speakingDurationSec * 10) / 10,
      pauseAfterSec: pauseSec,
      totalDurationSec: Math.round((speakingDurationSec + pauseSec) * 10) / 10,
      emphasisWords,
      coachingTip: tone.coachingTip
    });
  }

  const totalWords = beats.reduce((acc, b) => acc + b.wordCount, 0);
  const totalDurationSec = Math.round(beats.reduce((acc, b) => acc + b.totalDurationSec, 0));

  return {
    beats,
    totalWords,
    totalDurationSec,
    estimatedMinutes: Math.floor(totalDurationSec / 60),
    estimatedSeconds: totalDurationSec % 60
  };
}

/**
 * Formats seconds into MM:SS
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
