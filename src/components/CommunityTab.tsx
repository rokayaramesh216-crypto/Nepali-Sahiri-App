import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Sparkles,
  Search,
  Filter,
  Heart,
  Share2,
  Copy,
  Image as ImageIcon,
  Flag,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  Check,
  TrendingUp,
  Clock,
  Globe,
  Lock,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';
import { ShayariItem, CategoryId } from '../types/shayari';
import { CATEGORIES } from '../data/categories';
import { CommunityService } from '../services/communityService';
import { StorageService } from '../services/storage';

interface CommunityTabProps {
  favorites: ShayariItem[];
  downloads: ShayariItem[];
  onToggleFavorite: (item: ShayariItem) => void;
  onDownloadOffline: (item: ShayariItem) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onNavigateToCreate: () => void;
  onShowToast: (msg: string) => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
  favorites,
  downloads,
  onToggleFavorite,
  onDownloadOffline,
  onOpenImageModal,
  onNavigateToCreate,
  onShowToast
}) => {
  const [posts, setPosts] = useState<ShayariItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Community Stats
  const [stats, setStats] = useState<{
    totalPublished: number;
    totalLikes: number;
    storageType: string;
  }>({
    totalPublished: 0,
    totalLikes: 0,
    storageType: 'Shared Online Database'
  });

  // Moderation / Report Modal state
  const [reportingPost, setReportingPost] = useState<ShayariItem | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'inappropriate' | 'copyright' | 'hate_speech' | 'other'>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Liked tracking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const loadCommunityData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const data = await CommunityService.fetchPosts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: sortBy,
        search: searchQuery.trim() || undefined
      });
      setPosts(data.posts);

      // Initialize liked map
      const initialLiked: Record<string, boolean> = {};
      data.posts.forEach((p) => {
        if (CommunityService.isPostLiked(p.id)) {
          initialLiked[p.id] = true;
        }
      });
      setLikedPosts(initialLiked);

      // Fetch stats
      const statsData = await CommunityService.getStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load community feed:', err);
      setError(err.message || 'सामुदायिक पोस्टहरू लोड गर्न सकिएन');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, sortBy, searchQuery]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData(true);
    onShowToast('सामुदायिक फिड अपडेट भयो 🔄');
  };

  const handleLike = async (item: ShayariItem) => {
    if (likedPosts[item.id]) {
      onShowToast('तपाईंले यो पोस्ट पहिले नै लाइक गरिसक्नुभयो ❤️');
      return;
    }

    // Optimistic update
    setLikedPosts((prev) => ({ ...prev, [item.id]: true }));
    setPosts((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p))
    );

    try {
      await CommunityService.likePost(item.id);
      onShowToast('लाइक थपियो! ❤️');
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleCopy = async (item: ShayariItem) => {
    const shareText = `${item.title ? item.title + '\n\n' : ''}${item.content}\n\n— ${item.author} (समुदाय स्रष्टा)\n[मनका शब्द - नेपाली शायरी एपबाट साभार]`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(item.id);
      onShowToast('रचना प्रतिलिपि (Copy) भयो 📋');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async (item: ShayariItem) => {
    const text = `${item.title ? item.title + '\n\n' : ''}${item.content}\n\n— ${item.author}\n[मनका शब्द - नेपाली साहित्य समुदाय]`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'नेपाली शायरी',
          text,
          url: window.location.href
        });
        CommunityService.sharePost(item.id);
        onShowToast('साझा गरियो 📤');
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy(item);
    }
  };

  const handleOpenReportModal = (item: ShayariItem) => {
    setReportingPost(item);
    setReportReason('spam');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;

    setIsSubmittingReport(true);
    try {
      const res = await CommunityService.reportPost(
        reportingPost.id,
        reportReason,
        reportDetails,
        reportingPost.title
      );

      if (res.autoHidden) {
        setPosts((prev) => prev.filter((p) => p.id !== reportingPost.id));
        onShowToast('उजुरी प्राप्त भयो। पोस्ट समुदायबाट हटाइएको छ। 🛡️');
      } else {
        onShowToast('उजुरी सफलतापूर्वक दर्ता भयो। धन्यवाद! 🛡️');
      }
      setReportingPost(null);
    } catch (err: any) {
      onShowToast(err.message || 'उजुरी पठाउन सकिएन');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Community Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900 to-red-950 text-white p-6 shadow-md border border-rose-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                साझा अनलाइन डाटाबेस सक्रिय (Shared Online Database)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-nepali">
              सार्वजनिक नेपाली साहित्य समुदाय
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-1 max-w-xl font-nepali leading-relaxed">
              सबै प्रयोगकर्ताहरूले लेखेका र साझा गरेका मौलिक शायरी, कविता, गजल, मुक्तक र सुविचारहरू। आफ्नो रचना पनि यहाँ सबैमाझ प्रकाशित गर्नुहोस्।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onNavigateToCreate}
              className="px-4 py-2.5 bg-white text-rose-900 hover:bg-rose-50 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-rose-700" />
              <span>शायरी पोस्ट गर्नुहोस्</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-rose-800/80 hover:bg-rose-800 text-rose-100 rounded-2xl text-xs border border-rose-700 transition-colors flex items-center gap-1.5"
              title="ताजा पोस्टहरू लोड गर्नुहोस्"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेस</span>
            </button>
          </div>
        </div>

        {/* Live Community Counters */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-4 border-t border-rose-800/80 text-center">
          <div className="bg-rose-900/40 rounded-2xl p-2.5 border border-rose-700/50">
            <div className="text-lg sm:text-xl font-black text-white">{stats.totalPublished || posts.length}</div>
            <div className="text-[10px] sm:text-xs text-rose-200 font-nepali">सार्वजनिक रचनाहरू</div>
          </div>
          <div className="bg-rose-900/40 rounded-2xl p-2.5 border border-rose-700/50">
            <div className="text-lg sm:text-xl font-black text-rose-300">{stats.totalLikes || posts.reduce((a, b) => a + (b.likesCount || 0), 0)}</div>
            <div className="text-[10px] sm:text-xs text-rose-200 font-nepali">समुदायका लाइकहरू</div>
          </div>
          <div className="bg-rose-900/40 rounded-2xl p-2.5 border border-rose-700/50">
            <div className="text-lg sm:text-xl font-black text-emerald-300 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>सक्रिय</span>
            </div>
            <div className="text-[10px] sm:text-xs text-rose-200 font-nepali">स्पाम तथा सुरक्षा फिल्टर</div>
          </div>
        </div>
      </div>

      {/* Distinction Guide Notice Box */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1 font-nepali">
          <div className="font-bold text-amber-900">
            स्पष्ट भिन्नता: सार्वजनिक पोस्ट बनाम व्यक्तिगत मस्यौदा र मनपरेका
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-amber-800 pt-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span><strong>सार्वजनिक (Public):</strong> विश्वभरका सबै प्रयोगकर्ताले देख्छन्।</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span><strong>ड्राफ्ट (Private):</strong> तपाईंको आफ्नै फोनमा मात्र सुरक्षित रहन्छ।</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span><strong>मनपरेका (Favorites):</strong> अफ्लाइनमा जुनसुकै बेला पढ्न सकिने संग्रह।</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="समुदायमा लेखकको नाम, शीर्षक वा शब्द खोज्नुहोस्..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-rose-600 font-nepali transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto shrink-0">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'latest'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ताजा (Latest)</span>
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'popular'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>लोकप्रिय (Popular)</span>
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सबै विधा ({posts.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-rose-700 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.nameNepali}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content State */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 font-nepali">
            साझा अनलाइन डाटाबेसबाट सामुदायिक रचनाहरू लोड हुँदैछन्...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 rounded-3xl p-8 text-center border border-rose-200 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-rose-900 font-nepali">{error}</p>
          <button
            onClick={() => loadCommunityData()}
            className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-semibold hover:bg-rose-800"
          >
            पुनः प्रयास गर्नुहोस्
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            ✍️
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-nepali">
              यस वर्गमा अहिलेसम्म कुनै पोस्ट भेटिएन
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-nepali">
              पहिलो स्रष्टा बनेर आफ्नो मौलिक रचना सबैमाझ प्रकाशित गर्नुहोस्!
            </p>
          </div>
          <button
            onClick={onNavigateToCreate}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all"
          >
            पहिलो रचना पोस्ट गर्नुहोस्
          </button>
        </div>
      ) : (
        /* Community Posts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((item) => {
            const isFav = favorites.some((f) => f.id === item.id);
            const isDown = downloads.some((d) => d.id === item.id);
            const isLiked = likedPosts[item.id];
            const isMyPost = item.isUserCreated;

            return (
              <article
                key={item.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Author, Badge, Time, and Category */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm border border-rose-200 shadow-xs">
                        {item.author.charAt(0) || 'क'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 font-nepali">
                            {item.author}
                          </span>
                          {isMyPost && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              तपाईं
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>समुदाय स्रष्टा</span>
                          <span>•</span>
                          <span>
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ne-NP') : 'भर्खरै'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Title (if present) */}
                  {item.title && (
                    <h3 className="text-base font-bold text-slate-900 font-nepali mb-2">
                      {item.title}
                    </h3>
                  )}

                  {/* Poetry Content with Authentic Layout */}
                  <div className="text-slate-800 font-nepali text-sm sm:text-base leading-relaxed whitespace-pre-line py-2 selection:bg-rose-100">
                    {item.content}
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-nepali"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Interactive Bar */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-slate-600">
                  {/* Left: Like & Favorite actions */}
                  <div className="flex items-center gap-1">
                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(item)}
                      className={`min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLiked
                          ? 'bg-rose-50 text-rose-700'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      title="लाइक गर्नुहोस्"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-mono text-xs">{item.likesCount || 0}</span>
                    </button>

                    {/* Offline Favorite Bookmark */}
                    <button
                      onClick={() => onToggleFavorite(item)}
                      className={`min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isFav
                          ? 'bg-rose-50 text-rose-700'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      title={isFav ? 'मनपरेकाबाट हटाउनुहोस्' : 'मनपरेका सूचीमा सुरक्षित गर्नुहोस्'}
                    >
                      <BookmarkCheck
                        className={`w-4 h-4 ${
                          isFav ? 'text-rose-600 fill-rose-600' : 'text-slate-500'
                        }`}
                      />
                      <span className="hidden sm:inline text-[11px]">
                        {isFav ? 'मनपरेको' : 'सेभ'}
                      </span>
                    </button>
                  </div>

                  {/* Right: HD Image Card, Copy, Share, Report */}
                  <div className="flex items-center gap-1">
                    {/* HD Image Quote Card */}
                    <button
                      onClick={() => onOpenImageModal(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="एचडी फोटो कार्ड (PNG) डाउनलोड"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="प्रतिलिपि (Copy)"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => handleShare(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="साझा गर्नुहोस्"
                    >
                      <Share2 className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Spam / Content Report */}
                    <button
                      onClick={() => handleOpenReportModal(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="स्पाम वा अश्लील सामग्री उजुरी गर्नुहोस्"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Moderation / Spam Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <Flag className="w-5 h-5" />
                <h3 className="font-bold text-base font-nepali text-slate-900">
                  सामुदायिक उजुरी तथा स्पाम रिपोर्ट
                </h3>
              </div>
              <button
                onClick={() => setReportingPost(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-nepali">
              हामी सुरक्षित र मर्यादित नेपाली साहित्यिक वातावरण निर्माण गर्न प्रतिबद्ध छौँ। यो रचनामा के समस्या छ कृपया खुलाउनुहोस्:
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  उजुरीको कारण (Reason) *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-rose-600"
                >
                  <option value="spam">स्पाम वा विज्ञापन (Spam / Promotion)</option>
                  <option value="inappropriate">अभद्र वा अश्लील भाषा (Inappropriate Language)</option>
                  <option value="copyright">प्रतिलिपि अधिकार उल्लंघन (Copyright Violation)</option>
                  <option value="hate_speech">घृणास्पद अभिव्यक्ति (Hate Speech)</option>
                  <option value="other">अन्य समस्या (Other)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  थप विवरण (Details - ऐच्छिक)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="उजुरीसम्बन्धी थप विवरण लेख्नुहोस्..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-rose-600"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 font-nepali">
                🛡️ ३ भन्दा बढी प्रयोगकर्ताबाट उजुरी आएको पोस्ट स्वचालित रूपमा समीक्षाका लागि फिडबाट हटाइन्छ।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmittingReport ? 'पठाउँदै...' : 'उजुरी दर्ता गर्नुहोस्'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
