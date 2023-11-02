import WebSocket, { WebSocketServer } from 'ws'
import { ulid } from 'ulid'

const port = 8080

const wss = new WebSocketServer({ port })

const max_score = 20
const max_vote_by_user = 2
const vote_list: string[] = []
const connections: string[] = []

wss.on('listening', () => console.log(`listening on port ${port}`))
wss.on('connection', function connection(ws: WebSocket) {
  ws['id'] = ulid()
  console.log(`connected: ${ws.id}`)
  connections.push(ws.id)
  ws.send(`code:${ws.id}`)

  ws.on('error', console.error)
  ws.on('close', function close() {
    console.log(`disconnected: ${ws.id}`)
    connections.splice(connections.indexOf(ws.id), 1)
  })

  ws.on('message', function message(data) {
    if (ws.id && connections.includes(ws.id)) {
      if (data == ws.id) {
        if (vote_list.filter(id => id == ws.id).length < max_vote_by_user && vote_list.length < max_score) {
          vote_list.push(ws.id)
          console.log(`vote: ${ws.id}`)
          console.log(`score: ${vote_list.length}`)
          ws.send(`score: ${vote_list.length}`)
        }
      }
      if (data == 'reset') {
        vote_list.length = 0
        console.log(`reset`)
      }
    } else {
      console.log(`illegal connection`)
      ws.disconnect()
    }
  })

})