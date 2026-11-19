import {
	simple_serve,
	http_route,
	respond_json,
	bad_request,
	unknown_error,
	type HttpCTX,
	type HttpHandler,
	type HttpMethod,
} from '@ppz/simple-api'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { NOT_EN_WORD_ERROR_BY_LLM } from '../const.ts'
import { e2c } from '../llm/e2c/single.ts'
import { e2c_multi } from '../llm/e2c/multi.ts'
import { mnemonic } from '../llm/mnemonic.ts'
import { http_password } from '../env.ts'

const word_re = /^[A-Za-z]+(-[A-Za-z]+)*$/

const word_query = zfd.formData({
	word: zfd.text(z.string().regex(word_re)),
})

const words_query = zfd.formData({
	word: zfd
		.repeatableOfType(zfd.text(z.string().regex(word_re)))
		.pipe(z.tuple([z.string(), z.string(), z.string()])),
})

const auth_route = (method: HttpMethod, path: string, handler: HttpHandler) =>
	http_route(method, path, async ctx => {
		if (ctx.req.headers.get('password') !== http_password)
			throw new Response('password incorrect', { status: 401 })
		return await handler(ctx)
	})

async function handle_e2c(ctx: HttpCTX) {
	const { word } = ctx.parse_query(word_query)
	const [ok, result] = await e2c(word, {
		model: 'deepseek-flash',
		thinking: 'high',
	})
	if (!ok) {
		ctx.log.error(result)
		throw unknown_error()
	}
	if (result.data === NOT_EN_WORD_ERROR_BY_LLM)
		throw bad_request()
	return respond_json(result)
}

async function handle_e2c_multi(ctx: HttpCTX) {
	const { word: words } = ctx.parse_query(words_query)
	const [ok, result] = await e2c_multi(words, {
		model: 'deepseek-v4-pro',
		thinking: 'max',
	})
	if (!ok) {
		ctx.log.error(result)
		throw unknown_error()
	}
	if (result.data === NOT_EN_WORD_ERROR_BY_LLM)
		throw bad_request()
	return respond_json(result)
}

async function handle_mnemonic(ctx: HttpCTX) {
	const { word } = ctx.parse_query(word_query)
	const [ok, result] = await mnemonic(word, {
		model: 'deepseek-flash',
		thinking: 'high',
	})
	if (!ok) {
		ctx.log.error('mnemonic 失败:', word, result)
		throw unknown_error()
	}
	if (result.choices[0]?.message.content === NOT_EN_WORD_ERROR_BY_LLM)
		throw bad_request()
	return respond_json(result)
}

export
const http_handler = simple_serve({
	routes: [
		auth_route('GET', '/e2c', handle_e2c),
		auth_route('GET', '/e2c-multi', handle_e2c_multi),
		auth_route('GET', '/mnemonic', handle_mnemonic),
	],
})
