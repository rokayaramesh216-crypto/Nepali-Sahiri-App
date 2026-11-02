import { ShayariItem } from '../types/shayari';

const FAVORITES_KEY = 'mankashabda_favorites_v1';
const DOWNLOADS_KEY = 'mankashabda_offline_downloads_v1';
const USER_CONTENT_KEY = 'mankashabda_user_creations_v1';
const DRAFT_KEY = 'mankashabda_editor_draft_v1';
const REPORTS_KEY = 'mankashabda_user_reports_v1';
const SEEN_HISTORY_KEY = 'mankashabda_seen_history_v1';

export class StorageService {
  // --- FAVORITES ---
  static getFavorites(): ShayariItem[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load favorites', e);
      return [];
    }
  }

  static isFavorite(id: string): boolean {
    const list = this.getFavorites();
    return list.some(item => item.id === id);
  }

  static toggleFavorite(item: ShayariItem): boolean {
    try {
      const list = this.getFavorites();
      const index = list.findIndex(i => i.id === item.id);
      let isFav = false;
      if (index >= 0) {
        list.splice(index, 1);
        isFav = false;
      } else {
        list.unshift(item);
        isFav = true;
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('favorites_updated'));
      return isFav;
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      return false;
    }
  }

  // --- DOWNLOADS & OFFLINE READING ---
  static getDownloads(): ShayariItem[] {
    try {
      const data = localStorage.getItem(DOWNLOADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load downloads', e);
      return [];
    }
  }

  static isDownloaded(id: string): boolean {
    const list = this.getDownloads();
    return list.some(item => item.id === id);
  }

  static saveForOffline(item: ShayariItem): boolean {
    try {
      const list = this.getDownloads();
      if (!list.some(i => i.id === item.id)) {
        list.unshift({ ...item, createdAt: new Date().toISOString() });
        localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('downloads_updated'));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to save for offline', e);
      return false;
    }
  }

  static removeDownload(id: string): boolean {
    try {
      const list = this.getDownloads();
      const filtered = list.filter(i => i.id !== id);
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('downloads_updated'));
      return true;
    } catch (e) {
      console.error('Failed to remove download', e);
      return false;
    }
  }

  // --- USER CREATED CONTENT ---
  static getUserCreations(): ShayariItem[] {
    try {
      const data = localStorage.getItem(USER_CONTENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load user creations', e);
      return [];
    }
  }

  static saveUserCreation(item: ShayariItem): boolean {
    try {
      const list = this.getUserCreations();
      const existingIdx = list.findIndex(i => i.id === item.id);
      if (existingIdx >= 0) {
        list[existingIdx] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem(USER_CONTENT_KEY, JSON.stringify(list));
      // Clear draft after successful creation
      this.clearDraft();
      window.dispatchEvent(new CustomEvent('user_creations_updated'));
      return true;
    } catch (e) {
      console.error('Failed to save user creation', e);
      return false;
    }
  }

  static deleteUserCreation(id: string): boolean {
    try {
      const list = this.getUserCreations();
      const filtered = list.filter(i => i.id !== id);
      localStorage.setItem(USER_CONTENT_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('user_creations_updated'));
      return true;
    } catch (e) {
      console.error('Failed to delete user creation', e);
      return false;
    }
  }

  // --- LOCAL DRAFT ---
  static getDraft(): { content: string; title: string; category: string; author: string } | null {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static saveDraft(draft: { content: string; title: string; category: string; author: string }): void {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  }

  static clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.error('Failed to clear draft', e);
    }
  }

  // --- REPORTS ---
  static saveReport(report: any): boolean {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      const list = data ? JSON.parse(data) : [];
      list.push(report);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- CONTENT NORMALIZATION & TEXT HASHING ---
  static getContentHash(content: string): string {
    if (!content) return '';
    return content
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}\n\r\t]/gu, '')
      .slice(0, 100);
  }

  // --- SEEN HISTORY TRACKING ---
  static getSeenIdentifiers(): string[] {
    try {
      const data = localStorage.getItem(SEEN_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load seen history', e);
      return [];
    }
  }

  static getSeenHistorySet(): Set<string> {
    return new Set(this.getSeenIdentifiers());
  }

  static isItemSeen(item: ShayariItem): boolean {
    if (!item) return false;
    const seenSet = this.getSeenHistorySet();
    const hash = this.getContentHash(item.content);
    return seenSet.has(item.id) || (hash.length > 0 && seenSet.has(`hash:${hash}`));
  }

  static markItemAsSeen(itemOrItems: ShayariItem | ShayariItem[]): void {
    try {
      const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
      const seenSet = this.getSeenHistorySet();
      let changed = false;

      for (const item of items) {
        if (!item) continue;
        if (!seenSet.has(item.id)) {
          seenSet.add(item.id);
          changed = true;
        }
        const hash = this.getContentHash(item.content);
        if (hash && !seenSet.has(`hash:${hash}`)) {
          seenSet.add(`hash:${hash}`);
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem(SEEN_HISTORY_KEY, JSON.stringify(Array.from(seenSet)));
        window.dispatchEvent(new CustomEvent('seen_history_updated'));
      }
    } catch (e) {
      console.error('Failed to mark item as seen', e);
    }
  }

  static resetSeenHistory(): void {
    try {
      localStorage.removeItem(SEEN_HISTORY_KEY);
      window.dispatchEvent(new CustomEvent('seen_history_updated'));
    } catch (e) {
      console.error('Failed to reset seen history', e);
    }
  }

  static getSeenCount(): number {
    const list = this.getSeenIdentifiers();
    return list.filter(id => !id.startsWith('hash:')).length;
  }

  /**
   * Deduplicate an array of shayaris based on unique ID and normalized content hash
   */
  static deduplicateShayaris(items: ShayariItem[]): ShayariItem[] {
    const seenIds = new Set<string>();
    const seenHashes = new Set<string>();
    const deduplicated: ShayariItem[] = [];

    for (const item of items) {
      if (!item) continue;
      const hash = this.getContentHash(item.content);
      if (seenIds.has(item.id)) {
        continue;
      }
      if (hash && seenHashes.has(hash)) {
        continue;
      }

      seenIds.add(item.id);
      if (hash) seenHashes.add(hash);
      deduplicated.push(item);
    }

    return deduplicated;
  }
}
