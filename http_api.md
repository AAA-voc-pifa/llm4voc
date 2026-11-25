# HTTP API

Word regex: `/^[A-Za-z]+(-[A-Za-z]+)*$/`

## Errors (plain text body)

| status | body | when |
| -----: | ---- | ---- |
| 400 | `baD requesT` | missing/empty `Authentication`; invalid query; LLM says 非英文单词 |
| 401 | `baD autH` | `Authentication` present but ≠ `AUTHENTICATION` |
| 404 | `noT founD` | unknown path or wrong method |
| 500 | `unknowN erroR` | LLM call/parse failure or unexpected error |

## Shared response shapes

`{ data, raw }` used by `/e2c`, `/e2c-multi`, `/mnemonic-j`:
- `data`: parsed payload (below)
- `raw`: DeepSeek response; `raw.choices[0].message.content` cleared to `""`; `reasoning_content` kept

`/mnemonic` returns raw DeepSeek JSON only (no `{ data, raw }` wrapper). Content in `choices[0].message.content`.

## Endpoints

### `GET /e2c?word=`

One word → 3 EN→ZH questions.

```json
{
  "data": {
    "word": "lash",
    "questions": [{ "en": "...", "zh": "..." }]
  },
  "raw": {}
}
```

### `GET /e2c-multi?word=&word=&word=`

Exactly 3 `word` params → 1 question each, same order.

```json
{
  "data": {
    "questions": [{ "word": "lash", "en": "...", "zh": "..." }]
  },
  "raw": {}
}
```

### `GET /mnemonic?word=`

Plain-text mnemonic in `choices[0].message.content`.  
Special content value: `没有找到合适的助记内容` (no suitable mnemonic; still HTTP 200).

### `GET /mnemonic-j?word=`

Structured mnemonic. Nullable fields mean “no content for that angle”.

```ts
type MnemonicContent = {
  etymology: { components: string[]; explanation: string } | null  // components.length >= 1
  variant: string | null
  homophonic: { list: string[]; best: number } | null  // list 1..3; best 0..2
  abbreviation: string | null
  meme: string | null
  other: string | null
  all_in_one: string | null
}
```

Response: `{ data: MnemonicContent, raw }`.

## curl

```bash
curl -H "Authentication: $AUTHENTICATION" "http://xxx/e2c?word=self-aware"
curl -H "Authentication: $AUTHENTICATION" "http://xxx/e2c-multi?word=lash&word=proficient&word=self-aware"
curl -H "Authentication: $AUTHENTICATION" "http://xxx/mnemonic?word=unanimous"
curl -H "Authentication: $AUTHENTICATION" "http://xxx/mnemonic-j?word=unanimous"
```
