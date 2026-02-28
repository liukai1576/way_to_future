import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, ChevronLeft, MoreVertical, RotateCcw, RotateCw, ListMusic, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

export default function Playlist() {
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: any }>();

  useEffect(() => {
    const fetchArticles = async () => {
      const res = await fetch('/api/articles?status=published');
      let data = await res.json();
      data = sortData(data, sortOrder);
      setPlaylist(data);
      const params = new URLSearchParams(location.search);
      const articleId = params.get('articleId');
      if (articleId) {
        const index = data.findIndex((a: any) => a.id === articleId);
        if (index !== -1) { setCurrentTrack(index); setIsPlaying(true); }
      }
      setLoading(false);
    };
    fetchArticles();
  }, [location.search]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.play().catch(err => { console.error("Playback failed:", err); setIsPlaying(false); }); }
      else { audioRef.current.pause(); }
    }
  }, [isPlaying, currentTrack]);

  const sortData = (data: any[], order: 'desc' | 'asc') => {
    return [...data].sort((a, b) => { const dateA = new Date(a.publish_date).getTime(); const dateB = new Date(b.publish_date).getTime(); return order === 'desc' ? dateB - dateA : dateA - dateB; });
  };
  const handleSortToggle = () => { const newOrder = sortOrder === 'desc' ? 'asc' : 'desc'; setSortOrder(newOrder); setPlaylist(sortData(playlist, newOrder)); const currentId = playlist[currentTrack]?.id; const newIndex = sortData(playlist, newOrder).findIndex(a => a.id === currentId); if (newIndex !== -1) setCurrentTrack(newIndex); };
  const togglePlay = () => { if (!isPlaying && playlist.length > 0) { fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, article_id: playlist[currentTrack].id, action: 'listen' }) }); } setIsPlaying(!isPlaying); };
  const nextTrack = () => { if (currentTrack < playlist.length - 1) { setCurrentTrack(currentTrack + 1); setIsPlaying(true); } else { setIsPlaying(false); } };
  const prevTrack = () => { if (currentTrack > 0) { setCurrentTrack(currentTrack - 1); setIsPlaying(true); } };
  const selectTrack = (index: number) => { if (index === currentTrack) { togglePlay(); } else { setCurrentTrack(index); setIsPlaying(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const handleMoreClick = () => { alert('更多功能（倍速播放、定时关闭）即将上线，敬请期待。'); };
  const handleTimeUpdate = () => { if (audioRef.current) { setCurrentTime(audioRef.current.currentTime); } };
  const handleLoadedMetadata = () => { if (audioRef.current) { setDuration(audioRef.current.duration); } };
  const handleSeek = (e: any) => { const time = parseFloat(e.target.value); setCurrentTime(time); if (audioRef.current) { audioRef.current.currentTime = time; } };
  const skipTime = (seconds: number) => { if (audioRef.current) { audioRef.current.currentTime += seconds; } };
  const formatTime = (time: number) => { if (isNaN(time)) return '00:00'; const mins = Math.floor(time / 60); const secs = Math.floor(time % 60); return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; };

  if (loading) return <div className="p-8 text-center text-neutral-400 font-sans">加载中...</div>;
  if (playlist.length === 0) { return (<div className="flex flex-col h-full font-sans bg-neutral-50 p-6"><div className="text-center text-neutral-400 mt-20"><p className="mb-2">暂无播客内容</p></div></div>); }

  const currentItem = playlist[currentTrack];

  return (
    <div className="flex flex-col min-h-full font-sans bg-neutral-50">
      <div className="px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-30 border-b border-neutral-100">
        <button onClick={() => navigate(-1)} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h2 className="text-sm font-bold text-neutral-900">播客播放器</h2>
        <button onClick={handleMoreClick} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"><MoreVertical size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="bg-white p-8 pb-12 rounded-b-[40px] shadow-sm mb-6">
          <div className="flex flex-col items-center">
            <div className="w-56 h-56 rounded-full overflow-hidden shadow-2xl mb-8 border-4 border-white relative group">
              <img src={`https://picsum.photos/seed/${currentItem?.id}/400/400`} alt="专辑封面" className={clsx("w-full h-full object-cover transition-transform duration-1000", isPlaying && "animate-spin-slow")} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/30 backdrop-blur-md rounded-full border border-white/50"></div>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 text-center mb-2 leading-tight px-4">{currentItem?.title}</h3>
            <p className="text-xs text-neutral-500 mb-8 flex items-center gap-1">正在播放：{currentItem?.tags?.[0] || '深度专题'} <span className="text-orange-500">●</span></p>
            <div className="w-full mb-8 px-4">
              <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-neutral-100 rounded-full mb-2 appearance-none cursor-pointer accent-orange-500" />
              <div className="flex justify-between text-[10px] font-medium text-neutral-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
            </div>
            <div className="flex items-center justify-center gap-6 w-full">
              <audio ref={audioRef} src={currentItem?.podcast_url} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={nextTrack} />
              <button onClick={() => skipTime(-15)} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" aria-label="后退15秒"><RotateCcw size={18} /></button>
              <button onClick={prevTrack} disabled={currentTrack === 0} className="p-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 transition-colors" aria-label="上一首"><SkipBack size={22} fill="currentColor" /></button>
              <button onClick={togglePlay} className="w-14 h-14 flex items-center justify-center bg-orange-500 text-white rounded-full shadow-lg shadow-orange-200 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all" aria-label={isPlaying ? "暂停" : "播放"}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}</button>
              <button onClick={nextTrack} disabled={currentTrack === playlist.length - 1} className="p-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 transition-colors" aria-label="下一首"><SkipForward size={22} fill="currentColor" /></button>
              <button onClick={() => skipTime(15)} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" aria-label="快进15秒"><RotateCw size={18} /></button>
            </div>
          </div>
        </div>
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><ListMusic size={18} className="text-orange-500" /><h3 className="text-sm font-bold text-neutral-900">播放列表</h3><span className="text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-md">{playlist.length}</span></div>
            <button onClick={handleSortToggle} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-orange-500 transition-colors"><ArrowUpDown size={14} />{sortOrder === 'desc' ? '最新优先' : '最早优先'}</button>
          </div>
          <div className="space-y-3">
            {playlist.map((item, index) => (
              <button key={item.id} onClick={() => selectTrack(index)} className={clsx("w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left", currentTrack === index ? "bg-orange-50 border border-orange-100 shadow-sm" : "bg-white border border-transparent hover:border-neutral-200")}>
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={`https://picsum.photos/seed/${item.id}/100/100`} alt="封面" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {currentTrack === index && isPlaying && (<div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="flex gap-0.5 items-end h-3"><div className="w-0.5 bg-white animate-[music-bar_0.6s_ease-in-out_infinite]"></div><div className="w-0.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]"></div><div className="w-0.5 bg-white animate-[music-bar_0.7s_ease-in-out_infinite_0.2s]"></div></div></div>)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx("text-sm font-bold truncate mb-0.5", currentTrack === index ? "text-orange-600" : "text-neutral-900")}>{item.title}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{item.tags?.[0]}</p>
                </div>
                {currentTrack === index ? (<div className="text-orange-500">{isPlaying ? <Pause size={18} /> : <Play size={18} />}</div>) : (<div className="text-neutral-300"><Play size={18} /></div>)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes music-bar { 0%, 100% { height: 4px; } 50% { height: 12px; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
}