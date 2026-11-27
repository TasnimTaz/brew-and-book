const { createServer } = require('http');
const os = require('os');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  global.__brewBookIO = io;

  io.on('connection', (socket) => {
    socket.on('join-slot', ({ date, slotId }) => {
      if (date && slotId) socket.join(`slot:${date}:${slotId}`);
    });
    socket.on('leave-slot', ({ date, slotId }) => {
      if (date && slotId) socket.leave(`slot:${date}:${slotId}`);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log('> Brew & Book ready');
    console.log(`  - Local:   http://localhost:${port}`);
    const nets = os.networkInterfaces();
    const seen = new Set();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !seen.has(net.address)) {
          seen.add(net.address);
          console.log(`  - Network: http://${net.address}:${port} (${name})`);
        }
      }
    }
    if (seen.size === 0) {
      console.log('  - Network: use your machine IP on the same Wi-Fi/LAN');
    }
  });
});
