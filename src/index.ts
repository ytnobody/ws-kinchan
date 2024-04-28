import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { KinchanWSS } from './websocket_server'

// Staticサーバーを起動
const port = 8000
const hono = new Hono()
hono.use('/*', serveStatic({ root: './static'}))
console.log(`static server listening on port ${port}`)
serve({
  fetch: hono.fetch,
  port: port,
})

// WebSocketサーバーを起動
KinchanWSS.run({
  port: 8080,
  max_vote_by_user: 10
})