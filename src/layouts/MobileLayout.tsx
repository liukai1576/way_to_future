import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Headphones, User, LogOut } from 'lucide-react';

export default function MobileLayout({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-neutral-50 max-w-md mx-auto relative shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            AI
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">CEO Weekly</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{user.name}</span>
          <button onClick={onLogout} className="text-neutral-400 hover:text-neutral-600" title="退出登录">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth">
        <Outlet context={{ user }} />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 flex justify-around items-center py-2 pb-safe z-20">
        <Link 
          to="/" 
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-orange-500' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">首页</span>
        </Link>
        <Link 
          to="/playlist" 
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${location.pathname === '/playlist' ? 'text-orange-500' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          <Headphones size={24} strokeWidth={location.pathname === '/playlist' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">播客</span>
        </Link>
        {user.role === 'admin' && (
          <Link 
            to="/admin" 
            className="flex flex-col items-center p-2 rounded-xl transition-colors text-neutral-400 hover:text-neutral-600"
          >
            <User size={24} strokeWidth={2} />
            <span className="text-[10px] mt-1 font-medium">管理</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
