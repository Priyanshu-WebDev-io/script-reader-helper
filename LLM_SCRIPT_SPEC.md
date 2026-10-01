# ScriptCast Studio: LLM Script Specification & Generation Guide

> **Official JSON Format & Prompting Guide for AI-Generated Video Scripts**

This document specifies the exact JSON format required by **ScriptCast Studio's Script Loader Engine**. LLMs (ChatGPT, Claude, Gemini, DeepSeek, Llama, etc.) can read this specification and generate 100% compliant video scripts that the app ingests, parses, paces, and displays on the teleprompter.

---

## 1. Universal LLM Prompt (Copy & Paste into Any AI)

Copy and paste the prompt below into any LLM:

```markdown
You are an expert video copywriter and teleprompter coach for "ScriptCast Studio".
Generate a high-converting, paced short-form video script about: "[YOUR TOPIC HERE]".

You MUST output ONLY a raw JSON object matching the exact specification below. Do not wrap in commentary or markdown conversational text.

{
  "title": "A short, compelling title for the video",
  "category": "Educational",
  "targetWpm": 150,
  "beats": [
    {
      "id": "beat-1",
      "section": "HOOK",
      "spokenText": "The exact words spoken aloud in this beat. Keep it punchy.",
      "cues": "Stage direction for eye-contact, gesture, or expression (e.g. Look dead into lens, lean in)",
      "tone": "hook",
      "pauseAfterSec": 1.2,
      "emphasisWords": ["exact", "words"]
    },
    {
      "id": "beat-2",
      "section": "PROBLEM",
      "spokenText": "The core struggle, myth, or pain point being addressed.",
      "cues": "Conversational, subtle head nod",
      "tone": "problem",
      "pauseAfterSec": 1.0,
      "emphasisWords": ["struggle", "pain"]
    },
    {
      "id": "beat-3",
      "section": "SOLUTION",
      "spokenText": "The breakthrough method, explanation, or key takeaway.",
      "cues": "Upright posture, confident tone",
      "tone": "solution",
      "pauseAfterSec": 1.0,
      "emphasisWords": ["breakthrough"]
    },
    {
      "id": "beat-4",
      "section": "CTA",
      "spokenText": "Follow for more daily insights and comment your question below.",
      "cues": "Friendly smile, nod towards camera",
      "tone": "cta",
      "pauseAfterSec": 1.5,
      "emphasisWords": ["Follow", "comment"]
    }
  ]
}

CRITICAL RULES:
1. Each beat represents a single recording take (1 to 3 sentences maximum).
2. "tone" must be one of: "hook", "problem", "solution", "thoughtful", "cta", or "default".
3. "pauseAfterSec" is the rest period after speaking before cutting to the next take (typically 0.8s to 1.5s).
4. "emphasisWords" are words that will be dynamically highlighted on the speaker's teleprompter screen.
5. "cues" guide the speaker's body language and eye contact with the front lens.
```

---

## 2. JSON Schema Definition

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Video title displayed in the Gallery and Studio header. |
| `category` | `string` | No | Category tag (e.g., `"Tech"`, `"Educational"`, `"Fitness"`, `"Business"`). Defaults to `"General"`. |
| `targetWpm` | `number` | No | Target speaking pace in Words Per Minute (recommended: `130`–`160`). Defaults to `150`. |
| `description` | `string` | No | Optional notes or synopsis for the creator. |
| `beats` | `array` | **Yes** | Non-empty array of structured Beat objects. |

### Beat Object Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | No | Unique identifier for the beat (e.g., `"beat-1"`). Auto-generated if omitted. |
| `section` | `string` | No | Narrative section (e.g., `"HOOK"`, `"PROBLEM"`, `"SOLUTION"`, `"PROOF"`, `"CTA"`). |
| `spokenText` | `string` | **Yes** | The actual words the creator will speak into the camera. |
| `cues` | `string` | No | Physical stage cues displayed above the prompter (e.g., `"Smile"`, `"Hold eye contact"`). |
| `tone` | `string` | No | Pacing and vocal coaching preset (see Tone Profiles below). |
| `pauseAfterSec` | `number` | No | Duration (in seconds) to hold eye contact before ending take. Defaults to `1.0`. |
| `speakingDurationSec` | `number` | No | Optional explicit duration. If omitted, the engine calculates it using `wordCount / targetWpm * 60`. |
| `emphasisWords` | `string[]` | No | List of key words to underline/highlight on the teleprompter screen. |

---

## 3. Supported Tone Profiles

The engine maps tone values to vocal coaching directives:

| Tone Value | Purpose | Teleprompter Directive |
|---|---|---|
| `"hook"` | Opening hook / attention grabber | High Energy. Punch the first 3 words. Lock eyes with front lens. |
| `"problem"` | Empathizing with viewer struggle | Slow down. Conversational, one-on-one cadence. |
| `"solution"` | Demonstrating expertise / value | Crisp, confident vocal authority with steady pitch. |
| `"thoughtful"` | Dramatic insight or reflection | Lower pitch slightly, leave ample room for pauses. |
| `"cta"` | Call-to-action / Outro | Warm, upbeat smile, make following feel effortless. |
| `"default"` | General narrative | Relaxed, natural conversational breathing. |

---

## 4. Full Working Example

```json
{
  "title": "Why 99% of Prompts Fail (And the 10-Second Fix)",
  "category": "AI & Productivity",
  "targetWpm": 150,
  "beats": [
    {
      "id": "beat-1",
      "section": "HOOK",
      "spokenText": "If your AI outputs sound like generic corporate jargon, you are making one crucial mistake.",
      "cues": "Lean forward, intense eye contact",
      "tone": "hook",
      "pauseAfterSec": 1.2,
      "emphasisWords": ["generic", "crucial", "mistake"]
    },
    {
      "id": "beat-2",
      "section": "PROBLEM",
      "spokenText": "You are treating the model like a search engine instead of a junior analyst who needs context and role constraints.",
      "cues": "Shake head slowly, conversational tone",
      "tone": "problem",
      "pauseAfterSec": 1.0,
      "emphasisWords": ["search engine", "junior analyst", "context"]
    },
    {
      "id": "beat-3",
      "section": "SOLUTION",
      "spokenText": "Before asking your question, define three things: the exact role, the target audience, and two negative constraints of what NOT to do.",
      "cues": "Count on fingers, clear articulate delivery",
      "tone": "solution",
      "pauseAfterSec": 1.0,
      "emphasisWords": ["exact role", "target audience", "negative constraints"]
    },
    {
      "id": "beat-4",
      "section": "CTA",
      "spokenText": "Save this video for your next prompt session and follow for daily workflow upgrades.",
      "cues": "Warm smile, point down",
      "tone": "cta",
      "pauseAfterSec": 1.5,
      "emphasisWords": ["Save", "follow"]
    }
  ]
}
```

---

## 5. Alternative Markdown Format (Also Supported by Engine)

If you prefer markdown or text scripts, the engine also parses tagged text automatically:

```markdown
[HOOK] (Look directly into lens)
If your AI outputs sound like generic corporate jargon, you are making one crucial mistake.
[pause 1.2s]

[PROBLEM] (Shake head slowly)
You are treating the model like a search engine instead of a junior analyst who needs context.
[pause 1.0s]

[SOLUTION] (Count on fingers)
Before asking your question, define three things: the role, the audience, and negative constraints.
[pause 1.0s]

[CTA] (Warm smile)
Save this video for your next prompt session and follow for daily workflow upgrades.
[pause 1.5s]
```

Both formats are supported interchangeably by the **Script Loader Engine**.
