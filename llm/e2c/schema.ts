import { z } from '@zod/zod'
import { NOT_EN_WORD_ERROR_BY_LLM } from '../../const.ts'
import type { DeepSeekResponseData } from '../deepseek.ts'

export
const sentence_schema = z.object({
	en: z.string().min(1),
	zh: z.string().min(1),
})

export
type E2CSentence = z.infer<typeof sentence_schema>

export
type E2CResult<T> = [false, string] | [true, {
	data: T | typeof NOT_EN_WORD_ERROR_BY_LLM
	raw: DeepSeekResponseData
}]

export
function parse_e2c_json<T>(
	label: string,
	result: DeepSeekResponseData,
	schema: z.ZodType<T>,
): E2CResult<T> {
	const content = result.choices?.[0]?.message?.content
	if (typeof content !== 'string') {
		const msg = `生成 ${label} - 响应缺少 content`
		console.error(msg)
		console.error(result)
		return [false, msg]
	}

	const text = content.trim()
	if (text === '') {
		const msg = `生成 ${label} - content 为空`
		console.error(msg)
		console.error(result)
		return [false, msg]
	}

	if (text === NOT_EN_WORD_ERROR_BY_LLM) {
		console.warn(`生成 ${label} - LLM 判定非英文单词`)
		result.choices[0].message.content = ''
		return [true, {
			data: NOT_EN_WORD_ERROR_BY_LLM,
			raw: result,
		}]
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(text)
	} catch (err) {
		console.error(`生成 ${label} - JSON.parse 失败:`)
		console.error(err)
		console.error(text)
		return [false, `生成 ${label} - JSON.parse 失败: \n` + text]
	}

	const data = schema.safeParse(parsed)
	if (!data.success) {
		console.error(`生成 ${label} - 解析失败:`)
		console.error(data.error)
		return [false, `生成 ${label} - 解析失败: \n` + text]
	}
	result.choices[0].message.content = ''
	return [true, {
		data: data.data,
		raw: result,
	}]
}
