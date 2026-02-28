import { useState, FormEvent } from 'react';
import { LogIn, Lock, Building } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feishu_id: id }),
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.user);
      } else {
        setError('登录失败：未授权的用户。请使用 feishu_ceo_1 或 feishu_admin_1');
      }
    } catch (err) {
      setError('网络错误，请重试。');
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
          大模型时代的商业重塑指南
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-neutral-100">
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('feishu_ceo_1')}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              </div>
              {loading ? '验证中...' : '飞书一键登录'}
            </button>

            <button
              onClick={() => handleLogin('feishu_admin_1')}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border-2 border-orange-100 rounded-2xl text-sm font-semibold text-orange-600 bg-white hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
            >
              开发测试登录 (管理员)
            </button>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
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
