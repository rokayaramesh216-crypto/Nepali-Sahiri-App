import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Globe2,
  ExternalLink,
  Info,
  Check,
  AlertCircle,
  Plus,
  Compass,
  Sparkles,
  BookOpen,
  RotateCcw,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { ShayariItem, Language } from '../types/shayari';
import { DiscoveryService, DiscoverySearchResult } from '../services/discoveryService';
import { StorageService } from '../services/storage';
import { ShayariCard } from './ShayariCard';

interface DiscoveryTabProps {
  curatedItems: ShayariItem[];
  favorites: ShayariItem[];
  downloads: ShayariItem[];
  onToggleFavorite: (item: ShayariItem) => void;
  onDownloadOffline: (item: ShayariItem) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onReport: (item: ShayariItem) => void;
  onImportToLibrary?: (item: ShayariItem) => void;
  onShowToast?: (msg: string) => void;
}

export const DiscoveryTab: React.FC<DiscoveryTabProps> = ({
  curatedItems,
  favorites,
  downloads,
  onToggleFavorite,
  onDownloadOffline,
  onOpenImageModal,
  onReport,
  onImportToLibrary,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language | 'all'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DiscoverySearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [seenCount, setSeenCount] = useState<number>(StorageService.getSeenCount());

  useEffect(() => {
    const handleSeenUpdate = () => {
      setSeenCount(StorageService.getSeenCount());
    };
    window.addEventListener('seen_history_updated', handleSeenUpdate);
    return () => {
      window.removeEventListener('seen_history_updated', handleSeenUpdate);
    };
  }, []);

  // Deduplicate curated items by unique ID and normalized content hash
  const deduplicatedCurated = useMemo(() => {
    return StorageService.deduplicateShayaris(curatedItems);
  }, [curatedItems]);

  // Hide already-seen items from discovery and recommendation feeds
  const unseenRecommendations = useMemo(() => {
    return deduplicatedCurated.filter(item => !StorageService.isItemSeen(item));
  }, [deduplicatedCurated, seenCount]);

  const handleResetSeenHistory = () => {
    StorageService.resetSeenHistory();
    if (onShowToast) {
      onShowToast('हेरिएको इतिहास रिसेट गरियो! सबै रचनाहरू फेरि नयाँ जस्तै सिफारिसमा देखिनेछन् ✨');
    }
  };

  const handleMarkBatchAsSeen = (batch: ShayariItem[]) => {
    StorageService.markItemAsSeen(batch);
    if (onShowToast) {
      onShowToast(`${batch.length} वटा रचनाहरू हेरिएको सूचीमा दर्ता भए`);
    }
  };

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await DiscoveryService.searchInternet(q, curatedItems);
      setSearchResult(res);
      if (res.items.length > 0 && onShowToast) {
        onShowToast(`${res.items.length} वटा रचनाहरू भेटिए!`);
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickChip = (term: string) => {
    setSearchQuery(term);
    handleSearch(undefined, term);
  };

  const handleImport = (item: ShayariItem) => {
    onDownloadOffline(item);
    setImportedIds(prev => new Set(prev).add(item.id));
    if (onImportToLibrary) {
      onImportToLibrary(item);
    }
    if (onShowToast) {
      onShowToast('रचना अफ्लाइन पुस्तकालयमा थपियो 📥');
    }
  };

  // Filter items by language if specified
  const filteredItems = (searchResult?.items || []).filter(item => {
    if (selectedLang === 'all') return true;
    return item.language === selectedLang;
  });

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    (searchQuery.trim() || 'नेपाली शायरी') + ' नेपाली शायरी'
  )}`;

  const fallbackLinks = DiscoveryService.getFallbackSearchLinks(searchQuery || 'नेपाली शायरी');

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-900 text-white p-6 rounded-3xl shadow-sm border border-rose-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe2 className="w-5 h-5 text-amber-300" />
            <h2 className="text-xl font-bold font-nepali tracking-tight">
              इन्टरनेट तथा साहित्य खोजी (Internet Discovery)
            </h2>
          </div>
          <p className="text-xs text-rose-100 max-w-2xl font-nepali leading-relaxed">
            नेपाली शायरी, कविता, मुक्तक, गजल र सुविचारहरू खोज्नुहोस्। दोहोरिएका रचनाहरू स्वतः हटाइएका छन् र पहिले हेरिसकिएका रचनाहरू सिफारिसमा लुकाइन्छन्।
          </p>
        </div>
        {seenCount > 0 && (
          <button
            onClick={handleResetSeenHistory}
            className="min-h-[40px] px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            title="हेरिएको इतिहास रिसेट गर्नुहोस्"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>इतिहास रिसेट ({seenCount})</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोजी गर्नुहोस् (उदा: परदेशी शायरी, माया, दुःखी मन, नेपाली कविता)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="min-h-[44px] px-6 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>खोज्दैछ...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>खोज्नुहोस्</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips (Includes all requested test topics) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 shrink-0 text-[11px] font-medium mr-1">द्रुत खोजी:</span>
          {[
            'परदेशी शायरी',
            'माया',
            'दुःखी मन',
            'नेपाली कविता',
            'नेपाली मुक्तक',
            'लक्ष्मीप्रसाद देवकोटा',
            'आमाको माया',
            'मुना मदन'
          ].map((term) => (
            <button
              key={term}
              onClick={() => handleQuickChip(term)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-nepali text-xs transition-colors shrink-0"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">भाषा:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(
              [
                { id: 'all', label: 'सबै (All)' },
                { id: 'nepali', label: 'नेपाली' },
                { id: 'hindi', label: 'हिन्दी' },
                { id: 'english', label: 'English' }
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedLang === lang.id
                    ? 'bg-white shadow-xs text-rose-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requirement 5: Clear message when internet access or API configuration status */}
      {hasSearched && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <span>खोज स्रोत स्थिति (Search Status)</span>
                {searchResult?.isLiveGrounded && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    लाइभ इन्टरनेट सक्रिय
                  </span>
                )}
                {searchResult && !searchResult.isApiConfigured && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    स्थानीय अफ्लाइन मोड
                  </span>
                )}
              </div>
              <p className="leading-relaxed font-nepali">
                {searchResult && !searchResult.isApiConfigured
                  ? 'इन्टरनेट एपीआई उपलब्ध नभएकाले स्थानीय प्रमाणित अभिलेखबाट खोजी गरिएको छ। थप इन्टरनेट सामग्रीका लागि तलको गुगल खोजी बटन प्रयोग गर्नुहोस्।'
                  : 'स्थानीय साहित्य भण्डार र अनलाइन स्रोतहरूबाट खोजी सम्पन्न भएको छ।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 3: Direct Google Search Link Button if query entered */}
      {searchQuery.trim() && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-rose-950 font-nepali text-center sm:text-left">
            <span className="font-bold">इन्टरनेटमा सिधै खोज्न चाहनुहुन्छ? </span>
            <span>गुगलमा "{searchQuery}" बारे थप हजारौँ रचनाहरू उपलब्ध छन्।</span>
          </div>
          <a
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>गुगलमा खोज्नुहोस्: "{searchQuery.slice(0, 15)}"</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Grounding web links discovered from live search */}
      {searchResult && searchResult.groundingLinks && searchResult.groundingLinks.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Compass className="w-4 h-4 text-rose-600" />
            <span>इन्टरनेटमा भेटिएका सन्दर्भ स्रोतहरू (Web Sources):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchResult.groundingLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-800 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                <span className="truncate max-w-[200px]">{link.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Area */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              भेटिएका परिणामहरू: <strong className="text-slate-800">{filteredItems.length}</strong>
            </span>
            {searchQuery && (
              <span>खोज शब्द: "{searchQuery}"</span>
            )}
          </div>

          {filteredItems.length === 0 ? (
            /* Requirement 4: Keep existing shayari visible when no search results are found */
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 font-nepali">
                  "{searchQuery}" सँग ठ्याक्कै मेल खाने कुनै नयाँ रचना भेटिएन
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-nepali">
                  तपाईं सिधै गुगलमा खोजी गर्न सक्नुहुन्छ वा तलका लोकप्रिय नेपाली रचनाहरू हेर्न सक्नुहुन्छ:
                </p>
                <div className="pt-2 flex justify-center">
                  <a
                    href={googleSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Globe2 className="w-4 h-4" />
                    <span>गुगलमा खोजी गर्नुहोस् (Google Search)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Keep existing shayari visible */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-nepali">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>लोकप्रिय नेपाली शायरी तथा कविताहरू:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {curatedItems.slice(0, 8).map((item) => (
                    <ShayariCard
                      key={item.id}
                      item={item}
                      isFavorite={favorites.some(f => f.id === item.id)}
                      isDownloaded={downloads.some(d => d.id === item.id)}
                      isSeen={StorageService.isItemSeen(item)}
                      onToggleFavorite={onToggleFavorite}
                      onDownloadOffline={onDownloadOffline}
                      onOpenImageModal={onOpenImageModal}
                      onReport={onReport}
                      onShowToast={onShowToast}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative">
                  <ShayariCard
                    item={item}
                    isFavorite={favorites.some(f => f.id === item.id)}
                    isDownloaded={downloads.some(d => d.id === item.id)}
                    isSeen={StorageService.isItemSeen(item)}
                    onToggleFavorite={onToggleFavorite}
                    onDownloadOffline={onDownloadOffline}
                    onOpenImageModal={onOpenImageModal}
                    onReport={onReport}
                    onShowToast={onShowToast}
                  />
                  <div className="mt-1 flex items-center justify-between px-2 text-[11px]">
                    <span className="text-slate-400">स्रोत: {item.source || 'सार्वजनिक संग्रह'}</span>
                    <button
                      onClick={() => handleImport(item)}
                      className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded transition-colors ${
                        importedIds.has(item.id)
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {importedIds.has(item.id) ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>पुस्तकालयमा छ</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>पुस्तकालयमा थप्नुहोस्</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default view before user types: show fresh, unseen recommendation feed */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 font-nepali">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>नयाँ सिफारिस तथा साहित्यिक रचनाहरू (Recommendations)</span>
              <span className="bg-rose-100 text-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {unseenRecommendations.length} नयाँ बाँकी
              </span>
            </div>

            <div className="flex items-center gap-2">
              {seenCount > 0 && (
                <button
                  onClick={handleResetSeenHistory}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
                  title="हेरिएको इतिहास रिसेट गर्नुहोस्"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>इतिहास रिसेट ({seenCount})</span>
                </button>
              )}
            </div>
          </div>

          {unseenRecommendations.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 font-nepali">
                तपाईंले सबै सिफारिस गरिएका रचनाहरू हेरिसक्नुभयो! 🎉
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-nepali leading-relaxed">
                पुराना कुनै पनि रचना मेटिएका छैनन्। तपाईं माथिको खोजी बाकसबाट पुराना रचना फेला पार्न सक्नुहुन्छ, वा सिफारिसहरू फेरि सुरुदेखि हेर्न इतिहास रिसेट गर्नुहोस्:
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetSeenHistory}
                  className="min-h-[44px] px-6 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>हेरिएको इतिहास रिसेट गर्नुहोस् (Reset Seen History)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unseenRecommendations.slice(0, 6).map((item) => (
                  <ShayariCard
                    key={item.id}
                    item={item}
                    isFavorite={favorites.some(f => f.id === item.id)}
                    isDownloaded={downloads.some(d => d.id === item.id)}
                    isSeen={false}
                    onToggleFavorite={onToggleFavorite}
                    onDownloadOffline={onDownloadOffline}
                    onOpenImageModal={onOpenImageModal}
                    onReport={onReport}
                    onShowToast={onShowToast}
                  />
                ))}
              </div>

              {/* Action to mark currently visible batch as seen and load next batch */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-xs text-slate-600 font-nepali">
                  <span>अहिले {Math.min(6, unseenRecommendations.length)} वटा नयाँ रचनाहरू देखाइँदैछ। बाँकी नयाँ: {Math.max(0, unseenRecommendations.length - 6)} वटा</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkBatchAsSeen(unseenRecommendations.slice(0, 6))}
                    className="min-h-[40px] px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>यी {Math.min(6, unseenRecommendations.length)} हेरेँ, अर्को नयाँ देखाउनुहोस्</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Verified Browser Search Fallback Box */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ExternalLink className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900 font-nepali">
            ब्राउजर खोजी विकल्प (Working Browser Search Fallbacks)
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-nepali">
          यदि तपाईंलाई कुनै खास समकालीन वा बाह्य वेबसाइटको शायरी आवश्यक परेमा, तलका बटनहरूले तपाईंको खोज शब्दलाई सिधै आधिकारिक साहित्यिक पोर्टलहरूमा खोल्नेछ:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fallbackLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 transition-all flex items-start justify-between group"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-rose-800 font-nepali">
                    {link.name}
                  </span>
                  <span className="text-[10px] bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-800 px-1.5 py-0.5 rounded font-medium">
                    {link.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-nepali">
                  {link.desc}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0 ml-2 mt-0.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
