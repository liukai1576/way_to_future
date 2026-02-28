import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileText, BarChart2, LogOut } from 'lucide-react';

export default function AdminLayout({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
            AI
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight">CEO Weekly</h1>
            <p className="text-xs text-neutral-500 font-medium">管理控制台</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin/articles"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname.includes('/articles')
                ? 'bg-orange-50 text-orange-600 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <FileText size={20} className={location.pathname.includes('/articles') ? 'text-orange-500' : 'text-neutral-400'} />
            内容管理
          </Link>
          <Link
            to="/admin/analytics"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname.includes('/analytics')
                ? 'bg-orange-50 text-orange-600 font-medium'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <BarChart2 size={20} className={location.pathname.includes('/analytics') ? 'text-orange-500' : 'text-neutral-400'} />
            数据分析
          </Link>
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.organization}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-50/50">
        <header className="bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-neutral-800">
            {location.pathname.includes('/articles') ? '内容管理' : '数据分析'}
          </h2>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors">
              返回阅读器
            </Link>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
