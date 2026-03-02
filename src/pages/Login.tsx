import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Rocket, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(true);

  useEffect(() => {
    // Check if demo is enabled from backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDemoEnabled(data.demo_enabled !== false))
      .catch(() => setDemoEnabled(true));

    // Check for Feishu callback code in URL
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      handleFeishuCallback(code);
    }
  }, [location]);

  const handleFeishuCallback = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/feishu/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(data.user.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      console.error('Feishu login failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeishuLogin = async () => {
    try {
      const res = await fetch('/api/auth/feishu/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to get Feishu login URL', err);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      }
    } catch (err) {
      console.error('Demo login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-800 rounded-2xl border border-neutral-700 p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Rocket className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">CEO Weekly</h1>
        <p className="text-neutral-400 text-center mb-8">面向未来的 CEO 专属阅读器</p>

        <div className="space-y-4">
          <button
            onClick={handleFeishuLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-5 h-5" />
            {loading ? '正在登录...' : '使用飞书一键登录'}
          </button>

          {demoEnabled && (
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-xl transition-all active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              体验 Demo 账号
            </button>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-neutral-500">
          登录即代表同意服务协议与隐私政策
        </p>
      </motion.div>
    </div>
  );
}
