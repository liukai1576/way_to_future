import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('全部');
  const { user } = useOutletContext<{ user: any }>();

  useEffect(() => {
    fetch('/api/articles?status=published')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setFilteredArticles(data);
        setLoading(false);
      });
  }, []);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag === '全部') {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter(a => a.tags.includes(tag)));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-neutral-400 font-sans">加载中...</div>;
  }

  const featuredArticle = articles[0];

  return (
    <div className="p-4 space-y-6 font-sans">
      {/* 欢迎区域 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="头像" />
          </div>
          <div>
            <h2 className="text-sm text-neutral-500">您好，{user.name}！</h2>
            <p className="text-lg font-bold text-neutral-900">开始阅读吧</p>
          </div>
        </div>

        {/* 精选文章卡片 */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/20 rounded-full -ml-8 -mb-8 blur-xl"></div>
          <div className="relative z-10 flex gap-4">
            <div className="flex-1">
              <span className="inline-block text-xs font-semibold mb-1 opacity-90">
                #为您精选
              </span>
              <h3 className="text-xl font-bold leading-tight mb-1">
                本周必读
              </h3>
              <p className="text-sm mb-4 opacity-90">获取深度商业洞察</p>
              <Link 
                to={featuredArticle ? `/article/${featuredArticle.id}` : '#'}
                className="inline-block bg-white text-orange-600 px-5 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-neutral-50 transition-colors"
              >
                立即阅读
              </Link>
            </div>
            <div className="w-24 shrink-0">
              <img 
                src={featuredArticle ? `https://picsum.photos/seed/${featuredArticle.id}/200/300` : "https://picsum.photos/seed/reading/200/300"} 
                alt="封面" 
                className="rounded-xl shadow-md object-cover h-full w-full" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 分类标签与内容列表结合 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">内容分类</h3>
          <span className="text-sm text-neutral-500">共 {filteredArticles.length} 篇</span>
        </div>
        
        {/* 标签列表 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sticky top-0 bg-neutral-50/80 backdrop-blur-sm z-10">
          {['全部', 'AI新知', '商业战略', '商业案例', '领导力', '前沿技术', '基础设施'].map((tag) => (
            <button 
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedTag === tag ? "bg-orange-500 text-white shadow-md" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 垂直网格列表 */}
        <div className="grid grid-cols-2 gap-4">
          {filteredArticles.map((article) => (
            <Link 
              key={article.id} 
              to={`/article/${article.id}`}
              className="block group"
            >
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-3 shadow-sm relative group-hover:shadow-md transition-shadow">
                <img 
                  src={`https://picsum.photos/seed/${article.id}/400/600`} 
                  alt="封面" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">{article.title}</h4>
                </div>
              </div>
              <div className="px-1">
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">
                  {article.tags?.[0]}
                </p>
                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  发布于 {format(new Date(article.publish_date), 'MM月dd日', { locale: zhCN })}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="py-20 text-center text-neutral-400">
            暂无该分类下的内容
          </div>
        )}
      </div>
    </div>
  );
}
