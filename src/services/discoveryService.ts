import { ShayariItem } from '../types/shayari';
import { StorageService } from './storage';

export interface DiscoverySearchResult {
  items: ShayariItem[];
  sourceApisUsed: string[];
  groundingLinks?: { title: string; url: string }[];
  totalFound: number;
  hasApiError?: boolean;
  apiErrorMessage?: string;
  isLiveGrounded?: boolean;
  isApiConfigured?: boolean;
  googleFallbackUrl: string;
}

export class DiscoveryService {
  /**
   * Search server-side live internet search grounded with Google Search
   */
  static async searchLiveInternet(
    query: string
  ): Promise<{
    items: ShayariItem[];
    sourceApis: string[];
    groundingLinks: any[];
    isConfigured: boolean;
    errorMsg?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          items: [],
          sourceApis: [],
          groundingLinks: [],
          isConfigured: false,
          errorMsg: 'इन्टरनेट एपीआईबाट प्रतिक्रिया आएन।'
        };
      }

      const data = await response.json();
      const isConfigured = data.source !== 'offline_fallback';

      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return {
          items: data.items,
          sourceApis: data.sourceApisUsed || ['Google Search Grounding (Live Internet)'],
          groundingLinks: data.groundingLinks || [],
          isConfigured: true
        };
      }

      return {
        items: [],
        sourceApis: [],
        groundingLinks: [],
        isConfigured,
        errorMsg: data.message
      };
    } catch (err) {
      return {
        items: [],
        sourceApis: [],
        groundingLinks: [],
        isConfigured: false,
        errorMsg: 'इन्टरनेट पहुँच वा एपीआई कन्फिगरेसन उपलब्ध छैन।'
      };
    }
  }

  /**
   * Search PoetryDB for public domain English poems
   */
  static async searchPoetryDb(query: string): Promise<ShayariItem[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://poetrydb.org/title,lines/${encodeURIComponent(query.trim())}/title,author,lines.json`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return [];

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0 || (data as any).status === 404) {
        return [];
      }

      return data.slice(0, 5).map((entry: any, index: number) => {
        const lines = Array.isArray(entry.lines) ? entry.lines.slice(0, 10).join('\n') : '';
        return {
          id: `poetrydb-${Date.now()}-${index}`,
          title: entry.title || 'Untitled Poem',
          content: lines || entry.title,
          author: entry.author || 'Unknown Poet',
          category: 'english',
          type: 'poem',
          language: 'english',
          source: 'PoetryDB Public Domain API',
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.author || 'Poetry')}`,
          createdAt: new Date().toISOString().split('T')[0],
          isPublicDomain: true,
          likesCount: 15,
          copiedCount: 5
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Search DummyJSON Quotes API for public quotes
   */
  static async searchQuotesApi(query: string): Promise<ShayariItem[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://dummyjson.com/quotes/search?q=${encodeURIComponent(query.trim())}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.quotes || !Array.isArray(data.quotes)) return [];

      return data.quotes.slice(0, 5).map((q: any) => ({
        id: `quoteapi-${q.id}-${Date.now()}`,
        title: `Quote by ${q.author}`,
        content: `"${q.quote}"`,
        author: q.author,
        category: 'motivation',
        type: 'quote',
        language: 'english',
        source: 'Public Quotations API',
        sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(q.author + ' quotes')}`,
        createdAt: new Date().toISOString().split('T')[0],
        isPublicDomain: true,
        likesCount: 22,
        copiedCount: 12
      }));
    } catch {
      return [];
    }
  }

  /**
   * 1. Search local shayari titles, text, tags and categories first,
   * ignoring uppercase/lowercase, diacritic nuances, and extra spaces.
   */
  static searchCuratedArchive(query: string, allItems: ShayariItem[]): ShayariItem[] {
    if (!query || !query.trim()) return [];

    // Normalize: trim, lowercase, collapse multiple whitespaces into a single space
    const cleanQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const tokens = cleanQuery.split(' ').filter(t => t.length > 0);

    if (tokens.length === 0) return [];

    // Category and type alias maps for natural Nepali language searching
    const categoryKeywords: Record<string, string[]> = {
      love: ['माया', 'प्रेम', 'मुटु', 'आँखा', 'love', 'ishq', 'pyaar'],
      sad: ['दुःख', 'दुःखी', 'पीडा', 'विछोड', 'याद', 'आँशु', 'टुटेको', 'sad', 'dard', 'आँसु', 'परदेशी'],
      poetry: ['कविता', 'काव्य', 'पद्य', 'devkota', 'poetry', 'poem', 'नेपाली कविता'],
      muktak: ['मुक्तक', 'चार हरफ', 'muktak'],
      ghazal: ['गजल', 'शेर', 'शायरी', 'मतला', 'ghazal', 'gazal'],
      friendship: ['साथी', 'मित्रता', 'दोस्ती', 'friend', 'dosti'],
      motivation: ['प्रेरणा', 'हौसला', 'सफलता', 'जीत', 'सङ्घर्ष', 'संघर्ष', 'motivation'],
      life: ['जिन्दगी', 'जीवन', 'संसार', 'life'],
      family: ['परिवार', 'आमा', 'बुबा', 'बाबु', 'घर', 'family', 'aama'],
      patriotic: ['देशभक्ति', 'नेपाल', 'गोर्खाली', 'माटो', 'nepal', 'desh'],
      festival: ['चाडपर्व', 'दशैं', 'तिहार', 'छठ', 'festival', 'dashain', 'tihar'],
      hindi: ['हिन्दी', 'गालिब', 'राहत', 'hindi'],
      english: ['अंग्रेजी', 'english', 'quote']
    };

    const typeKeywords: Record<string, string[]> = {
      shayari: ['शायरी', 'शेर', 'शायरि', 'shayari', 'shayar'],
      poem: ['कविता', 'काव्य', 'poem', 'poetry'],
      muktak: ['मुक्तक', 'मुत्तक', 'muktak'],
      ghazal: ['गजल', 'ghazal'],
      quote: ['सुविचार', 'उद्धरण', 'विचार', 'quote'],
      status: ['स्ट्याटस', 'status']
    };

    const scoredItems: { item: ShayariItem; score: number }[] = [];

    for (const item of allItems) {
      let score = 0;

      const titleNorm = (item.title || '').toLowerCase().replace(/\s+/g, ' ');
      const contentNorm = (item.content || '').toLowerCase().replace(/\s+/g, ' ');
      const authorNorm = (item.author || '').toLowerCase().replace(/\s+/g, ' ');
      const tagsNorm = (item.tags || []).map(t => t.toLowerCase().replace(/\s+/g, ' '));
      const categoryNorm = (item.category || '').toLowerCase();
      const typeNorm = (item.type || '').toLowerCase();

      // Combined text for broad token containment
      const fullText = `${titleNorm} ${contentNorm} ${authorNorm} ${tagsNorm.join(' ')} ${categoryNorm} ${typeNorm}`;

      // Check 1: Exact full phrase match
      if (titleNorm.includes(cleanQuery)) {
        score += 300;
      }
      if (contentNorm.includes(cleanQuery)) {
        score += 250;
      }
      if (tagsNorm.some(t => t.includes(cleanQuery) || cleanQuery.includes(t))) {
        score += 280;
      }

      // Check 2: Token-by-token matching
      let matchedTokensCount = 0;

      for (const token of tokens) {
        let tokenMatched = false;

        // Title match
        if (titleNorm.includes(token)) {
          score += 60;
          tokenMatched = true;
        }

        // Tags match
        if (tagsNorm.some(t => t.includes(token))) {
          score += 70;
          tokenMatched = true;
        }

        // Content match
        if (contentNorm.includes(token)) {
          score += 40;
          tokenMatched = true;
        }

        // Author match
        if (authorNorm.includes(token)) {
          score += 50;
          tokenMatched = true;
        }

        // Type match (e.g. searching "शायरी", "कविता", "मुक्तक")
        const typeAliases = typeKeywords[typeNorm] || [];
        if (typeNorm.includes(token) || typeAliases.some(alias => alias.includes(token) || token.includes(alias))) {
          score += 50;
          tokenMatched = true;
        }

        // Category match
        const catAliases = categoryKeywords[categoryNorm] || [];
        if (categoryNorm.includes(token) || catAliases.some(alias => alias.includes(token) || token.includes(alias))) {
          score += 45;
          tokenMatched = true;
        }

        // Generic text search
        if (!tokenMatched && fullText.includes(token)) {
          score += 25;
          tokenMatched = true;
        }

        if (tokenMatched) {
          matchedTokensCount++;
        }
      }

      // Bonus if all tokens in the query matched this item
      if (tokens.length > 1 && matchedTokensCount === tokens.length) {
        score += 150;
      }

      if (score > 0) {
        scoredItems.push({ item, score });
      }
    }

    // Sort by score descending (most relevant first)
    scoredItems.sort((a, b) => b.score - a.score);

    return scoredItems.map(s => s.item);
  }

  /**
   * Execute real discovery query combining local search first,
   * live APIs, and verified fallback options.
   */
  static async searchInternet(
    query: string,
    curatedItems: ShayariItem[]
  ): Promise<DiscoverySearchResult> {
    const trimmed = query.trim();
    const googleFallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed + ' नेपाली शायरी')}`;

    if (!trimmed) {
      return {
        items: curatedItems,
        sourceApisUsed: [],
        totalFound: curatedItems.length,
        googleFallbackUrl
      };
    }

    // 1. Search local titles, text, tags, categories FIRST
    const localMatches = this.searchCuratedArchive(trimmed, curatedItems);

    const sourceApis: string[] = [];
    if (localMatches.length > 0) {
      sourceApis.push('नेपाली साहित्य स्थानीय संग्रह (Local Archive)');
    }

    let liveResults: ShayariItem[] = [];
    let liveGroundedLinks: { title: string; url: string }[] = [];
    let isLiveGrounded = false;
    let isApiConfigured = true;
    let apiErrorMessage: string | undefined;

    // 2. Query server-side live internet search (with Google Search Grounding)
    const liveSearch = await this.searchLiveInternet(trimmed);

    if (liveSearch.items.length > 0) {
      liveResults = liveSearch.items;
      sourceApis.push(...liveSearch.sourceApis);
      liveGroundedLinks = liveSearch.groundingLinks;
      isLiveGrounded = true;
    } else {
      isApiConfigured = liveSearch.isConfigured;
      apiErrorMessage = liveSearch.errorMsg;
    }

    // 3. If English query, also check PoetryDB & Quotes API
    let poetryDbResults: ShayariItem[] = [];
    let quotesResults: ShayariItem[] = [];

    const isEnglishQuery = /^[a-zA-Z0-9\s]+$/.test(trimmed);
    if (isEnglishQuery) {
      try {
        const [pRes, qRes] = await Promise.allSettled([
          this.searchPoetryDb(trimmed),
          this.searchQuotesApi(trimmed)
        ]);
        if (pRes.status === 'fulfilled' && pRes.value.length > 0) {
          poetryDbResults = pRes.value;
          sourceApis.push('PoetryDB (Open Poetry API)');
        }
        if (qRes.status === 'fulfilled' && qRes.value.length > 0) {
          quotesResults = qRes.value;
          sourceApis.push('Public Quotes API');
        }
      } catch {
        // ignore
      }
    }

    // 4. Merge results: local matches FIRST, followed by live search and external APIs
    const combined = [...localMatches, ...liveResults, ...poetryDbResults, ...quotesResults];
    const deduplicated = StorageService.deduplicateShayaris(combined);

    return {
      items: deduplicated,
      sourceApisUsed: Array.from(new Set(sourceApis)),
      groundingLinks: liveGroundedLinks,
      totalFound: deduplicated.length,
      isLiveGrounded,
      isApiConfigured,
      apiErrorMessage,
      googleFallbackUrl
    };
  }

  /**
   * Helper to construct verified browser search fallback URLs
   */
  static getFallbackSearchLinks(query: string) {
    const cleanQ = encodeURIComponent(query.trim());
    return [
      {
        name: 'Google Search (नेपाली शायरी र मुक्तक)',
        url: `https://www.google.com/search?q=${cleanQ}+nepali+shayari+muktak+poetry`,
        desc: 'गुगलमा प्रत्यक्ष खोजी गर्नुहोस्',
        badge: 'Google Search'
      },
      {
        name: 'Kavita Kosh (कविता कोश - नेपाली साहित्य)',
        url: `https://kavitakosh.org/kk/index.php?search=${cleanQ}`,
        desc: 'नेपाली तथा हिन्दी शास्त्रीय कविता एवं गजल कोश',
        badge: 'Classic Library'
      },
      {
        name: 'Rekhta (रेख़्ता - गजल र शेर)',
        url: `https://www.rekhta.org/search/shayari?q=${cleanQ}`,
        desc: 'विश्वप्रसिद्ध गजल, शेर र शायरी',
        badge: 'Rekhta'
      },
      {
        name: 'Wikiquote Devanagari (उक्ति कोश)',
        url: `https://hi.wikiquote.org/wiki/विशेष:खोज?search=${cleanQ}`,
        desc: 'सार्वजनिक सम्पत्ति तथा खुला उद्धरण',
        badge: 'Public Domain'
      }
    ];
  }
}
