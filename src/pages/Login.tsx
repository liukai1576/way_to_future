import { useState, useEffect } from 'react';
import { LogIn, Rocket, ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoEnabled, setDemoEnabled] = useState(true);

  useEffect(() => {
    // Check if demo is enabled from backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDemoEnabled(data.demo_enabled !== false))
      .catch(() => setDemoEnabled(true));

    // Check for Feishu OAuth redirect result
    const params = new URLSearchParams(window.location.search);
    const feishuUser = params.get('feishu_user');
    const loginError = params.get('login_error');
    if (feishuUser) {
      try {
        const user = JSON.parse(feishuUser);
        // Clean URL
        window.history.replaceState({}, '', '/');
        onLogin(user);
      } catch (e) {
        setError('飞书登录数据解析失败');
      }
    } else if (loginError) {
      setError('飞书登录失败，请重试');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleFeishuLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/feishu/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to get Feishu login URL', err);
      setError('无法获取飞书登录链接');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (data.user) {
        onLogin(data.user);
      } else {
        setError('Demo 登录失败');
      }
    } catch (err) {
      console.error('Demo login failed', err);
      setError('Demo 登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-6 transform -rotate-6">
          AI
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 tracking-tight">
          CEO Weekly
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          面向未来的 CEO 专属阅读器
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-neutral-100">
          <div className="space-y-4">
            <button
              onClick={handleFeishuLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" />
              {loading ? '正在登录...' : '使用飞书一键登录'}
            </button>

            {demoEnabled && (
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border-2 border-orange-100 rounded-2xl text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                体验 Demo 账号
              </button>
            )}

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  仅受邀请的企业一把手可访问
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
