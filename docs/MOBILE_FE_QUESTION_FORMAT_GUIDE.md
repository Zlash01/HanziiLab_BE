# Mobile Frontend - Question Data Format Guide

> **Important**: This guide documents payload structure changes for question types in the chinese-management admin panel. The mobile frontend needs to handle both legacy and new formats for backward compatibility.

---

## 1. TextContent Format (NEW)

Several question types now use a unified `TextContent` object for text fields that may contain Chinese with pinyin.

### TextContent Structure

```typescript
interface TextContent {
  // Simple text mode (Vietnamese, English, etc.)
  text?: string;
  
  // Chinese + Pinyin mode
  chinese?: string[];  // Array of Chinese chars/words
  pinyin?: string[];   // Array of pinyin (1:1 mapping with chinese)
}
```

### How to Detect Mode

```typescript
// Check if it's Chinese content
function isChineseContent(content: TextContent): boolean {
  return Array.isArray(content.chinese) && 
         content.chinese.length > 0 && 
         content.chinese.some(c => c.length > 0);
}

// Check if it's simple text
function isSimpleText(content: TextContent): boolean {
  return typeof content.text === 'string' && content.text.length > 0;
}
```

### Display Examples

**Simple Text:**
```json
{ "text": "Xin chào" }
```
→ Display: `Xin chào`

**Chinese with Pinyin:**
```json
{ 
  "chinese": ["你", "好"],
  "pinyin": ["nǐ", "hǎo"]
}
```
→ Display with ruby (pinyin above):
```
  nǐ    hǎo
  你    好
```

---

## 2. Selection Questions

### Affected Types
- `question_selection_text_text`
- `question_selection_text_image`
- `question_selection_audio_text`
- `question_selection_image_text`

### Payload Changes

#### Question Content

| Field | Legacy | New |
|-------|--------|-----|
| Question text | `data.question: string` | `data.questionContent: TextContent` |

**Example - New format:**
```json
{
  "questionContent": {
    "chinese": ["你好", "吗"],
    "pinyin": ["nǐhǎo", "ma"]
  }
}
```

**Example - Legacy format (still supported):**
```json
{
  "question": "What does this mean?"
}
```

#### Options (for text-based options)

| Field | Legacy | New |
|-------|--------|-----|
| Option text | `options[].text: string` | `options[].content: TextContent` |

**Example - New format:**
```json
{
  "options": [
    {
      "id": "1",
      "content": {
        "chinese": ["你好"],
        "pinyin": ["nǐhǎo"]
      }
    },
    {
      "id": "2", 
      "content": {
        "text": "Xin chào"
      }
    }
  ]
}
```

**Example - Legacy format (still supported):**
```json
{
  "options": [
    { "id": "1", "text": "Hello" },
    { "id": "2", "text": "Goodbye" }
  ]
}
```

---

## 3. Fill-in-the-Blank Questions

### Type: `question_fill_text_text`

> **Note**: This question type uses **Chinese content only** (always has `chinese`/`pinyin` arrays, never simple `text`).

### Payload Changes

#### Segments (NEW)

Replaces separate `sentence` and `pinyin` arrays with unified segments:

| Field | Legacy | New |
|-------|--------|-----|
| Sentence parts | `sentence: string[]`, `pinyin: string[]` | `segments: FillSegment[]` |

**Segment Structure:**
```typescript
interface FillSegment {
  type: 'text' | 'blank';
  // For text segments (always Chinese with pinyin)
  content?: { chinese: string[], pinyin: string[] };
  // For blank segments
  blankIndex?: number;
}
```

**Example - New format:**
```json
{
  "segments": [
    { 
      "type": "text", 
      "content": { "chinese": ["我"], "pinyin": ["wǒ"] }
    },
    { 
      "type": "blank", 
      "blankIndex": 1 
    },
    { 
      "type": "text", 
      "content": { "chinese": ["学习"], "pinyin": ["xuéxí"] }
    },
    { 
      "type": "blank", 
      "blankIndex": 2 
    }
  ]
}
```

**Example - Legacy format (still supported):**
```json
{
  "sentence": ["我", "[1]", "学习", "[2]"],
  "pinyin": ["wǒ", "[1]", "xuéxí", "[2]"]
}
```

#### Option Bank (NEW)

Options are Chinese with pinyin:

| Field | Legacy | New |
|-------|--------|-----|
| Options | `optionBank: string[]` | `optionBankItems: { chinese: string[], pinyin: string[] }[]` |

**Example - New format:**
```json
{
  "optionBankItems": [
    { "chinese": ["在"], "pinyin": ["zài"] },
    { "chinese": ["中文"], "pinyin": ["zhōngwén"] }
  ]
}
```

#### Correct Answers (NEW)

Answers are Chinese with pinyin:

| Field | Legacy | New |
|-------|--------|-----|
| Blanks | `blanks[].correct: string[]` | `blankAnswers[].correctAnswers: { chinese: string[], pinyin: string[] }[]` |

**Example - New format:**
```json
{
  "blankAnswers": [
    {
      "index": 1,
      "correctAnswers": [
        { "chinese": ["在"], "pinyin": ["zài"] }
      ]
    }
  ]
}
```

---

## 4. Backward Compatibility Strategy

The mobile frontend should:

1. **Check for new fields first**, fall back to legacy fields
2. **Use helper functions** to normalize data

### Recommended Helper

```typescript
function getDisplayTextFromContent(content: TextContent | string | undefined): string {
  if (!content) return '';
  
  // Legacy string
  if (typeof content === 'string') return content;
  
  // Chinese content
  if (content.chinese && content.chinese.length > 0) {
    return content.chinese.join('');
  }
  
  // Simple text
  return content.text || '';
}

function getDisplayPinyinFromContent(content: TextContent | undefined): string {
  if (!content) return '';
  if (content.pinyin && content.pinyin.length > 0) {
    return content.pinyin.join(' ');
  }
  return '';
}
```

### Example: Rendering an Option

```typescript
function renderOption(option: any) {
  // Try new format first
  if (option.content) {
    const text = getDisplayTextFromContent(option.content);
    const pinyin = getDisplayPinyinFromContent(option.content);
    return { text, pinyin };
  }
  
  // Fall back to legacy
  return { text: option.text || '', pinyin: '' };
}
```

---

## 5. Summary of Changes

| Question Type | Changed Fields |
|--------------|----------------|
| `question_selection_text_text` | `questionContent`, `options[].content` |
| `question_selection_text_image` | `questionContent` |
| `question_selection_audio_text` | `options[].content` |
| `question_selection_image_text` | `options[].content` |
| `question_fill_text_text` | `segments`, `optionBankItems`, `blankAnswers` |

---

## Questions?

Contact the backend team for clarification on any payload structures.
