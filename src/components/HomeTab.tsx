import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Calendar,
  Share2,
  Copy,
  Check,
  Image as ImageIcon,
  Heart,
  SlidersHorizontal,
  Globe2,
  ExternalLink,
  Eye,
  RotateCcw
} from 'lucide-react';
import { ShayariItem, CategoryId, ItemType } from '../types/shayari';
import { CATEGORIES } from '../data/categories';
import { ShayariCard } from './ShayariCard';
import { AdMobBanner } from './AdMobBanner';
import { DiscoveryService } from '../services/discoveryService';
import { StorageService } from '../services/storage';

interface HomeTabProps {
  items: ShayariItem[];
  favorites: ShayariItem[];
  downloads: ShayariItem[];
  onToggleFavorite: (item: ShayariItem) => void;
  onDownloadOffline: (item: ShayariItem) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onReport: (item: ShayariItem) => void;
  onShowComposeGuide: () => void;
  onNavigateTab: (tab: any) => void;
  onDeleteCreation?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  items,
  favorites,
  downloads,
  onToggleFavorite,
  onDownloadOffline,
  onOpenImageModal,
  onReport,
  onShowComposeGuide,
  onNavigateTab,
  onDeleteCreation,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDaily, setCopiedDaily] = useState(false);
  const [seenCount, setSeenCount] = useState<number>(StorageService.getSeenCount());
  const [onlyUnseen, setOnlyUnseen] = useState<boolean>(false);

  useEffect(() => {
    const handleSeenUpdate = () => setSeenCount(StorageService.getSeenCount());
    window.addEventListener('seen_history_updated', handleSeenUpdate);
    return () => window.removeEventListener('seen_history_updated', handleSeenUpdate);
  }, []);

  // Daily Quote logic (deterministic based on date)
  const dailyQuote = useMemo(() => {
    if (!items.length) return null;
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const index = dayOfYear % items.length;
    return items[index];
  }, [items]);

  // Filtered Items using tokenized smart search ignoring extra spaces & cases
  const filteredItems = useMemo(() => {
    let pool = items;
    if (searchQuery.trim()) {
      // Search finds all items, including seen ones
      pool = DiscoveryService.searchCuratedArchive(searchQuery, items);
    } else if (onlyUnseen) {
      // Unseen mode hides previously seen items
      pool = pool.filter(item => !StorageService.isItemSeen(item));
    }
    return pool.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchType = selectedType === 'all' || item.type === selectedType;
      return matchCategory && matchType;
    });
  }, [items, selectedCategory, selectedType, searchQuery, onlyUnseen, seenCount]);

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    (searchQuery.trim() || 'नेपाली शायरी') + ' नेपाली शायरी'
  )}`;

  const handleCopyDaily = async () => {
    if (!dailyQuote) return;
    const text = `${dailyQuote.content}\n\n— ${dailyQuote.author}\n[आजको दैनिक विचार • मनका शब्द]`;
    await navigator.clipboard.writeText(text);
    setCopiedDaily(true);
    setTimeout(() => setCopiedDaily(false), 2000);
  };

  const formattedToday = new Date().toLocaleDateString('ne-NP', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Daily Shayari Hero Showcase */}
      {dailyQuote && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900 via-rose-950 to-red-950 text-white p-6 sm:p-7 shadow-md border border-rose-800/80">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs mb-3 text-rose-200">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-nepali">आजको विचार / दैनिक शायरी</span>
                <span aria-hidden="true" className="opacity-50">·</span>
                <span className="font-nepali text-[11px] opacity-80">{formattedToday}</span>
              </div>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Daily Pick
              </span>
            </div>

            {dailyQuote.title && (
              <h2 className="text-lg font-bold font-nepali tracking-tight text-white mb-2">
                {dailyQuote.title}
              </h2>
            )}

            <p className="text-base sm:text-lg leading-relaxed font-nepali text-rose-50 whitespace-pre-line my-3 max-w-2xl">
              {dailyQuote.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-rose-800/60">
              <span className="text-sm font-semibold text-amber-200 font-nepali">
                — {dailyQuote.author}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleFavorite(dailyQuote)}
                  className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors ${
                    favorites.some((f) => f.id === dailyQuote.id)
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="मनपर्नेमा राख्नुहोस्"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      favorites.some((f) => f.id === dailyQuote.id) ? 'fill-white' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={handleCopyDaily}
                  className="min-h-[44px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  {copiedDaily ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>प्रतिलिपि</span>
                </button>

                <button
                  onClick={() => onOpenImageModal(dailyQuote)}
                  className="min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>फोटो कार्ड बनाउनुहोस्</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Quick Action Banner */}
      <div className="bg-gradient-to-r from-rose-900 to-red-950 text-white rounded-3xl p-4 sm:p-5 shadow-xs border border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold font-nepali">
                सार्वजनिक साहित्य समुदाय (Public Community)
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-xs text-rose-200 font-nepali">
              सबै प्रयोगकर्ताहरूका ताजा रचनाहरू पढ्नुहोस् र आफ्नै रचना सबैमाझ प्रकाशित गर्नुहोस्।
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => onNavigateTab('community')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white text-rose-900 hover:bg-rose-50 text-xs font-bold transition-all shadow-xs"
          >
            समुदाय फिड हेर्नुहोस्
          </button>
          <button
            onClick={() => onNavigateTab('create')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition-all border border-rose-700"
          >
            शायरी पोस्ट गर्नुहोस्
          </button>
        </div>
      </div>

      {/* 2. Real-Time Search & Category Filter Section */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="शायरी, कवि, विधा वा शब्द खोज्नुहोस्..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali"
          />
        </div>

        {/* Categories Bar */}
        <div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-xl font-medium transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-rose-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              सबै विधा ({items.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-xl font-nepali font-medium transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-rose-700 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.nameNepali} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Sub-filter (Shayari, Muktak, Ghazal, Poem, Quote, Status) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-400 shrink-0 text-[11px] font-medium mr-1">प्रकार:</span>
            {[
              { id: 'all', label: 'सबै' },
              { id: 'shayari', label: 'शायरी' },
              { id: 'muktak', label: 'मुक्तक' },
              { id: 'ghazal', label: 'गजल' },
              { id: 'poem', label: 'कविता' },
              { id: 'quote', label: 'सुविचार' },
              { id: 'status', label: 'स्ट्याटस' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id as any)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-rose-100 text-rose-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setOnlyUnseen(!onlyUnseen)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                onlyUnseen
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="पहिले नहेरिएका नयाँ रचनाहरू मात्र देखाउनुहोस्"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>नयाँ मात्र</span>
            </button>

            {seenCount > 0 && (
              <button
                onClick={() => {
                  StorageService.resetSeenHistory();
                  if (onShowToast) onShowToast('हेरिएको इतिहास रिसेट गरियो ✨');
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="हेरिएको इतिहास रिसेट गर्नुहोस्"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>रिसेट ({seenCount})</span>
              </button>
            )}

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              जम्मा: {filteredItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Non-intrusive AdMob Banner */}
      <AdMobBanner placement="inline" onShowComposeGuide={onShowComposeGuide} />

      {/* 4. Shayari Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <p className="text-base font-bold text-slate-800 font-nepali">
              "{searchQuery || 'विधा'}" सँग ठ्याक्कै मेल खाने नयाँ रचना भेटिएन
            </p>
            <p className="text-xs text-slate-500 font-nepali max-w-md mx-auto">
              तपाईं तलको बटनबाट सिधै गुगलमा खोज्न सक्नुहुन्छ, वा तल प्रस्तुत गरिएका लोकप्रिय रचनाहरू पढ्न सक्नुहुन्छ:
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {searchQuery && (
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4" />
                  <span>गुगलमा खोज्नुहोस्: "{searchQuery.slice(0, 15)}"</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedType('all');
                  setOnlyUnseen(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                फिल्टर हटाउनुहोस्
              </button>
            </div>
          </div>

          {/* Keep existing shayari visible */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-nepali">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>लोकप्रिय नेपाली शायरी तथा कविताहरू:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.slice(0, 6).map((item) => (
                <ShayariCard
                  key={item.id}
                  item={item}
                  isFavorite={favorites.some((f) => f.id === item.id)}
                  isDownloaded={downloads.some((d) => d.id === item.id)}
                  isSeen={StorageService.isItemSeen(item)}
                  onToggleFavorite={onToggleFavorite}
                  onDownloadOffline={onDownloadOffline}
                  onOpenImageModal={onOpenImageModal}
                  onReport={onReport}
                  onDelete={item.isUserCreated && onDeleteCreation ? onDeleteCreation : undefined}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <ShayariCard
              key={item.id}
              item={item}
              isFavorite={favorites.some((f) => f.id === item.id)}
              isDownloaded={downloads.some((d) => d.id === item.id)}
              isSeen={StorageService.isItemSeen(item)}
              onToggleFavorite={onToggleFavorite}
              onDownloadOffline={onDownloadOffline}
              onOpenImageModal={onOpenImageModal}
              onReport={onReport}
              onDelete={item.isUserCreated && onDeleteCreation ? onDeleteCreation : undefined}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
