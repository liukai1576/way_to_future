import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, Trash2, Plus, MessageSquare, 
  Music, FileText, Image as ImageIcon, Type, 
  Check, Clock, AlertCircle, X, ExternalLink
} from 'lucide-react';
import clsx from 'clsx';

export default function AdminArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [commentText, setCommentText] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      const data = await res.json();
      setArticle(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch article', err);
    }
  };

  const handleSave = async () => {
    // URL Validation
    if (article.presentation_url) {
      if (article.presentation_url.includes('dummy.pdf') || article.presentation_url.includes('w3.org/WAI/ER/tests')) {
        alert('请不要使用测试用的占位 PDF 链接，请上传或填写真实的摘要文件 URL。');
        return;
      }
      try {
        new URL(article.presentation_url);
      } catch (e) {
        if (!article.presentation_url.startsWith('data:')) {
          alert('摘要文件 URL 格式不正确，请输入有效的链接或上传本地文件。');
          return;
        }
      }
    }

    setSaving(true);
    try {
      await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      alert('保存成功');
    } catch (err) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      navigate('/admin/articles');
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleAddComment = async () => {
    if (!selectedText || !commentText) return;
    
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: id,
          text: commentText,
          highlight_text: selectedText
        })
      });
      const { id: commentId } = await res.json();
      
      // Update local state
      setArticle({
        ...article,
        comments: [...(article.comments || []), { id: commentId, text: commentText, highlight_text: selectedText }]
      });
      
      setIsCommentModalOpen(false);
      setSelectedText('');
      setCommentText('');
    } catch (err) {
      alert('添加点评失败');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setArticle({
        ...article,
        comments: article.comments.filter((c: any) => c.id !== commentId)
      });
    } catch (err) {
      alert('删除点评失败');
    }
  };

  const handleTextSelection = () => {
    if (!contentRef.current) return;
    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    if (start !== end) {
      const text = article.content.substring(start, end);
      setSelectedText(text);
      setIsCommentModalOpen(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'podcast_url' | 'presentation_url' | 'infographic_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setArticle({ ...article, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">加载中...</div>;

  const tabs = [
    { id: 'basic', label: '基础信息', icon: Type },
    { id: 'podcast', label: '播客音频', icon: Music },
    { id: 'summary', label: 'PPT/PDF 摘要', icon: FileText },
    { id: 'infographic', label: '信息图', icon: ImageIcon },
    { id: 'content', label: '原文与点评', icon: MessageSquare },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-neutral-50/80 backdrop-blur-md py-4 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/articles')}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{article.title}</h2>
            <div className="flex items-center gap-4 mt-1">
              <select 
                value={article.status}
                onChange={e => setArticle({...article, status: e.target.value})}
                className="text-xs font-medium bg-white border border-neutral-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="draft">草稿</option>
                <option value="review">审核中</option>
                <option value="published">已发布</option>
              </select>
              <span className="text-xs text-neutral-400">ID: {article.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
          >
            <Trash2 size={18} />
            删除
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
          >
            {saving ? '正在保存...' : <><Save size={18} /> 保存修改</>}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                activeTab === tab.id 
                  ? "bg-white text-orange-600 shadow-sm border border-neutral-100" 
                  : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-neutral-200 p-8 min-h-[600px]">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">文章标题</label>
                <input 
                  type="text" 
                  value={article.title}
                  onChange={e => setArticle({...article, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">核心摘要 (C端展示)</label>
                <textarea 
                  value={article.summary}
                  onChange={e => setArticle({...article, summary: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all h-32 resize-none leading-relaxed"
                  placeholder="输入吸引CEO的核心摘要..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">标签 (逗号分隔)</label>
                <input 
                  type="text" 
                  value={article.tags.join(', ')}
                  onChange={e => setArticle({...article, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="例如：AI, 商业, 战略"
                />
              </div>
            </div>
          )}

          {activeTab === 'podcast' && (
            <div className="space-y-6">
              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white">
                  <Music size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-orange-900">播客音频配置</h4>
                  <p className="text-xs text-orange-700">上传或指定音频文件 URL，将直接在 C 端播客页面播放。</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">音频文件 URL 或 本地上传</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={article.podcast_url || ''}
                    onChange={e => setArticle({...article, podcast_url: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                    placeholder="https://example.com/audio.mp3"
                  />
                  <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors">
                    <span>上传音频</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, 'podcast_url')} />
                  </label>
                  {article.podcast_url && !article.podcast_url.startsWith('data:') && (
                    <a href={article.podcast_url} target="_blank" rel="noreferrer" className="p-3 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 transition-colors">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
                {article.podcast_url && article.podcast_url.startsWith('data:') && (
                  <div className="text-xs text-emerald-600 font-medium">✓ 已选择本地音频文件</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">PPT / PDF 摘要配置</h4>
                  <p className="text-xs text-blue-700">提供 PPT 或 PDF 格式的深度摘要文件链接。</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">文件 URL 或 本地上传</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={article.presentation_url || ''}
                    onChange={e => setArticle({...article, presentation_url: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                    placeholder="https://example.com/summary.pdf"
                  />
                  <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors">
                    <span>上传 PDF</span>
                    <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFileUpload(e, 'presentation_url')} />
                  </label>
                  {article.presentation_url && !article.presentation_url.startsWith('data:') && (
                    <a href={article.presentation_url} target="_blank" rel="noreferrer" className="p-3 bg-neutral-100 text-neutral-600 rounded-xl hover:bg-neutral-200 transition-colors">
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
                {article.presentation_url && article.presentation_url.startsWith('data:') && (
                  <div className="text-xs text-emerald-600 font-medium">✓ 已选择本地 PDF 文件</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'infographic' && (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">信息图配置</h4>
                  <p className="text-xs text-emerald-700">上传长图或信息图，帮助 CEO 快速扫视核心观点。</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">图片 URL 或 本地上传</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={article.infographic_url || ''}
                    onChange={e => setArticle({...article, infographic_url: e.target.value})}
                    className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
                    placeholder="https://example.com/image.png"
                  />
                  <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors">
                    <span>上传图片</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'infographic_url')} />
                  </label>
                </div>
                {article.infographic_url && (
                  <div className="rounded-2xl overflow-hidden border border-neutral-100 shadow-sm">
                    <img src={article.infographic_url} alt="预览" className="w-full h-auto max-h-96 object-contain bg-neutral-50" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-neutral-900">原文内容与专家点评</h4>
                <div className="text-xs text-neutral-400">提示：选中文字可快速添加专家点评</div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">原文编辑</label>
                  <textarea 
                    ref={contentRef}
                    value={article.content}
                    onChange={e => setArticle({...article, content: e.target.value})}
                    onMouseUp={handleTextSelection}
                    className="flex-1 w-full px-6 py-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-serif text-lg leading-relaxed resize-none min-h-[400px]"
                    placeholder="在此输入或粘贴文章原文..."
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">已添加点评 ({article.comments?.length || 0})</label>
                  <div className="flex-1 bg-neutral-50 rounded-2xl border border-neutral-100 p-4 space-y-3 overflow-y-auto max-h-[500px]">
                    {article.comments?.length > 0 ? (
                      article.comments.map((comment: any) => (
                        <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 group">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase">引用原文</span>
                            <button 
                              onClick={() => deleteComment(comment.id)}
                              className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-neutral-400 italic mb-2 border-l-2 border-neutral-200 pl-2">“{comment.highlight_text}”</p>
                          <p className="text-sm text-neutral-700 leading-relaxed">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-center px-8">
                        <MessageSquare size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">暂无点评。在左侧选中一段文字来添加您的专家见解。</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCommentModalOpen(false)}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900">添加专家点评</h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">选中的原文</label>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-sm text-neutral-600 italic leading-relaxed">
                “{selectedText}”
              </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">点评内容</label>
              <textarea 
                autoFocus
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all h-32 resize-none leading-relaxed text-sm"
                placeholder="在此输入您的专家见解..."
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCommentModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAddComment}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
