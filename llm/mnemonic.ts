import { NOT_EN_WORD_ERROR_BY_LLM, NO_SUITABLE_MNEMONIC_CONTENT_ERROR } from '../const.ts'
import { deepseek, type DeepSeekOpts, type DeepSeekResponseData } from './deepseek.ts'

const prompt = {
	sys: '你是一个专为英语学习者打造的词汇助记引擎。请为输入的英文单词生成简短、精准的助记文本内容。\n'
		+ '你可以从以下角度生成内容:\n'
		+ '+ 词源、词根、词缀、构词\n'
		+ '+ 更常见的变体，如用户学习 belief 时，believe 这个更常见的单词可以让用户有熟悉的感觉；再如 succeed/success\n'
		+ '+ 谐音、联想\n'
		+ '+ 单词属于某个常见英文缩写，如用户学习 chief 时，可以提示他 "CEO 是 Chief Executive Officer 的缩写"\n'
		+ '+ 非常经典的、在中文社区也有一定知名度的电影台词、歌词、流行语、烂梗\n'
		+ '+ 其他你觉得合适的角度\n\n\n'

		+ '注意：\n'
		+ '+ 输出的结果不需要寒暄\n'
		+ '+ 如果该单词没有公认、明确的词根、词源，切勿编造\n'
		+ '+ 上面提到的角度不需要你面面俱到，那只是你思考问题的出发点。'
			+ '如果一个单词没有合适的谐音联想，就不输出谐音联想；如果没有非常经典的烂梗，就不需要。宁缺毋滥！'
			+ `如果你想不出合适的内容，就直接输出 "${NO_SUITABLE_MNEMONIC_CONTENT_ERROR}"，不包含双引号，也不要其他标点符号\n`
		+ '+ 输出的内容应简短，用户两三眼就能看明白，除非你觉得有必要，否则禁止输出过长内容\n'
		+ '+ 输出纯文本即可，不要输出 json、markdown 格式\n'
		+ `+ 如果用户输入的内容不是英文单词，直接输出 "${NOT_EN_WORD_ERROR_BY_LLM}"，不包含双引号，也不要其他标点符号\n`
	,
	user: (word: string) => `单词: ${word}`,
}

export
type MnemonicResult = [false, string] | [true, DeepSeekResponseData]

export
async function mnemonic(word: string, ds_opts?: DeepSeekOpts): Promise<MnemonicResult> {
	console.log('生成 mnemonic...', word)
	const [ok, result] = await deepseek([
		{ role: 'system', content: prompt.sys },
		{ role: 'user', content: prompt.user(word) },
	], ds_opts)
	if (!ok) {
		const msg = '生成 mnemonic - 调用失败: ' + result
		console.error(msg)
		return [false, msg]
	}

	const content = result.choices?.[0]?.message?.content
	if (typeof content !== 'string') {
		const msg = '生成 mnemonic - 响应缺少 content'
		console.error(msg)
		console.error(result)
		return [false, msg]
	}

	const text = content.trim()
	if (text === '') {
		const msg = '生成 mnemonic - content 为空'
		console.error(msg)
		console.error(result)
		return [false, msg]
	}

	result.choices[0].message.content = text

	if (text === NOT_EN_WORD_ERROR_BY_LLM)
		console.warn('生成 mnemonic - LLM 判定非英文单词:', word)
	else if (text === NO_SUITABLE_MNEMONIC_CONTENT_ERROR)
		console.warn('生成 mnemonic - 无合适助记内容:', word)
	else
		console.log('生成 mnemonic - 完成:', word)

	return [true, result]
}
