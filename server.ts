import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { academyApiMiddleware } from './server/apiPlugin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Parse JSON and urlencoded payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API middleware first so all /api/* requests are processed by the academy backend
  app.use(academyApiMiddleware);

  // Serve static assets from public folder (logos, favicons, attachments)
  const publicPath = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (!isProd) {
    // Development mode: attach Vite dev server middleware without HMR websocket (HMR disabled in AI Studio)
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
        }
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // Fallback if dist hasn't been built yet
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[CASTINDO CFA] Server running on http://0.0.0.0:${PORT} (${
        isProd ? 'production' : 'development'
      })`
    );
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[CASTINDO CFA] Port ${PORT} temporarily in use, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('[CASTINDO CFA] Server error:', err);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('[CASTINDO CFA] Fatal error during server startup:', err);
  process.exit(1);
});
