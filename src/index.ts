import WebSocket, { WebSocketServer } from 'ws'
import { ulid } from 'ulid'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

const port = 8080
const wss = new WebSocketServer({ port })

const static_port = 8000
const hono = new Hono()
hono.use('/*', serveStatic({ root: './static' }))
console.log(`static server listening on port ${static_port}`)
serve({
  fetch: hono.fetch,
  port: static_port,
})

// 最大の得点
const max_score = 20

// 1人が投票できる最大数
const max_vote_by_user = 20

// 投票リスト
const vote_list: string[] = []

// 接続者IDリスト
const connections: string[] = []

// コネクションリスト
const connection_list: WebSocket[] = []

// スコアボードクライアントのID
var scoreboard_id: string = ''

// サーバー起動時にログを出力
wss.on('listening', () => console.log(`websocket listening on port ${port}`))

// 接続時の処理
wss.on('connection', function connection(ws: WebSocket) {

  // 接続時にIDを発行
  ws['id'] = ulid()

  // 接続時にログを出力
  console.log(`connected: ${ws.id}`)

  // 接続者IDリストに追加
  connections.push(ws.id)

  // 投票に必要なIDを送信
  ws.send(`code:${ws.id}`)

  // エラー時にログを出力
  ws.on('error', console.error)

  // 切断時にログを出力
  ws.on('close', function close() {
    if (scoreboard_id == ws.id) {
      console.log(`scoreboard disconnected: ${ws.id}`)
      scoreboard_id = ''
      vote_list.length = 0
    } else {
      console.log(`disconnected: ${ws.id}`)
    }
    connections.splice(connections.indexOf(ws.id), 1)
    connection_list.splice(connection_list.indexOf(ws), 1)
  })

  // メッセージ受信時の処理
  ws.on('message', function message(data) {

    // 接続者IDリストに含まれているか確認
    if (ws.id && connections.includes(ws.id)) {
      // スコアボードIDを設定\
      if (data == 'scoreboard') {
        scoreboard_id = ws.id
        console.log(`scoreboard: ${ws.id}`)
      }

      // 投票処理 スコアボードIDが指定されていない場合は投票できない。また、スコアボードからは投票できない。
      else if (data == ws.id && scoreboard_id != '' && scoreboard_id != ws.id) {
        // 投票リストに含まれていないか確認しつつ、投票リストの長さが最大得点に達していないか確認
        if (vote_list.filter(id => id == ws.id).length < max_vote_by_user && vote_list.length < max_score) {
          // 投票リストに追加
          vote_list.push(ws.id)
          console.log(`vote: ${ws.id}`)
          console.log(`score: ${vote_list.length}`)
          // ブロードキャストメッセージを送信
          wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(`increment`)
            }
          })
        }
      }

      // 投票リストをリセット
      else if (data == 'reset') {
        vote_list.length = 0
        console.log(`reset`)
        // スコアボードにresetを送る
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN && client.id == scoreboard_id) {
            client.send(`reset`)
          }
        })
      }

    } else {
      // IDが含まれていない場合は切断
      console.log(`illegal connection`)
      ws.disconnect()
    }
  })

})