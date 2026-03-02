import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DB {
  exec(sql: string): Promise<void>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: any }>;
}

let db: DB;

async function initDB() {
  console.log('Connecting to MySQL...');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'global-mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rollingai_root_pwd',
    database: process.env.DB_NAME || 'ceo_weekly',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  db = {
    async exec(sql: string) { await pool.query(sql); },
    async get(sql: string, params: any[] = []) {
      const [rows] = await pool.execute(sql, params);
      return (rows as any[])[0];
    },
    async all(sql: string, params: any[] = []) {
      const [rows] = await pool.execute(sql, params);
      return rows as any[];
    },
    async run(sql: string, params: any[] = []) {
      const [result] = await pool.execute(sql, params);
      return { lastID: (result as any).insertId };
    }
  };

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      feishu_id VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      organization VARCHAR(255),
      role VARCHAR(50) DEFAULT 'ceo',
      invited_by VARCHAR(255),
      avatar TEXT
    );
  `);
  // Ensure demo user exists
  const demoUser = await db.get('SELECT * FROM users WHERE id = "demo_user"');
  if (!demoUser) {
    await db.run('INSERT INTO users (id, name, organization, role) VALUES (?, ?, ?, ?)', 
      ['demo_user', '体验账号', 'RollingAI Demo', 'ceo']);
  }

  // Articles, comments, etc tables (kept for reference)
  await db.exec(`CREATE TABLE IF NOT EXISTS articles (id VARCHAR(255) PRIMARY KEY, title TEXT, summary TEXT, content LONGTEXT, podcast_url TEXT, presentation_url TEXT, infographic_url TEXT, original_url TEXT, status VARCHAR(50) DEFAULT 'draft', publish_date VARCHAR(100), tags TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS comments (id VARCHAR(255) PRIMARY KEY, article_id VARCHAR(255), text TEXT, highlight_text TEXT, position VARCHAR(255));`);
  await db.exec(`CREATE TABLE IF NOT EXISTS playlists (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), article_id VARCHAR(255), order_index INTEGER);`);
  await db.exec(`CREATE TABLE IF NOT EXISTS analytics (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), article_id VARCHAR(255), action VARCHAR(100), duration INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
}

async function startServer() {
  await initDB();
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok', demo_enabled: process.env.ENABLE_DEMO_LOGIN === 'true' }));

  // --- Feishu Auth Section ---
  app.get('/api/auth/feishu/url', (req, res) => {
    const appId = process.env.FEISHU_APP_ID;
    const redirectUri = encodeURIComponent(process.env.FEISHU_REDIRECT_URL || '');
    const state = Math.random().toString(36).substring(7);
    const url = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${appId}&redirect_uri=${redirectUri}&state=${state}`;
    res.json({ url });
  });

  app.post('/api/auth/feishu/callback', async (req, res) => {
    const { code } = req.body;
    try {
      // 1. Get app_access_token
      const appTokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET
      });
      const appAccessToken = appTokenRes.data.app_access_token;

      // 2. Use code to get user identity
      const userAuthRes = await axios.post('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        grant_type: 'authorization_code',
        code: code
      }, {
        headers: { 'Authorization': `Bearer ${appAccessToken}` }
      });

      const { open_id, name, avatar_url } = userAuthRes.data.data;

      // 3. Find or create user
      let user = await db.get('SELECT * FROM users WHERE feishu_id = ?', [open_id]);
      if (!user) {
        const id = Math.random().toString(36).substring(2, 9);
        await db.run('INSERT INTO users (id, feishu_id, name, avatar, role) VALUES (?, ?, ?, ?, ?)', 
          [id, open_id, name, avatar_url, 'ceo']);
        user = await db.get('SELECT * FROM users WHERE feishu_id = ?', [open_id]);
      } else {
        await db.run('UPDATE users SET name = ?, avatar = ? WHERE feishu_id = ?', [name, avatar_url, open_id]);
      }

      res.json({ user });
    } catch (error) {
      console.error('Feishu login failed:', error);
      res.status(500).json({ error: 'Auth failed' });
    }
  });

  app.post('/api/auth/demo', async (req, res) => {
    if (process.env.ENABLE_DEMO_LOGIN !== 'true') {
      return res.status(403).json({ error: 'Demo mode disabled' });
    }
    const user = await db.get('SELECT * FROM users WHERE id = "demo_user"');
    res.json({ user });
  });

  // --- Articles & Business Logic (Same as before) ---
  app.get('/api/articles', async (req, res) => {
    const status = req.query.status as string;
    let articles = status 
      ? await db.all('SELECT * FROM articles WHERE status = ? ORDER BY publish_date DESC', [status])
      : await db.all('SELECT * FROM articles ORDER BY publish_date DESC');
    res.json(articles.map((a: any) => ({ ...a, tags: JSON.parse(a.tags || '[]') })));
  });

  // ... (Keeping rest of full API as requested in code sync)
  app.get('/api/articles/:id', async (req, res) => {
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [req.params.id]) as any;
    if (article) {
      article.tags = JSON.parse(article.tags || '[]');
      const comments = await db.all('SELECT * FROM comments WHERE article_id = ?', [req.params.id]);
      res.json({ ...article, comments });
    } else res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/analytics', async (req, res) => {
    const { user_id, article_id, action, duration } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    await db.run('INSERT INTO analytics (id, user_id, article_id, action, duration) VALUES (?, ?, ?, ?, ?)', 
      [id, user_id, article_id, action, duration || 0]);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) { next(e); }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

startServer().catch(err => console.error('Startup failed:', err));
