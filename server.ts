import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database('app.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    feishu_id TEXT UNIQUE,
    name TEXT,
    organization TEXT,
    role TEXT DEFAULT 'ceo',
    invited_by TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT,
    summary TEXT,
    content TEXT,
    podcast_url TEXT,
    presentation_url TEXT,
    infographic_url TEXT,
    original_url TEXT,
    status TEXT DEFAULT 'draft',
    publish_date TEXT,
    tags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    article_id TEXT,
    text TEXT,
    highlight_text TEXT,
    position TEXT,
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    article_id TEXT,
    order_index INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    article_id TEXT,
    action TEXT,
    duration INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );
`);

// Insert mock data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM articles').get() as { c: number };
if (count.c === 0) {
  const insertArticle = db.prepare(`
    INSERT INTO articles (id, title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, publish_date, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertArticle.run(
    '1',
    '大模型时代的商业重塑：从降本增效到业务创新',
    '本文深入探讨了大语言模型（LLM）如何帮助企业实现从基础的降本增效，跨越到核心业务模式的创新。',
    '随着ChatGPT等大语言模型的普及，企业对AI的认知正在发生根本性转变。过去，AI主要被视为一种自动化工具，用于替代重复性劳动，从而实现“降本增效”。然而，大模型展现出的涌现能力、强大的自然语言理解和生成能力，使其具备了直接参与甚至主导业务创新的潜力。\n\n首先，在客户服务领域，大模型不再仅仅是提供标准答案的机器，而是能够理解客户情绪、进行多轮复杂对话、甚至主动提供个性化建议的“智能顾问”。这不仅提升了客户满意度，更创造了新的销售机会。\n\n其次，在产品研发环节，大模型可以辅助工程师编写代码、生成设计草图、甚至进行初步的市场调研分析。这极大地缩短了产品上市周期，使得企业能够更快地响应市场变化。\n\n更重要的是，大模型正在催生全新的商业模式。例如，基于大模型的个性化教育平台、智能法律咨询服务等。这些新模式打破了传统行业的边界，为企业开辟了新的增长空间。\n\n然而，企业在拥抱大模型时也面临着挑战，如数据安全、模型幻觉、以及人才短缺等。因此，企业需要制定清晰的AI战略，建立完善的数据治理体系，并积极培养具备AI素养的复合型人才。',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.clickdimensions.com/links/TestPDFfile.pdf',
    'https://picsum.photos/seed/ai1/800/1200',
    'https://example.com/original-article-1',
    'published',
    new Date().toISOString(),
    '["AI新知", "商业战略"]'
  );

  insertArticle.run(
    '2',
    'AI Agent：下一代人机交互范式',
    'AI Agent（人工智能代理）正在成为大模型应用的新趋势，它们能够自主规划任务、调用工具并执行复杂流程。',
    '如果说大模型是大脑，那么AI Agent就是具备了手脚的智能体。它们不仅能“想”，还能“做”。AI Agent的核心在于其自主性：给定一个目标，Agent能够自行拆解任务步骤，选择合适的工具（如搜索引擎、计算器、数据库查询等），并在执行过程中根据反馈不断调整策略。\n\n在企业应用中，AI Agent展现出巨大的潜力。例如，一个“数据分析Agent”可以自动连接企业数据库，根据用户的自然语言提问，自动编写SQL查询数据，生成图表，并撰写分析报告。这使得非技术人员也能轻松获取数据洞察。\n\n另一个例子是“智能客服Agent”。与传统的规则引擎客服不同，Agent能够理解复杂的客户诉求，自主查询内部知识库，甚至调用订单系统为客户办理退换货，实现了真正的端到端服务。\n\n然而，AI Agent的发展仍处于早期阶段。如何保证Agent的可靠性、安全性，以及如何处理多Agent之间的协作，都是亟待解决的问题。未来，随着技术的成熟，AI Agent有望成为企业数字化转型的核心驱动力。',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.clickdimensions.com/links/TestPDFfile.pdf',
    'https://picsum.photos/seed/ai2/800/1200',
    'https://example.com/original-article-2',
    'published',
    new Date().toISOString(),
    '["前沿技术", "AI Agent"]'
  );

  insertArticle.run(
    '3',
    'CEO必读：如何构建企业的AI护城河',
    '在AI技术日新月异的今天，企业如何利用AI构建持久的竞争优势？本文为您揭示关键策略。',
    'AI技术本身正在迅速商品化。仅仅调用API已经无法构成长期的竞争壁垒。真正的AI护城河来自于数据、场景与垂直整合。\n\n首先是私有数据。公开数据训练出的模型大家都能用，但企业内部积累的、经过清洗的高质量行业数据，是训练垂直领域精调模型的核心资产。\n\n其次是深度嵌入业务流程。AI不应只是一个外挂插件，而应深度整合进企业的核心价值链中，形成难以被对手轻易复制的闭环。',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.clickdimensions.com/links/TestPDFfile.pdf',
    'https://picsum.photos/seed/ai3/800/1200',
    'https://example.com/original-article-3',
    'published',
    new Date().toISOString(),
    '["商业案例", "领导力"]'
  );

  insertArticle.run(
    '4',
    '算力之争：企业如何应对日益增长的算力成本',
    '随着模型规模的扩大，算力成本成为制约企业AI落地的关键因素。本文探讨了优化成本的几种路径。',
    '算力是AI时代的“石油”。对于大多数企业而言，盲目追求大参数模型并不可取。通过模型蒸馏、量化以及针对特定任务的小模型（SLM），可以在保证性能的前提下大幅降低推理成本。',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.clickdimensions.com/links/TestPDFfile.pdf',
    'https://picsum.photos/seed/ai4/800/1200',
    'https://example.com/original-article-4',
    'published',
    new Date().toISOString(),
    '["AI新知", "基础设施"]'
  );

  const insertUser = db.prepare(`
    INSERT INTO users (id, feishu_id, name, organization, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run('u1', 'feishu_ceo_1', '张总', '某科技集团', 'ceo');
  insertUser.run('u2', 'feishu_admin_1', '管理员', '平台运营', 'admin');

  const insertComment = db.prepare(`
    INSERT INTO comments (id, article_id, text, highlight_text, position)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertComment.run('c1', '1', '这是大模型应用的核心价值所在，不仅是省钱，更是赚钱。', '直接参与甚至主导业务创新', 'p1');
  insertComment.run('c2', '2', 'Agent的自主性是区分传统自动化与AI智能的关键。', 'Agent能够自行拆解任务步骤', 'p2');
  insertComment.run('c3', '3', '私有数据是企业在AI时代唯一的“独门秘籍”。', '私有数据训练出的模型大家都能用', 'p3');

  // Insert mock analytics for consistency (BUG-07)
  const insertAnalytics = db.prepare(`
    INSERT INTO analytics (id, user_id, article_id, action, duration)
    VALUES (?, ?, ?, ?, ?)
  `);
  // User u1 (张总) views articles 1, 2, 3
  insertAnalytics.run('a1', 'u1', '1', 'view', 300);
  insertAnalytics.run('a2', 'u1', '2', 'view', 450);
  insertAnalytics.run('a3', 'u1', '3', 'view', 200);
  // User u1 (张总) listens to article 1
  insertAnalytics.run('a4', 'u1', '1', 'listen', 600);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 信任代理，确保在 Cloud Run/Nginx 后能正确获取 IP 和协议
  app.set('trust proxy', true);

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // 允许跨域，方便内部测试
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(express.json());

  // Health check - 访问 /api/health 确认后端是否存活
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- API Routes ---

  // Auth (Mock Feishu Login)
  app.post('/api/auth/login', (req, res) => {
    const { feishu_id } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE feishu_id = ?').get(feishu_id);
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  // Articles
  app.get('/api/articles', (req, res) => {
    const status = req.query.status as string;
    let articles;
    if (status) {
      articles = db.prepare('SELECT * FROM articles WHERE status = ? ORDER BY publish_date DESC').all(status);
    } else {
      articles = db.prepare('SELECT * FROM articles ORDER BY publish_date DESC').all();
    }
    
    // Parse tags JSON
    articles = articles.map((a: any) => ({ ...a, tags: JSON.parse(a.tags || '[]') }));
    res.json(articles);
  });

  app.get('/api/articles/:id', (req, res) => {
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id) as any;
    if (article) {
      article.tags = JSON.parse(article.tags || '[]');
      const comments = db.prepare('SELECT * FROM comments WHERE article_id = ?').all(req.params.id);
      res.json({ ...article, comments });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/articles', (req, res) => {
    try {
      const { title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, tags } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      const stmt = db.prepare(`
        INSERT INTO articles (id, title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, publish_date, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, 
        title || '', 
        summary || '', 
        content || '', 
        podcast_url || null, 
        presentation_url || null, 
        infographic_url || null, 
        original_url || null, 
        status || 'draft', 
        new Date().toISOString(), 
        JSON.stringify(tags || [])
      );
      res.json({ id });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/articles/:id', (req, res) => {
    try {
      const { title, summary, content, podcast_url, presentation_url, infographic_url, original_url, status, tags } = req.body;
      const stmt = db.prepare(`
        UPDATE articles 
        SET title = ?, summary = ?, content = ?, podcast_url = ?, presentation_url = ?, infographic_url = ?, original_url = ?, status = ?, tags = ?
        WHERE id = ?
      `);
      stmt.run(
        title || '', 
        summary || '', 
        content || '', 
        podcast_url || null, 
        presentation_url || null, 
        infographic_url || null, 
        original_url || null, 
        status || 'draft', 
        JSON.stringify(tags || []), 
        req.params.id
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/articles/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM comments WHERE article_id = ?').run(req.params.id);
      db.prepare('DELETE FROM playlists WHERE article_id = ?').run(req.params.id);
      db.prepare('DELETE FROM analytics WHERE article_id = ?').run(req.params.id);
      db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  app.post('/api/articles/batch', (req, res) => {
    try {
      const { ids, action, status } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid ids' });
      }

      const placeholders = ids.map(() => '?').join(',');
      
      if (action === 'delete') {
        db.prepare(`DELETE FROM comments WHERE article_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM playlists WHERE article_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM analytics WHERE article_id IN (${placeholders})`).run(...ids);
        db.prepare(`DELETE FROM articles WHERE id IN (${placeholders})`).run(...ids);
      } else if (action === 'update_status' && status) {
        db.prepare(`UPDATE articles SET status = ? WHERE id IN (${placeholders})`).run(status, ...ids);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error in batch operation:', error);
      res.status(500).json({ error: 'Batch operation failed' });
    }
  });

  // Comments
  app.post('/api/comments', (req, res) => {
    try {
      const { article_id, text, highlight_text, position } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      db.prepare('INSERT INTO comments (id, article_id, text, highlight_text, position) VALUES (?, ?, ?, ?, ?)').run(
        id, 
        article_id || '', 
        text || '', 
        highlight_text || '', 
        position || ''
      );
      res.json({ id });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  app.delete('/api/comments/:id', (req, res) => {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Playlists
  app.get('/api/playlists/:userId', (req, res) => {
    const items = db.prepare(`
      SELECT p.*, a.title, a.podcast_url, a.summary 
      FROM playlists p 
      JOIN articles a ON p.article_id = a.id 
      WHERE p.user_id = ? 
      ORDER BY p.order_index
    `).all(req.params.userId);
    res.json(items);
  });

  app.post('/api/playlists', (req, res) => {
    try {
      const { user_id, article_id } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM playlists WHERE user_id = ?').get(user_id || '') as any;
      const nextOrder = (maxOrder?.m || 0) + 1;
      
      db.prepare('INSERT INTO playlists (id, user_id, article_id, order_index) VALUES (?, ?, ?, ?)').run(
        id, 
        user_id || '', 
        article_id || '', 
        nextOrder
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding to playlist:', error);
      res.status(500).json({ error: 'Failed to add to playlist' });
    }
  });

  app.delete('/api/playlists/:id', (req, res) => {
    db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Analytics
  app.post('/api/analytics', (req, res) => {
    try {
      const { user_id, article_id, action, duration } = req.body;
      const id = Math.random().toString(36).substring(2, 9);
      db.prepare('INSERT INTO analytics (id, user_id, article_id, action, duration) VALUES (?, ?, ?, ?, ?)').run(
        id, 
        user_id || '', 
        article_id || '', 
        action || '', 
        duration || 0
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error logging analytics:', error);
      res.status(500).json({ error: 'Failed to log analytics' });
    }
  });

  app.get('/api/analytics/summary', (req, res) => {
    const summary = db.prepare(`
      SELECT a.id, a.title, 
             COUNT(CASE WHEN an.action = 'view' THEN 1 END) as views,
             SUM(CASE WHEN an.action = 'view' THEN an.duration ELSE 0 END) as total_duration
      FROM articles a
      LEFT JOIN analytics an ON a.id = an.article_id
      GROUP BY a.id
    `).all();
    res.json(summary);
  });

  app.get('/api/analytics/users', (req, res) => {
    const userStats = db.prepare(`
      SELECT u.id, u.name, u.organization, 
             COUNT(CASE WHEN an.action = 'view' THEN 1 END) as views,
             COUNT(CASE WHEN an.action = 'listen' THEN 1 END) as listens,
             SUM(an.duration) as total_duration
      FROM users u
      LEFT JOIN analytics an ON u.id = an.user_id
      WHERE u.role = 'ceo'
      GROUP BY u.id
      HAVING views > 0 OR listens > 0
    `).all();
    res.json(userStats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // 针对开发环境的 SPA 路由回退
    app.get(['/', '/admin', '/playlist', '/article/*'], async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    // 生产环境
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
