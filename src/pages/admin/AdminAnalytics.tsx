import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, Clock, Share2, TrendingUp, UserCheck } from 'lucide-react';

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/summary').then(res => res.json()),
      fetch('/api/analytics/users').then(res => res.json())
    ]).then(([summaryData, userData]) => {
      setSummary(summaryData);
      setUserStats(userData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-neutral-400">加载中...</div>;

  const totalViews = summary.reduce((acc, curr) => acc + curr.views, 0);
  const totalDuration = summary.reduce((acc, curr) => acc + curr.total_duration, 0);
  const avgDuration = totalViews > 0 ? Math.round(totalDuration / totalViews / 60) : 0;

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">数据分析</h2>
        <p className="text-sm text-neutral-500 mt-1">查看用户行为和内容表现</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-neutral-500">总阅读量</h3><div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><Eye size={20} /></div></div>
          <div className="text-3xl font-bold text-neutral-900">{totalViews}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-neutral-500">总停留时长 (分钟)</h3><div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><Clock size={20} /></div></div>
          <div className="text-3xl font-bold text-neutral-900">{avgDuration}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-neutral-500">活跃 CEO 数</h3><div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCheck size={20} /></div></div>
          <div className="text-3xl font-bold text-neutral-900">{userStats.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium text-neutral-500">分享次数</h3><div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Share2 size={20} /></div></div>
          <div className="text-3xl font-bold text-neutral-900">0</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">各文章阅读量对比</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="title" tick={{ fontSize: 12, fill: '#737373' }} tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="views" name="阅读量" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">CEO 行为追踪</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-neutral-500 border-b border-neutral-100"><th className="pb-4 font-medium">姓名 / 机构</th><th className="pb-4 font-medium text-center">阅读</th><th className="pb-4 font-medium text-center">收听</th><th className="pb-4 font-medium text-right">活跃时长</th></tr></thead>
              <tbody className="divide-y divide-neutral-50">
                {userStats.map((user, i) => (
                  <tr key={i} className="group">
                    <td className="py-4"><div className="font-bold text-neutral-900">{user.name}</div><div className="text-xs text-neutral-500">{user.organization}</div></td>
                    <td className="py-4 text-center"><span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">{user.views}</span></td>
                    <td className="py-4 text-center"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{user.listens}</span></td>
                    <td className="py-4 text-right font-medium text-neutral-700">{Math.round(user.total_duration / 60)} 分钟</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
