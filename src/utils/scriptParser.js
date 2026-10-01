export const TONE_PROFILES = {
  hook: {
    label: 'High Energy Hook',
    emoji: '⚡️',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.25)',
    coachingTip: 'Punch the first 3 words with maximum energy. Stare dead into the front lens.'
  },
  problem: {
    label: 'Empathetic / Relatable',
    emoji: '🤝',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.25)',
    coachingTip: 'Slow down. Speak as if talking one-on-one with a close friend.'
  },
  solution: {
    label: 'Warm & Authoritative',
    emoji: '💡',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.25)',
    coachingTip: 'Clear, steady pitch. Let your vocal authority shine through crisp diction.'
  },
  thoughtful: {
    label: 'Dramatic & Reflective',
    emoji: '🤔',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.25)',
    coachingTip: 'Lower pitch by half an octave. Leave ample room for the pause.'
  },
  cta: {
    label: 'Friendly Outro / CTA',
    emoji: '📣',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.25)',
    coachingTip: 'Warm smile, upbeat cadence. Make following feel effortless.'
  },
  default: {
    label: 'Natural & Conversational',
    emoji: '🎙️',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.25)',
    coachingTip: 'Relaxed cadence. Breathe from your diaphragm.'
  }
};

function inferTone(sectionTag, text, stageCues) {
  const combined = `${sectionTag} ${text} ${stageCues}`.toLowerCase();

  if (/hook|stop scrolling|attention|secret|trick|viral/i.test(combined)) {
    return TONE_PROFILES.hook;
  }
  if (/problem|struggle|mistake|pain|frustrat|worst/i.test(combined)) {
    return TONE_PROFILES.problem;
  }
  if (/solution|here is what|how to|step|truth|notice/i.test(combined)) {
    return TONE_PROFILES.solution;
  }
  if (/pause|reflect|think|quiet|whisper|slow down/i.test(combined)) {
    return TONE_PROFILES.thoughtful;
  }
  if (/call to action|cta|follow|subscribe|comment|share/i.test(combined)) {
    return TONE_PROFILES.cta;
  }

  return TONE_PROFILES.default;
}

function extractPauseSeconds(text) {
  const match = text.match(/\[pause\s*([\d\.]+)?s?\]|\(pause\s*([\d\.]+)?s?\)/i);
  if (match) {
    const val = parseFloat(match[1] || match[2]);
    return !isNaN(val) ? val : 1.5;
  }
  if (text.includes('...') || text.toLowerCase().includes('[pause]')) {
    return 1.0;
  }
  return 0.5;
}

export function parseScript(rawText, wpm = 150) {
  if (!rawText || !rawText.trim()) {
    return {
      beats: [],
      totalWords: 0,
      totalDurationSec: 0,
      estimatedMinutes: 0,
      estimatedSeconds: 0
    };
  }

  const blocks = rawText
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  const beats = [];
  let beatIndex = 1;
  let currentSection = 'INTRO';

  for (const block of blocks) {
    let blockText = block;

    // Detect section headers [HOOK], [PROBLEM], etc.
    const sectionMatch = blockText.match(/^\[([A-Z\s\-_0-9]+)\]/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toUpperCase().trim();
      blockText = blockText.replace(/^\[[A-Z\s\-_0-9]+\]/i, '').trim();
    }

    // Extract stage directions in parentheses (look directly into lens)
    const stageCues = [];
    const cueRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = cueRegex.exec(blockText)) !== null) {
      stageCues.push(match[1].trim());
    }

    const pauseSec = extractPauseSeconds(blockText);

    // Clean spoken text: strip cues, tags, speaker prefixes
    let spokenText = blockText
      .replace(/\[pause[^\]]*\]/gi, '')
      .replace(/\(pause[^\)]*\)/gi, '')
      .replace(/\([^\)]+\)/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .replace(/^[A-Za-z0-9\s]+:\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!spokenText) {
      if (pauseSec > 0 && beats.length > 0) {
        beats[beats.length - 1].pauseAfterSec = Math.max(beats[beats.length - 1].pauseAfterSec, pauseSec);
      }
      continue;
    }

    // Detect emphasis words
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

    spokenText = spokenText.replace(/\*/g, '');

    const words = spokenText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const tone = inferTone(currentSection, spokenText, stageCues.join(' '));
    const targetWpm = wpm;
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
      emphasisWords
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
