import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { GameManager } from './game/GameManager';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const gameManager = new GameManager(io);

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    gameManager.setupSocket(socket);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
