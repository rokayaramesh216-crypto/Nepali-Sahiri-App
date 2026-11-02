import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Download,
  Copy,
  Trash2,
  Check,
  RotateCcw,
  BookOpen,
  Image as ImageIcon,
  Globe,
  Lock,
  Send,
  Users,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { CategoryId, ItemType, ShayariItem, CardThemeId } from '../types/shayari';
import { CATEGORIES, CARD_THEMES } from '../data/categories';
import { StorageService } from '../services/storage';
import { ImageGeneratorService } from '../services/imageGenerator';
import { CommunityService } from '../services/communityService';

interface CreateEditorProps {
  onOpenImageModal: (item: ShayariItem) => void;
  onItemCreated?: (item: ShayariItem) => void;
  onNavigateToCommunity?: () => void;
}

export const CreateEditor: React.FC<CreateEditorProps> = ({
  onOpenImageModal,
  onItemCreated,
  onNavigateToCommunity
}) => {
  // Mode toggle: 'community' (Public) vs 'private' (Offline Draft)
  const [publishMode, setPublishMode] = useState<'community' | 'private'>('community');

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('love');
  const [type, setType] = useState<ItemType>('shayari');
  const [author, setAuthor] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('rhododendron');
  const [fontSize, setFontSize] = useState<number>(36);

  // States
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [myPrivateCreations, setMyPrivateCreations] = useState<ShayariItem[]>([]);
  const [myPublishedPosts, setMyPublishedPosts] = useState<ShayariItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load drafts and user creations on mount
  useEffect(() => {
    const draft = StorageService.getDraft();
    if (draft && !editingId) {
      setContent(draft.content || '');
      setTitle(draft.title || '');
      if (draft.category) setCategory(draft.category as CategoryId);
      if (draft.author) setAuthor(draft.author);
    }
    setMyPrivateCreations(StorageService.getUserCreations());
    loadMyPublished();
  }, [editingId]);

  const loadMyPublished = async () => {
    try {
      const myIds = CommunityService.getMyPublishedIds();
      if (myIds.length > 0) {
        const { posts } = await CommunityService.fetchPosts();
        const userPublished = posts.filter(p => myIds.includes(p.id));
        setMyPublishedPosts(userPublished);
      }
    } catch (e) {
      console.warn('Could not load user published posts', e);
    }
  };

  // Autosave draft when typing
  useEffect(() => {
    if (!editingId && content.trim()) {
      StorageService.saveDraft({
        content,
        title,
        category,
        author
      });
    }
  }, [content, title, category, author, editingId]);

  // Public Community Publishing ("सबैले देख्ने गरी प्रकाशित गर्नुहोस्" / "शायरी पोस्ट गर्नुहोस्")
  const handlePublishToCommunity = async () => {
    if (!content.trim()) {
      setErrorMessage('कृपया पहिले रचनाका शब्दहरू लेख्नुहोस्');
      return;
    }
    if (content.trim().length < 10) {
      setErrorMessage('रचना कम्तीमा १० अक्षरको हुनुपर्दछ');
      return;
    }
    if (!author.trim()) {
      setErrorMessage('कृपया तपाईंको नाम वा उपनाम (Pen Name) लेख्नुहोस्');
      return;
    }

    setErrorMessage(null);
    setIsPublishing(true);

    try {
      const newPost = await CommunityService.publishPost({
        title: title.trim() || undefined,
        content: content.trim(),
        author: author.trim(),
        category,
        type,
        language: category === 'english' ? 'english' : category === 'hindi' ? 'hindi' : 'nepali'
      });

      // Clear draft
      StorageService.clearDraft();
      setContent('');
      setTitle('');

      setPublishSuccessMsg('तपाईंको रचना साझा अनलाइन डाटाबेसमा सफलतापूर्वक प्रकाशित भयो! 🎉 सबै प्रयोगकर्ताले अब समुदाय फिडमा यो रचना देख्नेछन्।');
      setTimeout(() => setPublishSuccessMsg(null), 5000);

      // Refresh published list
      await loadMyPublished();

      if (onItemCreated) {
        onItemCreated(newPost);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'प्रकाशन गर्न असफल भयो। इन्टरनेट जडान जाँच्नुहोस्।');
    } finally {
      setIsPublishing(false);
    }
  };

  // Private Offline Saving
  const handleSavePrivate = () => {
    if (!content.trim()) return;

    const newItem: ShayariItem = {
      id: editingId || `user-${Date.now()}`,
      title: title.trim() || undefined,
      content: content.trim(),
      author: author.trim() || 'तपाईं (You)',
      category,
      type,
      language: category === 'english' ? 'english' : category === 'hindi' ? 'hindi' : 'nepali',
      source: 'व्यक्तिगत रचना (Private Creation)',
      createdAt: new Date().toISOString().split('T')[0],
      isUserCreated: true,
      likesCount: 1
    };

    StorageService.saveUserCreation(newItem);
    setMyPrivateCreations(StorageService.getUserCreations());

    if (onItemCreated) {
      onItemCreated(newItem);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);

    // Reset fields if was new
    if (!editingId) {
      setContent('');
      setTitle('');
    } else {
      setEditingId(null);
    }
  };

  const handleEdit = (item: ShayariItem) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setContent(item.content);
    setCategory(item.category);
    setType(item.type);
    setAuthor(item.author);
    setPublishMode('private');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePrivate = (id: string) => {
    if (window.confirm('के तपाईं यो निजी रचना मेटाउन चाहनुहुन्छ?')) {
      StorageService.deleteUserCreation(id);
      setMyPrivateCreations(StorageService.getUserCreations());
      if (editingId === id) {
        setEditingId(null);
        setContent('');
        setTitle('');
      }
    }
  };

  const handleClear = () => {
    if (window.confirm('के तपाईं सम्पादक खाली गर्न चाहनुहुन्छ?')) {
      setContent('');
      setTitle('');
      setEditingId(null);
      StorageService.clearDraft();
      setErrorMessage(null);
    }
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    const text = `${title ? title + '\n\n' : ''}${content}\n\n— ${author || 'स्वरचित'}\n[मनका शब्द - नेपाली शायरी]`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDownloadPng = async () => {
    if (!content.trim()) return;
    const { blob } = await ImageGeneratorService.generateQuoteImage({
      title: title || undefined,
      content,
      author: author.trim() || 'स्वरचित',
      themeId: selectedTheme,
      fontSize,
      alignment: 'center',
      showWatermark: true
    });
    const filename = `manka_shabda_${Date.now()}.png`;
    ImageGeneratorService.downloadBlob(blob, filename);
  };

  const currentTheme = CARD_THEMES.find(t => t.id === selectedTheme) || CARD_THEMES[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Heading */}
      <div className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white p-6 rounded-3xl shadow-sm border border-rose-800">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl sm:text-2xl font-bold font-nepali tracking-tight">
            शायरी तथा सिर्जना सम्पादक (Composer)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-rose-100 max-w-xl font-nepali leading-relaxed">
          आफ्नो मनका भावहरूलाई शायरी, कविता, गजल वा मुक्तकमा उतार्नुहोस्। चाहे व्यक्तिगत डायरीमा सुरक्षित राख्नुहोस् वा सबैले देख्ने गरी सार्वजनिक रूपमा प्रकाशित गर्नुहोस्।
        </p>

        {/* Clear Mode Switch Tabs */}
        <div className="mt-4 pt-3 border-t border-rose-800 flex flex-wrap gap-2">
          <button
            onClick={() => setPublishMode('community')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              publishMode === 'community'
                ? 'bg-white text-rose-900 shadow-md ring-2 ring-white/30'
                : 'bg-rose-950/60 text-rose-200 hover:bg-rose-950'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>सार्वजनिक समुदाय प्रकाशन (Public Post)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </button>

          <button
            onClick={() => setPublishMode('private')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              publishMode === 'private'
                ? 'bg-white text-rose-900 shadow-md ring-2 ring-white/30'
                : 'bg-rose-950/60 text-rose-200 hover:bg-rose-950'
            }`}
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>निजी मस्यौदा र अफ्लाइन संग्रह (Private Offline)</span>
          </button>
        </div>
      </div>

      {/* Distinction Explanation Banner */}
      {publishMode === 'community' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
          <Globe className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="font-nepali">
            <span className="font-bold">सार्वजनिक मोड सक्रिय:</span> यहाँबाट प्रकाशित रचना साझा अनलाइन डाटाबेसमा रहनेछ र मनका शब्द प्रयोग गर्ने <strong>सबै प्रयोगकर्ताहरूले</strong> समुदाय फिडमा देख्न, लाइक गर्न, सेयर गर्न र मनपराउन सक्नेछन्।
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="font-nepali">
            <span className="font-bold">व्यक्तिगत मोड सक्रिय:</span> यो रचना तपाईंको आफ्नै फोन/ब्राउजरमा मात्र रहनेछ। अन्य प्रयोगकर्ताले देख्ने छैनन्।
          </div>
        </div>
      )}

      {/* Success Notification */}
      {publishSuccessMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn font-nepali">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{publishSuccessMsg}</span>
          </div>
          {onNavigateToCommunity && (
            <button
              onClick={onNavigateToCommunity}
              className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-emerald-900 flex items-center gap-1"
            >
              <span>समुदायमा हेर्नुहोस्</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn font-nepali">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {editingId
                  ? 'रचना सम्पादन (Edit)'
                  : publishMode === 'community'
                  ? '🌐 सार्वजनिक प्रकाशन सम्पादक'
                  : '🔒 निजी रचना सम्पादक'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                अटो-ड्राफ्ट सक्रिय
              </span>
              <button
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
                title="खाली गर्नुहोस्"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              शीर्षक (Title - ऐच्छिक)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="रचनाको शीर्षक लेख्नुहोस् (उदा: परदेशीको सम्झना)..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali"
            />
          </div>

          {/* Category & Type Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                विधा (Category) *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                aria-label="विधा (Category)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-rose-600 font-nepali"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameNepali} ({cat.nameEnglish})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                प्रकार (Format) *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                aria-label="प्रकार (Format)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-rose-600"
              >
                <option value="shayari">शायरी (Shayari)</option>
                <option value="muktak">मुक्तक (Muktak)</option>
                <option value="ghazal">गजल (Ghazal)</option>
                <option value="poem">कविता (Poem)</option>
                <option value="quote">सुविचार (Quote)</option>
                <option value="status">स्ट्याटस (Status)</option>
              </select>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              रचनाका शब्दहरू (Shayari / Poetry Text) *
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="यहाँ आफ्ना भावना, शायरी वा मुक्तक लेख्नुहोस्...&#10;उदा:&#10;आँखामा सजाएँ तिम्रो त्यो मीठो सपना,&#10;जिन्दगीको बाटोमा बन्यौ तिमी नै आफ्नोपना..."
              className="w-full p-3.5 text-base rounded-2xl border border-slate-200 focus:outline-rose-600 focus:border-rose-600 font-nepali leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>कम्तीमा १० अक्षर हुनुपर्दछ</span>
              <span>{content.length} / २०००</span>
            </div>
          </div>

          {/* Author Pen Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              लेखक वा उपनाम (Pen Name) *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="सबैले देख्ने तपाईंको नाम वा उपनाम (उदा: सङ्गीत, अनामिका, यात्री)"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-rose-600 font-nepali"
            />
            <p className="text-[11px] text-slate-400 mt-0.5 font-nepali">
              {publishMode === 'community'
                ? 'सार्वजनिक रूपमा प्रकाशित हुँदा यो नाम सबै प्रयोगकर्तालाई देखिनेछ।'
                : 'तपाईंको व्यक्तिगत संग्रहमा रहने नाम'}
            </p>
          </div>

          {/* Action Buttons Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {publishMode === 'community' ? (
              /* Public Publishing Primary Buttons */
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePublishToCommunity}
                    disabled={isPublishing || !content.trim()}
                    className="min-h-[46px] px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>डाटाबेसमा प्रकाशित हुँदैछ...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>सबैले देख्ने गरी प्रकाशित गर्नुहोस्</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePublishToCommunity}
                    disabled={isPublishing || !content.trim()}
                    className="min-h-[46px] px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>शायरी पोस्ट गर्नुहोस्</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleSavePrivate}
                    disabled={!content.trim()}
                    className="min-h-[40px] px-3.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>निजी संग्रहमा पनि राख्नुहोस्</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    disabled={!content.trim()}
                    className="min-h-[40px] px-3.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>प्रतिलिपि (Copy)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!content.trim()) return;
                      onOpenImageModal({
                        id: `preview-${Date.now()}`,
                        title: title || undefined,
                        content,
                        author: author || 'स्वरचित',
                        category,
                        type,
                        language: 'nepali',
                        createdAt: new Date().toISOString()
                      });
                    }}
                    disabled={!content.trim()}
                    className="min-h-[40px] px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>एचडी फोटो कार्ड</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Private Offline Saving Primary Buttons */
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSavePrivate}
                  disabled={!content.trim()}
                  className="min-h-[44px] px-5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>सुरक्षित भयो!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingId ? 'अपडेट गर्नुहोस्' : 'निजी संग्रहमा सुरक्षित गर्नुहोस्'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setPublishMode('community')}
                  className="min-h-[44px] px-3.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>समुदायमा सबैले देख्ने गरी पोस्ट गर्नुहोस्</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!content.trim()}
                  className="min-h-[44px] px-3.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>प्रतिलिपि</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Visual Card Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                प्रत्यक्ष पूर्वावलोकन (Live Preview)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1080 × 1350 HD</span>
            </div>

            {/* Theme switcher */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">कार्डको रङ (Theme):</div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {CARD_THEMES.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`w-7 h-7 rounded-full shrink-0 border-2 transition-transform ${
                      selectedTheme === t.id ? 'scale-110 border-rose-600 shadow-xs' : 'border-slate-300'
                    } bg-gradient-to-br ${t.bgGradient}`}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            {/* The Simulated Card Box */}
            <div
              className={`rounded-2xl p-6 min-h-[300px] flex flex-col justify-between shadow-lg relative border ${
                currentTheme.borderColor
              } bg-gradient-to-br ${currentTheme.bgGradient}`}
              style={{ color: currentTheme.textColor }}
            >
              <div className="text-center">
                <div className="text-2xl font-serif opacity-30 select-none">“</div>
                {title && (
                  <div className="text-sm font-bold mb-2 font-nepali opacity-90">
                    {title}
                  </div>
                )}
                <div className="text-base font-nepali whitespace-pre-line leading-relaxed my-2">
                  {content.trim() || 'तपाईंले यहाँ लेख्नुभएका शब्दहरू यसरी सुन्दर फोटो कार्डमा देखिनेछन्...'}
                </div>
              </div>

              <div className="text-center pt-4 border-t border-white/10 mt-auto">
                <div className="text-xs font-semibold font-nepali opacity-90">
                  — {author.trim() || 'स्वरचित'}
                </div>
                <div className="text-[10px] opacity-50 mt-1">
                  मनका शब्द • Man Ka Shabda
                </div>
              </div>
            </div>

            <button
              onClick={handleQuickDownloadPng}
              disabled={!content.trim()}
              className="w-full mt-4 min-h-[44px] bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>सिधै फोटो डाउनलोड (PNG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Published Community Posts Section */}
      {myPublishedPosts.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-emerald-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900 font-nepali">
                तपाईंले समुदायमा प्रकाशित गर्नुभएका रचनाहरू ({myPublishedPosts.length})
              </h3>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
              सबै प्रयोगकर्ताले देखिरहेका छन्
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPublishedPosts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-emerald-800 uppercase">{item.category}</span>
                    <span className="text-[11px] text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ne-NP') : ''}
                    </span>
                  </div>
                  {item.title && (
                    <div className="font-bold text-slate-900 text-sm mb-1 font-nepali">
                      {item.title}
                    </div>
                  )}
                  <p className="text-xs text-slate-700 whitespace-pre-line font-nepali line-clamp-3">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-emerald-100">
                  <span className="text-xs text-slate-600 font-nepali">
                    ❤️ {item.likesCount || 0} लाइकहरू
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenImageModal(item)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded"
                      title="कार्ड बनाउनुहोस्"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    {onNavigateToCommunity && (
                      <button
                        onClick={onNavigateToCommunity}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1"
                      >
                        फिडमा हेर्नुहोस् →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User's Previous Private Creations List */}
      {myPrivateCreations.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <h3 className="text-base font-bold text-slate-900 font-nepali">
                तपाईंका व्यक्तिगत निजी रचनाहरू ({myPrivateCreations.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">तपाईंको फोनमा मात्र सुरक्षित</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPrivateCreations.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-rose-300 transition-colors flex flex-col justify-between bg-slate-50/50"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-rose-700 uppercase">{item.category}</span>
                    <span className="text-[11px]">{item.createdAt}</span>
                  </div>
                  {item.title && (
                    <div className="font-bold text-slate-900 text-sm mb-1 font-nepali">
                      {item.title}
                    </div>
                  )}
                  <p className="text-xs text-slate-700 whitespace-pre-line font-nepali line-clamp-3">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-800 font-nepali">
                    — {item.author}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 rounded-md font-medium"
                    >
                      सम्पादन
                    </button>
                    <button
                      onClick={() => onOpenImageModal(item)}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded"
                      title="कार्ड बनाउनुहोस्"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePrivate(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="मेटाउनुहोस्"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
