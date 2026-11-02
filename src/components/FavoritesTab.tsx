import React, { useState } from 'react';
import { Heart, Search, Filter, Sparkles, BookHeart } from 'lucide-react';
import { ShayariItem, CategoryId } from '../types/shayari';
import { CATEGORIES } from '../data/categories';
import { ShayariCard } from './ShayariCard';
import { DiscoveryService } from '../services/discoveryService';

interface FavoritesTabProps {
  favorites: ShayariItem[];
  downloads: ShayariItem[];
  onToggleFavorite: (item: ShayariItem) => void;
  onDownloadOffline: (item: ShayariItem) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onReport: (item: ShayariItem) => void;
  onGoHome: () => void;
  onShowToast?: (msg: string) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  favorites,
  downloads,
  onToggleFavorite,
  onDownloadOffline,
  onOpenImageModal,
  onReport,
  onGoHome,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const filteredFavorites = (
    searchQuery.trim()
      ? DiscoveryService.searchCuratedArchive(searchQuery, favorites)
      : favorites
  ).filter((item) => {
    return selectedCategory === 'all' || item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white p-6 rounded-3xl shadow-sm border border-rose-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
              <h2 className="text-xl font-bold font-nepali tracking-tight">
                मनपरेका रचनाहरू (Favorites)
              </h2>
            </div>
            <p className="text-xs text-rose-100 font-nepali">
              तपाईंले सुरक्षित गर्नुभएका मन छुने शायरी र कविताहरू। यो तपाईंको उपकरणमा सधैं रहन्छ।
            </p>
          </div>
          <span className="text-2xl font-bold font-mono bg-white/10 px-3.5 py-1 rounded-2xl border border-white/20">
            {favorites.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="मनपरेका शायरीभित्र खोज्नुहोस्..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali"
          />
        </div>

        {/* Category Horizontal Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            सबै ({favorites.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = favorites.filter((f) => f.category === cat.id).length;
            if (count === 0 && favorites.length > 0) return null; // hide empty categories to keep clean
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-nepali font-medium transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.nameNepali} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* List or Empty State */}
      {favorites.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <BookHeart className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-800 font-nepali">
              कुनै मनपर्ने शायरी छैन
            </h3>
            <p className="text-xs text-slate-500 font-nepali leading-relaxed">
              कुनै पनि शायरीको मुटु (Heart) बटन थिचेर यहाँ सुरक्षित गर्न सक्नुहुन्छ। एप बन्द गरेर फेरि खोल्दा पनि यहाँ पाइनेछ।
            </p>
          </div>
          <button
            onClick={onGoHome}
            className="min-h-[44px] px-6 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>शायरीहरू हेर्नुहोस् (Explore)</span>
          </button>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700 font-nepali">
            यो खोज वा विधामा कुनै मनपर्ने शायरी भेटिएन।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs text-rose-700 font-medium underline"
          >
            फिल्टर हटाउनुहोस्
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFavorites.map((item) => (
            <ShayariCard
              key={item.id}
              item={item}
              isFavorite={true}
              isDownloaded={downloads.some((d) => d.id === item.id)}
              onToggleFavorite={onToggleFavorite}
              onDownloadOffline={onDownloadOffline}
              onOpenImageModal={onOpenImageModal}
              onReport={onReport}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
