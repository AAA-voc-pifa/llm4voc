import { http_handler } from './web/handler.ts'

Deno.serve({
	port: read_env_port(),
}, http_handler)

function read_env_port() {
	const port = Deno.env.get('PORT')
	if (port === undefined)
		return 8000
	const p = Number(port)
	if (!Number.isInteger(p) || p < 1 || p > 65535)
		throw new Error(`PORT(${port}) is not a valid port`)
	return p
}
