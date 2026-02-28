import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MobileLayout from './layouts/MobileLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/mobile/Home';
import ArticleDetail from './pages/mobile/ArticleDetail';
import Playlist from './pages/mobile/Playlist';
import AdminArticles from './pages/admin/AdminArticles';
import AdminArticleEdit from './pages/admin/AdminArticleEdit';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import Login from './pages/Login';

export default function App() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(() => {
    try {
      // Try to read from cookie first, then localStorage as fallback
      const cookies = document.cookie.split('; ');
      const userCookie = cookies.find(row => row.startsWith('user='));
      if (userCookie) {
        return JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      }
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn('Failed to read auth state:', e);
    }
    return null;
  });

  const handleLogin = (u: any) => {
    setUser(u);
    try {
      const userStr = JSON.stringify(u);
      document.cookie = `user=${encodeURIComponent(userStr)}; path=/; max-age=86400; SameSite=None; Secure`;
      localStorage.setItem('user', userStr);
    } catch (e) {
      console.warn('Failed to save auth state:', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      document.cookie = 'user=; path=/; max-age=0; SameSite=None; Secure';
      localStorage.removeItem('user');
    } catch (e) {
      console.warn('Failed to clear auth state:', e);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Mobile App Routes (CEO Reader) */}
        <Route path="/" element={<MobileLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<Home />} />
          <Route path="article/:id" element={<ArticleDetail />} />
          <Route path="playlist" element={<Playlist />} />
        </Route>

        {/* PC Admin Routes */}
        {user.role === 'admin' && (
          <Route path="/admin" element={<AdminLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/admin/articles" replace />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/edit/:id" element={<AdminArticleEdit />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        )}
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
