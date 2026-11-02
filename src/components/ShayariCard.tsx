import React, { useState } from 'react';
import {
  Heart,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Flag,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Eye
} from 'lucide-react';
import { ShayariItem } from '../types/shayari';
import { ImageGeneratorService } from '../services/imageGenerator';

interface ShayariCardProps {
  item: ShayariItem;
  isFavorite: boolean;
  isDownloaded: boolean;
  isSeen?: boolean;
  onToggleFavorite: (item: ShayariItem) => void;
  onDownloadOffline: (item: ShayariItem) => void;
  onOpenImageModal: (item: ShayariItem) => void;
  onReport: (item: ShayariItem) => void;
  onDelete?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export const ShayariCard: React.FC<ShayariCardProps> = ({
  item,
  isFavorite,
  isDownloaded,
  isSeen,
  onToggleFavorite,
  onDownloadOffline,
  onOpenImageModal,
  onReport,
  onDelete,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const handleCopy = async () => {
    try {
      const shareText = `${item.content}\n\n— ${item.author}\n[मनका शब्द - नेपाली शायरी]`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      if (onShowToast) onShowToast('शायरी क्लिपबोर्डमा प्रतिलिपि भयो 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    const shareText = `${item.content}\n\n— ${item.author}\n[मनका शब्द - नेपाली शायरी]`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || 'नेपाली शायरी',
          text: shareText
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // Direct 1-click Download to Phone: Downloads HD PNG Quote Card & saves text offline
  const handleDirectDownload = async () => {
    try {
      setIsDownloadingImage(true);
      // 1. Save text offline in Room/local storage
      onDownloadOffline(item);

      // 2. Generate and download crisp HD quote card to phone gallery/downloads
      await ImageGeneratorService.quickDownloadQuoteCard({
        title: item.title,
        content: item.content,
        author: item.author
      });

      if (onShowToast) {
        onShowToast('फोटो ग्यालेरीमा डाउनलोड भयो र अफ्लाइन सुरक्षित गरियो! 📥');
      }
    } catch (err) {
      console.error('Download error', err);
      // Fallback: open modal
      onOpenImageModal(item);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group">
      <div>
        {/* Top Meta Zone: Category & Author / Source */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-rose-700 uppercase tracking-wider text-[11px]">
              {item.category}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium">
              {item.type}
            </span>
            {item.isPublicDomain && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-emerald-700 text-[11px] font-medium">खुला स्रोत</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isSeen && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium" title="यो रचना पहिले हेरिएको छ">
                <Eye className="w-3 h-3 text-slate-400" />
                हेरिएको
              </span>
            )}
            {isDownloaded && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3 h-3" />
                अफ्लाइन सेभ
              </span>
            )}
            {item.isUserCreated && onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="मेट्नुहोस् (Delete)"
                aria-label="Delete shayari"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onReport(item)}
              className="p-1 text-slate-300 hover:text-slate-600 rounded transition-colors"
              title="उजुरी गर्नुहोस् (Report)"
              aria-label="Report content"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title if present */}
        {item.title && (
          <h3 className="text-base font-bold text-slate-900 mb-2 font-nepali tracking-tight">
            {item.title}
          </h3>
        )}

        {/* Poetry / Shayari Content */}
        <div className="text-slate-800 text-[15px] sm:text-base leading-relaxed whitespace-pre-line font-nepali my-3 select-text">
          {item.content}
        </div>

        {/* Author & Source line */}
        <div className="mt-4 pt-2 flex items-center justify-between text-xs text-slate-500">
          <div className="font-semibold text-slate-800 font-nepali flex items-center gap-1">
            <span>— {item.author}</span>
          </div>

          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:underline hover:text-rose-800"
              title="मूल स्रोत हेर्नुहोस् (Open Source Link)"
            >
              <span>स्रोत लिंक</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Left actions: Favorite & Quick Download */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleFavorite(item)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all ${
              isFavorite
                ? 'text-rose-600 bg-rose-50 shadow-xs border border-rose-200'
                : 'text-slate-500 hover:text-rose-600 hover:bg-slate-50 border border-transparent'
            }`}
            title={isFavorite ? 'मनपरेकाबाट हटाउनुहोस्' : 'मनपर्नेमा राख्नुहोस् (Favorite)'}
            aria-label="Toggle Favorite"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>

          <button
            onClick={handleDirectDownload}
            disabled={isDownloadingImage}
            className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100/90 rounded-xl transition-colors border border-rose-200/80"
            title="फोटो ग्यालेरीमा डाउनलोड गर्नुहोस् र अफ्लाइन सेभ गर्नुहोस्"
            aria-label="Download image card"
          >
            {isDownloadingImage ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-700" />
            ) : (
              <Download className="w-4 h-4 text-rose-700" />
            )}
            <span>डाउनलोड (PNG)</span>
          </button>
        </div>

        {/* Right actions: Customize card modal, Copy, Share */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenImageModal(item)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-700 hover:bg-slate-50 rounded-xl transition-colors"
            title="रङ र ढाँचा परिवर्तन गर्नुहोस् (Customize Card)"
            aria-label="Customize card"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="प्रतिलिपि बनाउनुहोस् (Copy text)"
            aria-label="Copy text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={handleShare}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="साझेदारी गर्नुहोस् (Share)"
            aria-label="Share shayari"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
