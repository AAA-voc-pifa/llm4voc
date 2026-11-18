// deno run -A --env-file=.env ./test/llm/mnemonic.ts

import { mnemonic } from '../../llm/mnemonic.ts'

const [ok, result] = await mnemonic('multiple', {
	model: 'deepseek-v4-pro',
	thinking: 'high',
})
if (ok)
	console.log(result.choices[0].message.content)

console.log(result)
