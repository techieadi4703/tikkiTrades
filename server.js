import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { Server } from 'socket.io';
import RedisStore from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: dev
    ? {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    : undefined,
});

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Setup Pino HTTP Logger for response times and request IDs
  server.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    })
  );

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  });

  // Apply rate limiter to all /api/ routes
  server.use('/api', limiter);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'A client connected via WebSocket');

    socket.on('subscribe:stock', (symbol) => {
      socket.join(`stock:${symbol}`);
      logger.info({ socketId: socket.id, room: `stock:${symbol}` }, 'Client subscribed to stock');
    });

    socket.on('unsubscribe:stock', (symbol) => {
      socket.leave(`stock:${symbol}`);
    });

    socket.on('subscribe:portfolio', (userId) => {
      socket.join(`portfolio:${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  // Attach socket.io to the global object so Server Actions/API Routes can access it (optional)
  global.io = io;

  server.use((req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    logger.info(`> Ready on http://localhost:${PORT}`);
  });
});
