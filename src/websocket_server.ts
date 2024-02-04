import WebSocket, { WebSocketServer } from 'ws'
import { ulid } from 'ulid'

export type KinchanWSSConfig = {
  // WebSocketサーバーのポート番号
  port: number

  // 1人が投票できる最大投票数
  max_vote_by_user: number
}

export class KinchanWSS {
  static run({ port, max_vote_by_user }: KinchanWSSConfig) {
    const wss = new WebSocketServer({ port })

    // コネクション型
    type Connection = {
      id: string
      ws: WebSocket
    }

    // 最大の得点
    const max_score = 20

    // 投票リスト
    const vote_list: string[] = []

    // コネクションリスト
    const connection_list: Connection[] = []

    // スコアボードクライアントのID
    let scoreboard_id: string = ''

    // wsからidを取得するための関数
    function get_conn_id(ws: WebSocket): string | undefined {
      const conn = connection_list.find(conn => conn.ws === ws)
      if (conn) {
        return conn.id
      }
    }

    //  IDからConnectionを取得するための関数
    function get_conn(id: string): Connection | undefined {
      return connection_list.find(conn => conn.id === id)
    }

    // サーバー起動時にログを出力
    wss.on('listening', () => console.log(`websocket listening on port ${port}`))

    // 接続時の処理
    wss.on('connection', function connection(ws: WebSocket) {

      // 接続時にIDを発行
      const id = ulid()

      // Connection型に変換
      const conn: Connection = {
        id,
        ws
      }

      // 接続時にログを出力
      console.log(`connected: ${id}`)

      // 接続者IDリストに追加
      connection_list.push(conn)

      // 投票に必要なIDを送信
      ws.send(`code:${id}`)

      // エラー時にログを出力
      ws.on('error', console.error)

      // 切断時にログを出力
      ws.on('close', function close(this) {
        const conn_id = get_conn_id(this)
        if (!conn_id) {
          console.log(`unknown connection disconnected`)
          return
        }
        if (scoreboard_id == conn_id) {
          console.log(`scoreboard disconnected: ${conn_id}`)
          scoreboard_id = ''
          vote_list.length = 0
        } else {
          console.log(`disconnected: ${conn_id}`)
        }
        // コネクションリストから削除
        const conn = get_conn(conn_id)
        connection_list.splice(connection_list.indexOf(conn!), 1)
      })

      // メッセージ受信時の処理
      ws.on('message', function message(this, data) {
        const conn_id = get_conn_id(this)

        // 接続者IDリストに含まれているか確認
        if (!conn_id) {
          console.log(`message from unknown connection ignored`)
          this.close()
          return
        }

        // スコアボードIDを設定\
        if (data.toString() == 'scoreboard') {
          scoreboard_id = conn_id
          console.log(`scoreboard: ${conn_id}`)
        }

        // 投票処理 スコアボードIDが指定されていない場合は投票できない。また、スコアボードからは投票できない。
        else if (data.toString() == conn_id && scoreboard_id != '' && scoreboard_id != conn_id) {
          // 投票リストに含まれていないか確認しつつ、投票リストの長さが最大得点に達していないか確認
          if (vote_list.filter(id => id == get_conn_id(this)).length < max_vote_by_user && vote_list.length < max_score) {
            // 投票リストに追加
            vote_list.push(conn_id)
            console.log(`vote: ${conn_id}`)
            console.log(`score: ${vote_list.length}`)
            // ブロードキャストメッセージを送信
            wss.clients.forEach(function each(client: { readyState: any; send: (arg0: string) => void }) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(`increment`)
              }
            })
          }
        }

        // 投票リストをリセット
        else if (data.toString() == 'reset') {
          vote_list.length = 0
          console.log(`reset`)
          // スコアボードにresetを送る
          wss.clients.forEach(function each(client: { readyState: any; send: (arg0: string) => void }) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(`reset`)
            }
          })
        }
      })

    })
  }
}