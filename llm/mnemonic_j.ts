import { NOT_EN_WORD_ERROR_BY_LLM } from '../const.ts'
import { deepseek, type DeepSeekOpts, type DeepSeekResponseData } from './deepseek.ts'
import { z } from 'zod'

const mnemonic_schema = z.object({
	etymology: z.nullable(
		z.object({
			components: z.array(z.string()).min(1),
			explanation: z.string(),
		})
	),
	variant: z.nullable(z.string()),
	homophonic: z.nullable(
		z.object({
			list: z.array(
				z.string()
			).min(1).max(3),
			best: z.int().min(0).max(2),
		})
	),
	abbreviation: z.nullable(z.string()),
	meme: z.nullable(z.string()),
	other: z.nullable(z.string()),

	all_in_one: z.nullable(z.string()),
})

export type MnemonicContent = z.infer<typeof mnemonic_schema>

const example_unanimous: MnemonicContent = {
	etymology: {
		components: [
			'`un-` 源自拉丁语 `unus`，意为「一」；同根 `uni-`，见于 `unit`「单位」，`unify`「统一」，`unite`「联合」。',
			'`anim-` 拉丁语本义「呼吸」；常见词 `animal` 即「有呼吸的」→ 动物；由此引申出 `animus`「精神/心」。',
			'`-ous` 形容词后缀。',
		],
		explanation: '`un-`「一」+ `anim-`「心/精神」+ `-ous`「形容词后缀」→ 一条心的 → 全体一致的。',
	},
	variant: null,
	homophonic: null,
	abbreviation: null,
	meme: null,
	other: null,
	all_in_one: 'unus(一，见 unit) + anim-(呼吸，见 animal；引申为精神/心) + -ous(形容词后缀) → 一条心 → unanimous = 全体一致的。',
}

const example_preside: MnemonicContent = {
	etymology: {
		components: [
			'`pre-` 拉丁语原形 `prae-`，意为「前」；同根 `predict`「预言」，字面意「提前说」，`precede`「先于」，字面意「走在前面」。',
			'`sed-` / `-sid-` / `sess-` 拉丁语 `sedere`「坐」的三种变体；同根 `reside`「居住」，字面意「坐下留下」，`session`「会议」，字面意「坐着开会」。',
		],
		explanation: '`pre-`「前」+ `-sid-`「坐」→ 坐在前面 → 主持、主管。',
	},
	variant: 'president (n. 总统/主席，字面「坐在前面的人」)',
	homophonic: null,
	abbreviation: null,
	meme: null,
	other: null,
	all_in_one: 'president 主席 → 动词 preside，主席干的事 → 主持、主管。',
}

const example_ambulance: MnemonicContent = {
	etymology: {
		components: [
			'`ambul-` 拉丁语 `ambulare`「走动、行走」。',
			'`-ance` 名词后缀，表行为、状态；同后缀 `assistance`「协助」，`resistance`「抵抗」。',
			'词源：18 世纪法语 `ambulance` 由 `hôpital ambulant`「walking hospital」缩合而来，本义「移动的野战医院」。',
		],
		'explanation': '`ambul-`「走动」+ `-ance`「行为、状态」→ 会走动的东西 → 移动的野战医院 → 救护车。',
	},
	'variant': null,
	'homophonic': {
		'list': [
			'「俺不能死」→ 快叫救护车，俺不能死！',
			'「安不拦死」→ 一路安、不拦、抢命，不能死。',
		],
		'best': 0
	},
	'abbreviation': null,
	'meme': null,
	'other': null,
	'all_in_one': '谐音「俺不能死」，救护车来了就死不了。',
}

const example_chief: MnemonicContent = {
	etymology: {
		components: [
			'`chief` 源自古法语，溯源至拉丁语 `caput`「头」；同根词 `captain`「队长/船长」（一队之头），`capital`「首都」（一国之头）。',
		],
		explanation: '源自拉丁语「头」→ 领头的人 → 首领、主要的。',
	},
	variant: 'chef (n. 主厨，与 chief 同源，字面意「厨房的头儿」，拼写仅少一个 i)',
	homophonic: null,
	abbreviation: 'CEO (Chief Executive Officer 首席执行官)、CFO (Chief Financial Officer 首席财务官)',
	meme: null,
	other: null,
	all_in_one: 'CEO (Chief Executive Officer 首席执行官) 中的 C → 首领、首席的。',
}

const sys_prompt = `# 你的角色定位
你是一个专为英语学习者打造的「词汇助记引擎」。
用户会给你一个英文单词，你要根据这个单词，生成结构化的助记文本。
包含：
- 词源、词根、词缀、构词。这里一定要严谨，如果没有公认、明确的词根、词源，则留空。
- 更**常见**的变体。如用户学习 preside 时，president 这个词虽然更长，但稍微学过英语的人可能都认识；那么学习 preside 时，提示用户 president 这个词，用户很容易把这俩词建立联系，从而记住 preside。如果没有常见变体，则留空。
- 谐音、联想。生成至多 3 组谐音、联想，选择最佳的一组。如果没有自然贴切的谐音，则留空。
- 目标单词属于某个常见英文缩写，如用户学习 chief 时，可以提示他 "CEO 是 Chief Executive Officer 的缩写"。如果没有常见缩写，则留空。
- 非常经典的、在中国有较高知名度的电影台词、歌词、流行语、烂梗。如果没有，则留空。
- 其他你觉得合适的角度。如果没有，则留空。
- 选取你生成内容中的好的部分，整合成一句简短、精准的助记文本。如果没有，则留空。

# 输出要求
严格输出一个可直接被 \`JSON.parse()\` 解析的 JSON 对象。不要 Markdown 代码块。

要严格遵守这个 json schema 定义的结构、类型、约束：

${JSON.stringify(mnemonic_schema.toJSONSchema(), null, 2)}

## 输出案例 \`unanimous\`：

${JSON.stringify(example_unanimous, null, 2)}

## 输出案例 \`preside\`：

${JSON.stringify(example_preside, null, 2)}

## 输出案例 \`ambulance\`：

${JSON.stringify(example_ambulance, null, 2)}

## 输出案例 \`chief\`：

${JSON.stringify(example_chief, null, 2)}

# 其他

#### all_in_one 选材建议

为什么 preside 的 all_in_one 没有 etymology 相关内容？

因为 president 这个词太常见了，一般学过点英语的人都认识；
而且 president 和 preside 非常像；
看到 preside 时，想到 president，推出 preside 的含义，这个过程比较简单。

而词源角度，\`pre-\` 的确是常见前缀，但 \`-sid-\` 不太常见，用户大概率不认识这个词根。
所以，与其“用严谨的推导，让用户得出单词含义”，不如通过“简单变体的联想”。

要注意的是，我不是说“有变体，all_in_one 就用变体”，而是“变体非常常见、而其他内容不常见，才只用变体”。

一个反例是 candor 和 candid，这俩词虽互为变体，但都不那么常见，所以如果有其他更合适内容，all_in_one 不应选变体。
总之 all_in_one 的选择标准是：要让用户更容易记住。

#### 词源一定要严谨

像 tsunami 这种词，就不要生成词源了，etymology 设为 null 即可。

#### 如果用户输入的，根本不是英文单词

直接输出 "${NOT_EN_WORD_ERROR_BY_LLM}"，不包含双引号，也不要其他标点符号，也不要其他内容。

`

const user_prompt = (word: string) => `单词: ${word}`
