import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { ENV } from './server/config/env';
import apiRouter from './server/routes/api';
import { errorHandler } from './server/middleware/error';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic request logging in dev
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[CareGrid API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'CareGrid',
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Mount Core API routes FIRST
  app.use('/api', apiRouter);

  // Central error handler for API errors
  app.use(errorHandler);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================`);
    console.log(`CareGrid Server running at http://0.0.0.0:${PORT}`);
    console.log(`Port 3000 actively bound for Cloud Run reverse proxy.`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal failure launching CareGrid server:', err);
  process.exit(1);
});
