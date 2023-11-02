import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws: WebSocket) {
  ws.on('error', console.error);

  ws.send(`connection established`)

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    ws.send(`server received: ${data}`);
  });

});