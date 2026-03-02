import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
    console.log('[PROD] CEO Weekly - Character Set & Path Alignment');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: 3306,
        charset: 'utf8mb4_unicode_ci' // 显式设定字符集
    });

    const app = express();
    app.use(express.json());

    // 静态资源目录对齐
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // 文章列表接口
    app.get('/api/articles', async (req, res) => {
        try {
            const [rows] = await pool.execute('SELECT * FROM articles WHERE status = "published" ORDER BY created_at DESC');
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/reports', async (req, res) => {
        const [rows] = await pool.execute('SELECT * FROM articles WHERE status = "published" ORDER BY created_at DESC');
        res.json(rows);
    });

    // 飞书 OAuth 流程
    app.get('/api/auth/feishu/url', (req, res) => {
        const url = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${process.env.FEISHU_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FEISHU_REDIRECT_URL)}&state=st`;
        res.json({ url });
    });

    app.post('/api/auth/feishu/callback', async (req, res) => {
        const { code } = req.body;
        try {
            const appTokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
                app_id: process.env.FEISHU_APP_ID,
                app_secret: process.env.FEISHU_APP_SECRET
            });
            const appAccessToken = appTokenRes.data.app_access_token;
            const userAuthRes = await axios.post('https://open.feishu.cn/open-apis/authen/v1/access_token', {
                grant_type: 'authorization_code',
                code
            }, {
                headers: { 'Authorization': `Bearer ${appAccessToken}` }
            });
            if (userAuthRes.data.code !== 0) return res.status(401).json({ error: userAuthRes.data.msg });
            const { open_id, name, avatar_url } = userAuthRes.data.data;
            const [rows] = await pool.execute('SELECT * FROM users WHERE feishu_id = ?', [open_id]);
            let user = rows[0];
            if (!user) {
                const id = Math.random().toString(36).substring(2, 9);
                await pool.execute('INSERT INTO users (id, feishu_id, name, avatar, role) VALUES (?, ?, ?, ?, ?)', [id, open_id, name, avatar_url, 'ceo']);
                const [newRows] = await pool.execute('SELECT * FROM users WHERE feishu_id = ?', [open_id]);
                user = newRows[0];
            }
            res.json({ user });
        } catch (error) {
            res.status(500).json({ error: 'Auth fail' });
        }
    });

    app.post('/api/auth/demo', (req, res) => {
        res.json({ user: { id: 'demo_user', name: '体验账号', role: 'admin' } });
    });

    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();