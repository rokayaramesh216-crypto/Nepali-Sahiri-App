import React, { useState } from 'react';
import { Download, Search, Trash2, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { ShayariItem } from '../types/shayari';
import { ShayariCard } from './ShayariCard';
import { DiscoveryService } from '../services/discoveryService';

interface DownloadsTabProps {
  downloads: ShayariItem[];
  favorites: ShayariItem[];
  onToggleFavorite: (item: ShayariItem) => void;
  onRemoveDownload: (id: string) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onReport: (item: ShayariItem) => void;
  onGoHome: () => void;
  onShowToast?: (msg: string) => void;
}

export const DownloadsTab: React.FC<DownloadsTabProps> = ({
  downloads,
  favorites,
  onToggleFavorite,
  onRemoveDownload,
  onOpenImageModal,
  onReport,
  onGoHome,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDownloads = searchQuery.trim()
    ? DiscoveryService.searchCuratedArchive(searchQuery, downloads)
    : downloads;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-emerald-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Download className="w-5 h-5 text-emerald-300" />
              <h2 className="text-xl font-bold font-nepali tracking-tight">
                अफ्लाइन पढाइ र डाउनलोडहरू (Offline Reading)
              </h2>
            </div>
            <p className="text-xs text-emerald-100 font-nepali">
              इन्टरनेट नहुँदा पनि जुनसुकै बेला पढ्न सकिने सुरक्षित सामग्रीहरू।
            </p>
          </div>
          <span className="text-2xl font-bold font-mono bg-white/10 px-3.5 py-1 rounded-2xl border border-white/20">
            {downloads.length}
          </span>
        </div>
      </div>

      {/* Offline Status Badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>सबै सामग्री स्थानीय स्टोरेज (Room Database) मा सुरक्षित छन् — इन्टरनेट आवश्यक पर्दैन।</span>
        </div>
        <span className="font-mono text-[11px] text-emerald-700 font-semibold uppercase">
          100% Offline
        </span>
      </div>

      {/* Search Bar */}
      {downloads.length > 0 && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="डाउनलोड गरिएका शायरीमा खोज्नुहोस्..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-emerald-600 font-nepali"
            />
          </div>
        </div>
      )}

      {/* Content Grid or Empty State */}
      {downloads.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-slate-800 font-nepali">
              कुनै अफ्लाइन सामग्री सुरक्षित छैन
            </h3>
            <p className="text-xs text-slate-500 font-nepali leading-relaxed">
              कुनै पनि कार्डको डाउनलोड (Download) आइकन थिचेर अफ्लाइन पढ्न सुरक्षित गर्न सक्नुहुन्छ।
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
      ) : filteredDownloads.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-700 font-nepali">
            यो खोजमा कुनै डाउनलोड गरिएको शायरी भेटिएन।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDownloads.map((item) => (
            <div key={item.id} className="relative group">
              <ShayariCard
                item={item}
                isFavorite={favorites.some((f) => f.id === item.id)}
                isDownloaded={true}
                onToggleFavorite={onToggleFavorite}
                onDownloadOffline={() => onRemoveDownload(item.id)}
                onOpenImageModal={onOpenImageModal}
                onReport={onReport}
                onShowToast={onShowToast}
              />
              <button
                onClick={() => onRemoveDownload(item.id)}
                className="absolute top-4 right-14 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg shadow-xs border border-slate-200 text-xs transition-colors"
                title="अफ्लाइनबाट हटाउनुहोस् (Delete Download)"
                aria-label="Remove download"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
