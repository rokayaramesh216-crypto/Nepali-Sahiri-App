import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  PlusCircle,
  Heart,
  Download,
  Smartphone,
  Monitor,
  Shield,
  Code2,
  Sparkles,
  Info,
  Users
} from 'lucide-react';
import { TabId, ShayariItem } from './types/shayari';
import { INITIAL_SHAYARIS } from './data/initialShayaris';
import { StorageService } from './services/storage';
import { HomeTab } from './components/HomeTab';
import { CommunityTab } from './components/CommunityTab';
import { DiscoveryTab } from './components/DiscoveryTab';
import { CreateEditor } from './components/CreateEditor';
import { FavoritesTab } from './components/FavoritesTab';
import { DownloadsTab } from './components/DownloadsTab';
import { ImageQuoteModal } from './components/ImageQuoteModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ReportModal } from './components/ReportModal';
import { ComposeReferenceModal } from './components/ComposeReferenceModal';
import { AdMobBanner } from './components/AdMobBanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [allItems, setAllItems] = useState<ShayariItem[]>([]);
  const [favorites, setFavorites] = useState<ShayariItem[]>([]);
  const [downloads, setDownloads] = useState<ShayariItem[]>([]);

  // Modals state
  const [selectedImageItem, setSelectedImageItem] = useState<ShayariItem | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState<ShayariItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  // Android View Simulator mode toggle (desktop preview vs responsive)
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Load initial datasets and local storage
  const loadData = () => {
    const favs = StorageService.getFavorites();
    const downs = StorageService.getDownloads();
    const userCreations = StorageService.getUserCreations();

    setFavorites(favs);
    setDownloads(downs);

    // Merge curated initial items with user creations and deduplicate
    const combined = StorageService.deduplicateShayaris([...userCreations, ...INITIAL_SHAYARIS]);
    setAllItems(combined);
  };

  useEffect(() => {
    loadData();

    const handleFavUpdate = () => setFavorites(StorageService.getFavorites());
    const handleDownUpdate = () => setDownloads(StorageService.getDownloads());
    const handleUserUpdate = () => {
      const userCreations = StorageService.getUserCreations();
      setAllItems(StorageService.deduplicateShayaris([...userCreations, ...INITIAL_SHAYARIS]));
    };

    window.addEventListener('favorites_updated', handleFavUpdate);
    window.addEventListener('downloads_updated', handleDownUpdate);
    window.addEventListener('user_creations_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('favorites_updated', handleFavUpdate);
      window.removeEventListener('downloads_updated', handleDownUpdate);
      window.removeEventListener('user_creations_updated', handleUserUpdate);
    };
  }, []);

  // Handlers
  const handleToggleFavorite = (item: ShayariItem) => {
    const isNowFav = StorageService.toggleFavorite(item);
    setFavorites(StorageService.getFavorites());
    showToast(isNowFav ? 'मनपरेका सूचीमा थपियो ❤️' : 'मनपरेका सूचीबाट हटाइयो');
  };

  const handleDownloadOffline = (item: ShayariItem) => {
    const saved = StorageService.saveForOffline(item);
    if (saved) {
      setDownloads(StorageService.getDownloads());
      showToast('अफ्लाइन पढ्न सुरक्षित गरियो 📥');
    } else {
      showToast('पहिल्यै अफ्लाइनमा उपलब्ध छ');
    }
  };

  const handleRemoveDownload = (id: string) => {
    StorageService.removeDownload(id);
    setDownloads(StorageService.getDownloads());
    showToast('डाउनलोड्सबाट हटाइयो');
  };

  const handleOpenImageModal = (item: ShayariItem) => {
    setSelectedImageItem(item);
    setIsImageModalOpen(true);
  };

  const handleReport = (item: ShayariItem) => {
    setSelectedReportItem(item);
    setIsReportModalOpen(true);
  };

  const handleDeleteCreation = (id: string) => {
    StorageService.deleteUserCreation(id);
    setAllItems(prev => prev.filter(i => i.id !== id));
    showToast('रचना मेटाइयो');
  };

  // Content Area Renderer
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            items={allItems}
            favorites={favorites}
            downloads={downloads}
            onToggleFavorite={handleToggleFavorite}
            onDownloadOffline={handleDownloadOffline}
            onOpenImageModal={handleOpenImageModal}
            onReport={handleReport}
            onShowComposeGuide={() => setIsComposeModalOpen(true)}
            onNavigateTab={setActiveTab}
            onDeleteCreation={handleDeleteCreation}
            onShowToast={showToast}
          />
        );
      case 'community':
        return (
          <CommunityTab
            favorites={favorites}
            downloads={downloads}
            onToggleFavorite={handleToggleFavorite}
            onDownloadOffline={handleDownloadOffline}
            onOpenImageModal={handleOpenImageModal}
            onNavigateToCreate={() => setActiveTab('create')}
            onShowToast={showToast}
          />
        );
      case 'search':
        return (
          <DiscoveryTab
            curatedItems={allItems}
            favorites={favorites}
            downloads={downloads}
            onToggleFavorite={handleToggleFavorite}
            onDownloadOffline={handleDownloadOffline}
            onOpenImageModal={handleOpenImageModal}
            onReport={handleReport}
            onImportToLibrary={(item) => {
              StorageService.saveForOffline(item);
              showToast('पुस्तकालयमा थपियो');
            }}
            onShowToast={showToast}
          />
        );
      case 'create':
        return (
          <CreateEditor
            onOpenImageModal={handleOpenImageModal}
            onItemCreated={(_newItem) => {
              showToast('नयाँ रचना सुरक्षित भयो ✨');
              loadData();
            }}
            onNavigateToCommunity={() => setActiveTab('community')}
          />
        );
      case 'favorites':
        return (
          <FavoritesTab
            favorites={favorites}
            downloads={downloads}
            onToggleFavorite={handleToggleFavorite}
            onDownloadOffline={handleDownloadOffline}
            onOpenImageModal={handleOpenImageModal}
            onReport={handleReport}
            onGoHome={() => setActiveTab('home')}
            onShowToast={showToast}
          />
        );
      case 'downloads':
        return (
          <DownloadsTab
            downloads={downloads}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onRemoveDownload={handleRemoveDownload}
            onOpenImageModal={handleOpenImageModal}
            onReport={handleReport}
            onGoHome={() => setActiveTab('home')}
            onShowToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-nepali">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div
        className={`mx-auto w-full transition-all duration-300 flex-1 flex flex-col ${
          isPhoneFrame
            ? 'max-w-[420px] my-6 rounded-[42px] border-[10px] border-slate-900 shadow-2xl bg-white overflow-hidden min-h-[820px]'
            : 'max-w-6xl min-h-screen bg-transparent'
        }`}
      >
        {/* Android Simulated Status Bar (Only in Phone Frame mode) */}
        {isPhoneFrame && (
          <div className="bg-rose-950 text-white px-6 py-2 flex items-center justify-between text-[11px] font-mono select-none">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Top App Bar Contract (3 Zones) */}
        <header className="sticky top-0 z-30 bg-rose-900 text-white px-4 sm:px-6 py-3.5 shadow-md border-b border-rose-800">
          <div className="flex items-center justify-between gap-4">
            {/* Zone 1: Brand Wordmark */}
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-white text-rose-900 flex items-center justify-center font-bold text-base shadow-xs">
                म
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
                  मनका शब्द
                </h1>
                <span className="text-[10px] text-rose-200 block -mt-1 tracking-wider uppercase font-sans">
                  Nepali Shayari & Poetry
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links (Desktop view) */}
            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-rose-100">
              <button
                onClick={() => setActiveTab('home')}
                className={`hover:text-white transition-colors whitespace-nowrap ${
                  activeTab === 'home' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                गृह (Home)
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'community' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>समुदाय (Community)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`hover:text-white transition-colors whitespace-nowrap ${
                  activeTab === 'search' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                इन्टरनेट खोज
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`hover:text-white transition-colors whitespace-nowrap ${
                  activeTab === 'create' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                सिर्जना (Create)
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`hover:text-white transition-colors whitespace-nowrap ${
                  activeTab === 'favorites' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                मनपरेका ({favorites.length})
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`hover:text-white transition-colors whitespace-nowrap ${
                  activeTab === 'downloads' ? 'text-white underline underline-offset-4 font-bold' : ''
                }`}
              >
                डाउनलोड ({downloads.length})
              </button>
            </nav>

            {/* Zone 3: Actions (Compose Guide & Phone View Toggle) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsComposeModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-800/90 hover:bg-rose-700 text-rose-100 rounded-xl text-xs font-medium border border-rose-700/60 transition-colors"
                title="Android Kotlin & Compose Code Reference"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Kotlin Specs</span>
              </button>

              <button
                onClick={() => setIsPhoneFrame(!isPhoneFrame)}
                className="p-2 rounded-xl bg-rose-800/80 hover:bg-rose-700 text-rose-100 transition-colors text-xs flex items-center gap-1"
                title={isPhoneFrame ? 'स्विच गर्नुहोस्: Full Responsive Mode' : 'स्विच गर्नुहोस्: Android Phone Frame'}
                aria-label="Toggle Phone Frame"
              >
                {isPhoneFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span className="hidden xl:inline text-[11px]">
                  {isPhoneFrame ? 'Full View' : 'Phone Mode'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-50/50">
          {renderContent()}
        </main>

        {/* Sticky Mobile Fixed Bottom Navigation Bar (Pattern 1 from mobile touch guidelines) */}
        <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
          <div className="max-w-md mx-auto grid grid-cols-6 items-center">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                activeTab === 'home' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Home className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">गृह</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                activeTab === 'community' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'community' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">समुदाय</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                activeTab === 'search' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'search' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">खोज</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                activeTab === 'create' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <PlusCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'create' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">सिर्जना</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                activeTab === 'favorites' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'favorites' ? 'stroke-[2.5] fill-rose-700' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">मनपरेका</span>
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[8px] font-bold flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                activeTab === 'downloads' ? 'text-rose-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'downloads' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5">डाउनलोड</span>
              {downloads.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center">
                  {downloads.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Global Bottom AdMob Official Banner */}
        <AdMobBanner placement="bottom" onShowComposeGuide={() => setIsComposeModalOpen(true)} />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-6 py-4 text-xs text-slate-500 text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-rose-700 underline underline-offset-2 transition-colors"
            >
              गोपनीयता नीति (Privacy Policy)
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsComposeModalOpen(true)}
              className="hover:text-rose-700 underline underline-offset-2 transition-colors"
            >
              Kotlin & Jetpack Compose Specs
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                if (allItems[0]) handleReport(allItems[0]);
              }}
              className="hover:text-rose-700 underline underline-offset-2 transition-colors"
            >
              सामग्री उजुरी (Report)
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            © २०२६ मनका शब्द - नेपाली शायरी (Man Ka Shabda). All rights reserved.
          </p>
        </footer>
      </div>

      {/* Modals */}
      {selectedImageItem && (
        <ImageQuoteModal
          item={selectedImageItem}
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImageItem(null);
          }}
        />
      )}

      {selectedReportItem && (
        <ReportModal
          item={selectedReportItem}
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedReportItem(null);
          }}
        />
      )}

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <ComposeReferenceModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
      />
    </div>
  );
}
