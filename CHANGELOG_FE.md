# RAG API Changes - Dec 13, 2025

## Breaking Change: `POST /rag/query`

### Field renamed
- `context` → `type`

### New field added
- `context` (object) - Pass the current question/content the user is viewing

---

## Old Payload
```json
{
  "query": "你好 nghĩa là gì?",
  "context": "word",
  "hskLevel": 1
}
```

## New Payload
```json
{
  "query": "你好 nghĩa là gì?",
  "type": "word",
  "context": {
    "questionId": 123,
    "questionText": "选择正确的答案...",
    "lessonTitle": "Bài 1: Xin chào"
  },
  "hskLevel": 1
}
```

---

## Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | User's question |
| `type` | enum | ❌ | `general` \| `word` \| `grammar` \| `lesson` |
| `context` | object | ❌ | Current question/content JSON |
| `hskLevel` | number | ❌ | 1-6 |

---

## Notes
- `type` controls what content types are searched (word definitions, grammar, lessons)
- `context` is passed to the LLM to provide awareness of what the user is currently viewing
- Both fields are optional
