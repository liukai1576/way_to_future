import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Share2, Bookmark, MessageSquare, FileText, ExternalLink } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import clsx from 'clsx';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spectrum');
  const { user } = useOutletContext<{ user: any }>();

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Article Data:', data);
        setArticle(data);
        setLoading(false);
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, article_id: id, action: 'view' })
        });
      });
  }, [id]);

  const handleListenNow = () => {
    navigate(`/playlist?articleId=${id}`);
  };

  const handleShare = () => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, article_id: id, action: 'share' })
    });
    alert('链接已复制，分享给其他一把手。');
  };

  if (loading) return <div className="p-8 text-center text-neutral-400 font-sans">加载中...</div>;
  if (!article) return <div className="p-8 text-center text-red-500 font-sans">文章未找到</div>;

  return (
    <div className="bg-white min-h-full pb-24 font-sans">
      <div className="sticky top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <button onClick={() => navigate(-1)} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
            <Share2 size={20} />
          </button>
          <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
            <Bookmark size={20} />
          </button>
        </div>
      </div>
      <div className="w-full h-72 relative rounded-b-[40px] overflow-hidden shadow-sm">
        <img src={`https://picsum.photos/seed/${article.id}/800/800`} alt="封面" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
      <div className="p-6 -mt-10 relative z-10 bg-white rounded-t-[40px]">
        <h1 className="text-2xl font-bold text-neutral-900 leading-snug mb-2 text-center">{article.title}</h1>
        <p className="text-sm text-neutral-500 mb-6 text-center">by {article.tags?.[0] || '作者'}</p>
        <Tabs.Root key={article.id} defaultValue="spectrum" value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <Tabs.List className="flex border-b border-neutral-100 mb-6">
            <Tabs.Trigger value="spectrum" className="flex-1 py-3 text-sm font-medium text-neutral-500 data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 transition-colors">播客</Tabs.Trigger>
            <Tabs.Trigger value="infographic" className="flex-1 py-3 text-sm font-medium text-neutral-500 data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 transition-colors">信息图</Tabs.Trigger>
            <Tabs.Trigger value="summary" className="flex-1 py-3 text-sm font-medium text-neutral-500 data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 transition-colors">摘要 PPT</Tabs.Trigger>
            <Tabs.Trigger value="text" className="flex-1 py-3 text-sm font-medium text-neutral-500 data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 transition-colors">原文</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="spectrum" className="outline-none">
            <div className="bg-neutral-900 rounded-2xl aspect-[16/9] flex flex-col items-center justify-center p-6 relative overflow-hidden group">
              <div className="flex items-end gap-1 h-32 mb-4">
                {[...Array(20)].map((_, i) => (<div key={i} className="w-2 bg-orange-500 rounded-t-full animate-[music-bar_1s_ease-in-out_infinite]" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s` }}></div>))}
              </div>
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Podcast Audio Analysis</p>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none"></div>
            </div>
            <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <h4 className="text-sm font-bold text-neutral-900 mb-2">播客要点分析</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">通过 AI 语音分析，本文的核心关键词集中在：商业模式、大模型、业务创新。音频情绪基调为：专业、前瞻、启发。</p>
            </div>
          </Tabs.Content>
          <Tabs.Content value="infographic" className="outline-none">
            <div className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-50 min-h-[300px] flex items-center justify-center">
              {article.infographic_url ? (<img src={article.infographic_url} alt="信息图" className="w-full h-auto" referrerPolicy="no-referrer" />) : (<div className="text-neutral-400 text-sm">暂未上传信息图</div>)}
            </div>
          </Tabs.Content>
          <Tabs.Content value="summary" className="outline-none">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><FileText size={16} className="text-blue-500" />深度摘要预览 (PDF)</h3>
              </div>
              <div className="bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 shadow-inner relative group h-[500px]">
                {article.presentation_url && article.presentation_url.trim() !== '' ? (<iframe src={article.presentation_url} className="w-full h-full border-0" title="PPT Preview" onError={(e) => console.error('Iframe load error:', e)} />) : (<div className="flex items-center justify-center h-full text-neutral-400 text-sm">暂未上传摘要 PPT</div>)}
              </div>
              {article.presentation_url && article.presentation_url.trim() !== '' && (<a href={article.presentation_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all"><ExternalLink size={18} />在浏览器中打开完整文件</a>)}
            </div>
          </Tabs.Content>
          <Tabs.Content value="text" className="outline-none">
            <div className="prose prose-neutral prose-sm max-w-none">
              {article.content.split(/(?:\r?\n|\\n)+/).filter(Boolean).map((paragraph: string, idx: number) => {
                const comment = article.comments?.find((c: any) => paragraph.includes(c.highlight_text));
                if (comment) {
                  const parts = paragraph.split(comment.highlight_text);
                  return (<div key={idx} className="mb-6 relative"><p className="text-neutral-800 leading-relaxed text-[15px]">{parts[0]}<span className="bg-amber-100 text-amber-900 px-1 rounded mx-0.5 border-b border-amber-300">{comment.highlight_text}</span>{parts[1]}</p><div className="mt-3 bg-neutral-50 border-l-4 border-orange-500 p-3 rounded-r-lg text-sm text-neutral-600 flex gap-3 items-start"><MessageSquare size={16} className="text-orange-500 mt-0.5 shrink-0" /><div><span className="font-semibold text-orange-900 block mb-1">专家点评</span>{comment.text}</div></div></div>);
                }
                return (<p key={idx} className="text-neutral-800 leading-relaxed text-[15px] mb-4">{paragraph}</p>);
              })}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
      {activeTab === 'spectrum' && (
        <div className="fixed bottom-20 left-0 right-0 px-6 z-20 max-w-md mx-auto">
          <div className="bg-white rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] p-2 flex items-center justify-between border border-neutral-100">
            <div className="pl-4">
              <span className="text-xs text-neutral-500 block">状态</span>
              <span className="font-bold text-neutral-900">已准备好收听</span>
            </div>
            <button onClick={handleListenNow} className="px-8 py-3 rounded-full font-bold shadow-md bg-orange-500 text-white hover:bg-orange-600 transition-colors">立即听播客</button>
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
