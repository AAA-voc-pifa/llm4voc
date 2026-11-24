import {
	simple_serve,
	http_route,
	respond_json,
	bad_request,
	unknown_error,
	type HttpCTX,
} from '@ppz/simple-api'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { NOT_EN_WORD_ERROR_BY_LLM } from '../const.ts'
import { e2c } from '../llm/e2c/single.ts'
import { e2c_multi } from '../llm/e2c/multi.ts'
import { mnemonic } from '../llm/mnemonic.ts'
import { mnemonic_j } from '../llm/mnemonic_j.ts'

const word_re = /^[A-Za-z]+(-[A-Za-z]+)*$/

const word_query = zfd.formData({
	word: zfd.text(z.string().regex(word_re)),
})

const words_query = zfd.formData({
	word: zfd
		.repeatableOfType(zfd.text(z.string().regex(word_re)))
		.pipe(z.tuple([z.string(), z.string(), z.string()])),
})

async function handle_e2c(ctx: HttpCTX) {
	const { word } = ctx.parse_query(word_query)
	const [ok, result] = await e2c(word, {
		model: 'deepseek-flash',
		thinking: 'high',
	})
	if (!ok)
		return unknown_error()
	if (result.data === NOT_EN_WORD_ERROR_BY_LLM)
		return bad_request()
	return respond_json(result)
}

async function handle_e2c_multi(ctx: HttpCTX) {
	const { word: words } = ctx.parse_query(words_query)
	const [ok, result] = await e2c_multi(words, {
		model: 'deepseek-v4-pro',
		thinking: 'max',
	})
	if (!ok)
		return unknown_error()
	if (result.data === NOT_EN_WORD_ERROR_BY_LLM)
		return bad_request()
	return respond_json(result)
}

async function handle_mnemonic(ctx: HttpCTX) {
	const { word } = ctx.parse_query(word_query)
	const [ok, result] = await mnemonic(word, {
		model: 'deepseek-flash',
		thinking: 'high',
	})
	if (!ok)
		return unknown_error()
	if (result.choices[0]?.message.content === NOT_EN_WORD_ERROR_BY_LLM)
		return bad_request()
	return respond_json(result)
}

async function handle_mnemonic_j(ctx: HttpCTX) {
	const { word } = ctx.parse_query(word_query)
	const [ok, result] = await mnemonic_j(word, {
		model: 'deepseek-v4-pro',
		thinking: 'max',
	})
	if (!ok)
		return unknown_error()
	if (result.data === NOT_EN_WORD_ERROR_BY_LLM)
		return bad_request()
	return respond_json(result)
}

export
const http_handler = simple_serve({
	routes: [
		http_route('GET', '/e2c', handle_e2c),
		http_route('GET', '/e2c-multi', handle_e2c_multi),
		http_route('GET', '/mnemonic', handle_mnemonic),
		http_route('GET', '/mnemonic-j', handle_mnemonic_j),
	],
})
