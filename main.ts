import { http_handler } from './web/handler.ts'

Deno.serve({
	port: 80,
}, http_handler)
