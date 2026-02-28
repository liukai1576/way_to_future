import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, AlertCircle, ChevronRight, Search, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router-dom';

export default function AdminArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle,
      summary: '',
      content: '',
      tags: [],
      status: 'draft'
    };

    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      alert('创建失败，请重试');
      return;
    }
    
    const data = await res.json();
    if (!data || !data.id) {
      alert('创建失败：未获取到文章 ID');
      return;
    }

    setIsModalOpen(false);
    setNewTitle('');
    navigate(`/admin/articles/edit/${data.id}`);
  };

  const handleBatchOperation = async (action: 'delete' | 'update_status', status?: string) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !confirm(`确定要删除选中的 ${selectedIds.length} 篇文章吗？`)) return;

    await fetch('/api/articles/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action, status })
    });
    
    setSelectedIds([]);
    fetchArticles();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredArticles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArticles.map(a => a.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Check size={10} /> 已发布</span>;
      case 'review':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock size={10} /> 审核中</span>;
      case 'draft':
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10} /> 草稿</span>;
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-neutral-400">加载中...</div>;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">内容管理</h2>
          <p className="text-sm text-neutral-500 mt-1">点击文章行进入详情页进行编辑、上传素材或修改状态</p>
        </div>
        
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Trigger asChild>
            <button 
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
            >
              <Plus size={20} />
              新建内容
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl z-50">
              <Dialog.Title className="text-xl font-bold text-neutral-900 mb-6">
                创建新内容
              </Dialog.Title>
              
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">文章标题</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-lg"
                    placeholder="请输入标题..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button type="button" className="flex-1 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                      取消
                    </button>
                  </Dialog.Close>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                    下一步
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Search Bar & Batch Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input 
            type="text"
            placeholder="搜索标题或摘要..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white shadow-sm"
          />
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-neutral-200 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm font-medium text-neutral-500 mr-2">已选 {selectedIds.length} 项</span>
            <button 
              onClick={() => handleBatchOperation('update_status', 'published')}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
              title="批量发布"
            >
              <CheckCircle2 size={20} />
            </button>
            <button 
              onClick={() => handleBatchOperation('update_status', 'draft')}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
              title="批量转为草稿"
            >
              <XCircle size={20} />
            </button>
            <div className="w-px h-6 bg-neutral-200 mx-1"></div>
            <button 
              onClick={() => handleBatchOperation('delete')}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="批量删除"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-200 text-[11px] uppercase tracking-widest font-bold text-neutral-400">
                <th className="p-5 pl-8 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredArticles.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                </th>
                <th className="p-5">内容信息</th>
                <th className="p-5">当前状态</th>
                <th className="p-5">发布日期</th>
                <th className="p-5">标签</th>
                <th className="p-5 pr-8 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredArticles.map((article) => (
                <tr 
                  key={article.id} 
                  onClick={() => navigate(`/admin/articles/edit/${article.id}`)}
                  className="hover:bg-neutral-50 transition-all cursor-pointer group"
                >
                  <td className="p-5 pl-8" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(article.id)}
                      onChange={(e) => toggleSelect(article.id, e as any)}
                      className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">{article.title}</div>
                    <div className="text-xs text-neutral-400 mt-1 truncate max-w-md">{article.summary || '暂无摘要'}</div>
                  </td>
                  <td className="p-5">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="p-5 text-xs text-neutral-500 font-medium">
                    {format(new Date(article.publish_date), 'yyyy-MM-dd', { locale: zhCN })}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-1">
                      {article.tags?.length > 0 ? article.tags.map((tag: string) => (
                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded uppercase">
                          {tag}
                        </span>
                      )) : <span className="text-[9px] text-neutral-300">无标签</span>}
                    </div>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <ChevronRight size={18} className="inline-block text-neutral-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredArticles.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-neutral-300" />
            </div>
            <p className="text-neutral-400 text-sm">未找到相关内容</p>
          </div>
        )}
      </div>
    </div>
  );
}


