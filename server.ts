import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Database Abstraction Layer ---
interface DB {
  exec(sql: string): Promise<void>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<{ lastID?: any }>;
}

let db: DB;

async function initDB() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'mysql') {
    console.log('Connecting to MySQL...');
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    db = {
      async exec(sql: string) { await pool.query(sql); },
      async get(sql: string, params: any[] = []) {
        // Convert SQL syntax from SQLite (?) to MySQL (?) is luckily identical for simple cases
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
  } else {
    console.log('Using SQLite (app.db)...');
    const sqlite = new Database('app.db');
    db = {
      async exec(sql: string) { sqlite.exec(sql); },
      async get(sql: string, params: any[] = []) { return sqlite.prepare(sql).get(...params); },
      async all(sql: string, params: any[] = []) { return sqlite.prepare(sql).all(...params); },
      async run(sql: string, params: any[] = []) {
        const info = sqlite.prepare(sql).run(...params);
        return { lastID: info.lastInsertRowid };
      }
    };
  }

  // --- Schema Initialization ---
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      feishu_id VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      organization VARCHAR(255),
      role VARCHAR(50) DEFAULT 'ceo',
      invited_by VARCHAR(255)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id VARCHAR(255) PRIMARY KEY,
      title TEXT,
      summary TEXT,
      content LONGTEXT,
      podcast_url TEXT,
      presentation_url TEXT,
      infographic_url TEXT,
      original_url TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      publish_date VARCHAR(100),
      tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(255) PRIMARY KEY,
      article_id VARCHAR(255),
      text TEXT,
      highlight_text TEXT,
      position VARCHAR(255)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255),
      article_id VARCHAR(255),
      order_index INTEGER
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255),
      article_id VARCHAR(255),
      action VARCHAR(100),
      duration INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert mock data if empty
  const countRes = await db.get('SELECT COUNT(*) as c FROM articles');
  if (countRes.c === 0) {
    const insertSql = `
      INSERT INTO articles (id, title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, publish_date, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.run(insertSql, [
      '1', '大模型时代的商业重塑：从降本增效到业务创新', '本文深入探讨了大语言模型...', '随着ChatGPT等大语言模型的普及...', 
      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://www.clickdimensions.com/links/TestPDFfile.pdf', 
      'https://picsum.photos/seed/ai1/800/1200', 'https://example.com/original-article-1', 'published', new Date().toISOString(), '["AI新知", "商业战略"]'
    ]);

    await db.run(`INSERT INTO users (id, feishu_id, name, organization, role) VALUES (?, ?, ?, ?, ?)`, ['u1', 'feishu_ceo_1', '张总', '某科技集团', 'ceo']);
    await db.run(`INSERT INTO users (id, feishu_id, name, organization, role) VALUES (?, ?, ?, ?, ?)`, ['u2', 'feishu_admin_1', '管理员', '平台运营', 'admin']);
  }
}

async function startServer() {
  await initDB();
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);
  app.use(express.json());

  // --- API Routes ---
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/auth/login', async (req, res) => {
    const { feishu_id } = req.body;
    const user = await db.get('SELECT * FROM users WHERE feishu_id = ?', [feishu_id]);
    if (user) res.json({ user });
    else res.status(401).json({ error: 'Unauthorized' });
  });

  app.get('/api/articles', async (req, res) => {
    const status = req.query.status as string;
    let articles;
    if (status) articles = await db.all('SELECT * FROM articles WHERE status = ? ORDER BY publish_date DESC', [status]);
    else articles = await db.all('SELECT * FROM articles ORDER BY publish_date DESC');
    res.json(articles.map((a: any) => ({ ...a, tags: JSON.parse(a.tags || '[]') })));
  });

  app.get('/api/articles/:id', async (req, res) => {
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [req.params.id]) as any;
    if (article) {
      article.tags = JSON.parse(article.tags || '[]');
      const comments = await db.all('SELECT * FROM comments WHERE article_id = ?', [req.params.id]);
      res.json({ ...article, comments });
    } else res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/articles', async (req, res) => {
    const { title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, tags } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    await db.run(`INSERT INTO articles (id, title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, publish_date, tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, 
      [id, title||'', summary||'', content||'', podcast_url||null, presentation_url||null, infographic_url||null, original_url||null, status||'draft', new Date().toISOString(), JSON.stringify(tags||[])]);
    res.json({ id });
  });

  app.put('/api/articles/:id', async (req, res) => {
    const { title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, tags } = req.body;
    await db.run(`UPDATE articles SET title=?, summary=?, content=?, podcast_url=?, presentation_url=?, infographic_url=?, original_url=?, status=?, tags=? WHERE id=?`,
      [title||'', summary||'', content||'', podcast_url||null, presentation_url||null, infographic_url||null, original_url||null, status||'draft', JSON.stringify(tags||[]), req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/articles/:id', async (req, res) => {
    await db.run('DELETE FROM comments WHERE article_id = ?', [req.params.id]);
    await db.run('DELETE FROM playlists WHERE article_id = ?', [req.params.id]);
    await db.run('DELETE FROM analytics WHERE article_id = ?', [req.params.id]);
    await db.run('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/analytics/summary', async (req, res) => {
    const summary = await db.all(`
      SELECT a.id, a.title, 
             COUNT(CASE WHEN an.action = 'view' THEN 1 END) as views,
             SUM(CASE WHEN an.action = 'view' THEN an.duration ELSE 0 END) as total_duration
      FROM articles a
      LEFT JOIN analytics an ON a.id = an.article_id
      GROUP BY a.id, a.title
    `);
    res.json(summary);
  });

  app.get('/api/analytics/users', async (req, res) => {
    const userStats = await db.all(`
      SELECT u.id, u.name, u.organization, 
             COUNT(CASE WHEN an.action = 'view' THEN 1 END) as views,
             COUNT(CASE WHEN an.action = 'listen' THEN 1 END) as listens,
             SUM(CASE WHEN an.duration IS NOT NULL THEN an.duration ELSE 0 END) as total_duration
      FROM users u
      LEFT JOIN analytics an ON u.id = an.user_id
      WHERE u.role = 'ceo'
      GROUP BY u.id, u.name, u.organization
      HAVING views > 0 OR listens > 0
    `);
    res.json(userStats);
  });

  // --- Vite & Production Static ---
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
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer().catch(err => console.error('Startup failed:', err));
