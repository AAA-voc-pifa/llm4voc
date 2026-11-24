# HTTP API

## 通用约定

内网部署，无认证。

### 通用错误

| 状态码 | 正文（纯文本）  | 说明                                 |
| ------ | --------------- | ------------------------------------ |
| `400`  | `baD requesT`   | query 无效，或 LLM 判定非英文单词    |
| `404`  | `noT founD`     | 未知路径或 Method 不支持             |
| `500`  | `unknowN erroR` | 未捕获异常，或上游 LLM 调用/解析失败 |

单词参数统一匹配：`/^[A-Za-z]+(-[A-Za-z]+)*$/`（字母，可含连字符，如 `self-aware`）。

---

## `GET /e2c`

根据英文单词生成 3 道「英译中」题目（含英文原句与中文参考翻译）。

### Query

| 参数   | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| `word` | string | 是   | 目标英文单词 |

### 成功响应

- **状态码** `200`
- **Content-Type** `application/json`

```json
{
  "data": {
    "word": "lash",
    "questions": [
      {
        "en": "Poverty lashes at the body, but ignorance lashes at the soul.",
        "zh": "贫穷鞭打身体，但无知鞭打灵魂。"
      },
      {
        "en": "...",
        "zh": "..."
      },
      {
        "en": "...",
        "zh": "..."
      }
    ]
  },
  "raw": {
    "id": "...",
    "choices": [
      {
        "index": 0,
        "message": {
          "content": "",
          "reasoning_content": "..."
        }
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `data` | object | 解析后的题目 |
| `data.word` | string | 请求的单词 |
| `data.questions` | array | 题目列表（通常为 3 题） |
| `data.questions[].en` | string | 包含目标单词的英文句子 |
| `data.questions[].zh` | string | 对应中文翻译（可含意译） |
| `raw` | object | DeepSeek 原始响应（字段可能多于下方列出的） |
| `raw.id` | string | 请求 ID |
| `raw.choices[].message.content` | string | 已清空为 `""`（题目见 `data`） |
| `raw.choices[].message.reasoning_content` | string | 模型思考过程 |

### 错误响应

见[通用错误](#通用错误)。另：非 `GET` → `404`。

### 示例

```bash
curl \
  "http://localhost:8000/e2c?word=self-aware"
```

---

## `GET /e2c-multi`

接收恰好 3 个英文单词，为每个单词各生成 1 道「英译中」题目（含英文原句与中文参考翻译）。

### Query

| 参数   | 类型   | 必填 | 说明                         |
| ------ | ------ | ---- | ---------------------------- |
| `word` | string | 是   | 重复传 3 次；每个值须为有效单词 |

### 成功响应

- **状态码** `200`
- **Content-Type** `application/json`

```json
{
  "data": {
    "questions": [
      {
        "word": "lash",
        "en": "Poverty lashes at the body, but ignorance lashes at the soul.",
        "zh": "贫穷鞭打身体，但无知鞭打灵魂。"
      },
      {
        "word": "proficient",
        "en": "...",
        "zh": "..."
      },
      {
        "word": "self-aware",
        "en": "...",
        "zh": "..."
      }
    ]
  },
  "raw": {
    "id": "...",
    "choices": [
      {
        "index": 0,
        "message": {
          "content": "",
          "reasoning_content": "..."
        }
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `data` | object | 解析后的题目 |
| `data.questions` | array | 恰好 3 题，顺序与请求单词一致 |
| `data.questions[].word` | string | 该题对应的单词 |
| `data.questions[].en` | string | 包含目标单词的英文句子 |
| `data.questions[].zh` | string | 对应中文翻译（可含意译） |
| `raw` | object | DeepSeek 原始响应 |
| `raw.choices[].message.content` | string | 已清空为 `""`（题目见 `data`） |
| `raw.choices[].message.reasoning_content` | string | 模型思考过程 |

### 错误响应

见[通用错误](#通用错误)。`word` 不是恰好 3 个有效值 → `400`。非 `GET` → `404`。

### 示例

```bash
curl \
  "http://localhost:8000/e2c-multi?word=lash&word=proficient&word=self-aware"
```

---

## `GET /mnemonic`

根据英文单词生成简短助记文本。成功时直接返回 DeepSeek 原始响应 JSON（不套 `{ data, raw }`）。

### Query

| 参数   | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| `word` | string | 是   | 目标英文单词 |

### 成功响应

- **状态码** `200`
- **Content-Type** `application/json`

助记正文在 `choices[0].message.content`（纯文本，非 JSON/Markdown）。内容大致如下：

```text
unanimous 源自拉丁语：unus（一个）+ animus（心灵），即"万众一心"，所以表示"一致同意的"。记住 animal 里的 anim 也是"生命、心灵"的词根，un + anim + ous = 一个心思的。
```

若模型找不到合适助记，`content` 会是固定文案 `没有找到合适的助记内容`（见 `const.ts` 的 `NO_SUITABLE_MNEMONIC_CONTENT_ERROR`）。

### 错误响应

见[通用错误](#通用错误)。非 `GET` → `404`。

### 示例

```bash
curl \
  "http://localhost:8000/mnemonic?word=unanimous"
```

---

## `GET /mnemonic-j`

根据英文单词生成**结构化**助记 JSON（词源、变体、谐音等）。响应格式与 `/e2c` 相同：`{ data, raw }`。

### Query

| 参数   | 类型   | 必填 | 说明         |
| ------ | ------ | ---- | ------------ |
| `word` | string | 是   | 目标英文单词 |

### 成功响应

- **状态码** `200`
- **Content-Type** `application/json`

```json
{
  "data": {
    "etymology": {
      "components": [
        "`un-` 源自拉丁语 `unus`，意为「一」；同根 `uni-`，见于 `unit`「单位」，`unify`「统一」，`unite`「联合」。",
        "`anim-` 拉丁语本义「呼吸」；常见词 `animal` 即「有呼吸的」→ 动物；由此引申出 `animus`「精神/心」。",
        "`-ous` 形容词后缀。"
      ],
      "explanation": "`un-`「一」+ `anim-`「心/精神」+ `-ous`「形容词后缀」→ 一条心的 → 全体一致的。"
    },
    "variant": null,
    "homophonic": null,
    "abbreviation": null,
    "meme": null,
    "other": null,
    "all_in_one": "unus(一，见 unit) + anim-(呼吸，见 animal；引申为精神/心) + -ous(形容词后缀) → 一条心 → unanimous = 全体一致的。"
  },
  "raw": {
    "id": "...",
    "choices": [
      {
        "index": 0,
        "message": {
          "content": "",
          "reasoning_content": "..."
        }
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `data` | object \| null 字段 | 解析后的结构化助记；各角度无内容时为 `null` |
| `data.etymology` | object \| null | 词源/词根/词缀 |
| `data.etymology.components` | string[] | 构词部件说明（至少 1 项） |
| `data.etymology.explanation` | string | 构词推导说明 |
| `data.variant` | string \| null | 更常见的变体提示 |
| `data.homophonic` | object \| null | 谐音/联想 |
| `data.homophonic.list` | string[] | 1–3 组谐音 |
| `data.homophonic.best` | int | 最佳项下标（0–2） |
| `data.abbreviation` | string \| null | 相关常见缩写 |
| `data.meme` | string \| null | 经典台词/歌词/流行语等 |
| `data.other` | string \| null | 其他合适角度 |
| `data.all_in_one` | string \| null | 整合后的一句简短助记 |
| `raw` | object | DeepSeek 原始响应 |
| `raw.choices[].message.content` | string | 已清空为 `""`（内容见 `data`） |
| `raw.choices[].message.reasoning_content` | string | 模型思考过程 |

### 错误响应

见[通用错误](#通用错误)。非 `GET` → `404`。

### 示例

```bash
curl \
  "http://localhost:8000/mnemonic-j?word=unanimous"
```
