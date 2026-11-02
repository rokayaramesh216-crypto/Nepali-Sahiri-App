import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Check, RefreshCw } from 'lucide-react';
import { ShayariItem, CardThemeId } from '../types/shayari';
import { CARD_THEMES } from '../data/categories';
import { ImageGeneratorService } from '../services/imageGenerator';

interface ImageQuoteModalProps {
  item: ShayariItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageQuoteModal: React.FC<ImageQuoteModalProps> = ({ item, isOpen, onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('rhododendron');
  const [fontSize, setFontSize] = useState<number>(36);
  const [alignment, setAlignment] = useState<'center' | 'left'>('center');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [customAuthor, setCustomAuthor] = useState<string>(item.author || '');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Re-generate preview whenever options change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    const timer = setTimeout(async () => {
      try {
        const { dataUrl, blob } = await ImageGeneratorService.generateQuoteImage({
          title: item.title,
          content: item.content,
          author: customAuthor,
          themeId: selectedTheme,
          fontSize,
          alignment,
          showWatermark
        });

        if (isMounted) {
          setPreviewUrl(dataUrl);
          setCurrentBlob(blob);
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('Error generating card preview', err);
        if (isMounted) setIsGenerating(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, item, selectedTheme, fontSize, alignment, showWatermark, customAuthor]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!currentBlob) return;
    const cleanName = (item.title || item.author || 'shayari').replace(/\s+/g, '_').toLowerCase();
    const filename = `manka_shabda_${cleanName}_${Date.now()}.png`;
    ImageGeneratorService.downloadBlob(currentBlob, filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleShare = async () => {
    if (!currentBlob) return;
    const success = await ImageGeneratorService.shareImage(
      currentBlob,
      item.title || 'नेपाली शायरी',
      `${item.content}\n— ${customAuthor}`
    );
    if (!success) {
      // fallback download
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-nepali">
              फोटो शायरी कार्ड बनाउनुहोस्
            </h2>
            <p className="text-xs text-slate-500">
              Download beautiful 4:5 HD quote image for WhatsApp status, gallery & social media
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into Preview & Customization Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Left: Live Canvas Preview Container */}
          <div className="flex flex-col items-center justify-center bg-slate-950/5 rounded-2xl p-3 border border-slate-200/80 min-h-[320px]">
            {isGenerating && !previewUrl ? (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-600" />
                <span>कार्ड तयार हुँदैछ...</span>
              </div>
            ) : previewUrl ? (
              <div className="relative group max-w-[240px] sm:max-w-[270px] shadow-xl rounded-xl overflow-hidden border border-slate-300">
                <img
                  src={previewUrl}
                  alt="Quote Card Preview"
                  className="w-full h-auto object-contain block"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : null}
            <div className="text-[11px] text-slate-500 mt-2">
              HD Resolution: 1080 × 1350 px (PNG)
            </div>
          </div>

          {/* Right: Customization Controls */}
          <div className="space-y-4">
            {/* Theme Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                रङ र पृष्ठभूमि (Color Theme)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {CARD_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`px-2.5 py-2 text-left rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                      selectedTheme === theme.id
                        ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 bg-gradient-to-br ${theme.bgGradient} border border-black/10`}
                    />
                    <span className="truncate">{theme.name.split('(')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>अक्षरको आकार (Font Size)</span>
                <span className="text-rose-700">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="48"
                step="2"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Alignment & Watermark */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  पङ्क्तिबद्धता (Alignment)
                </label>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setAlignment('center')}
                    className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                      alignment === 'center' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    केन्द्र (Center)
                  </button>
                  <button
                    onClick={() => setAlignment('left')}
                    className={`flex-1 py-1 text-xs rounded-md font-medium transition-colors ${
                      alignment === 'left' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    बायाँ (Left)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  वाटरमार्क (Watermark)
                </label>
                <button
                  onClick={() => setShowWatermark(!showWatermark)}
                  className={`w-full py-1.5 px-2 text-xs rounded-lg border font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    showWatermark
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {showWatermark ? 'अन छ (Active)' : 'अफ (Hidden)'}
                </button>
              </div>
            </div>

            {/* Author Attribution Signature */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                लेखक वा नाम (Author Signature)
              </label>
              <input
                type="text"
                value={customAuthor}
                onChange={(e) => setCustomAuthor(e.target.value)}
                placeholder="तपाईँको नाम वा लेखक"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            तपाईँको ग्यालेरी वा डाउनलोड्स फोल्डरमा सिधै सुरक्षित हुनेछ।
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              disabled={!currentBlob || isGenerating}
              className="flex-1 sm:flex-initial min-h-[44px] px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>साझेदारी (Share)</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!currentBlob || isGenerating}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-md shadow-rose-900/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>डाउनलोड भयो!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ग्यालेरीमा डाउनलोड (PNG)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
