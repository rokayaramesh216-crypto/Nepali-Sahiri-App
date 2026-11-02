import { ShayariItem, CategoryId, ItemType, Language } from '../types/shayari';

const LIKED_POSTS_KEY = 'mankashabda_liked_community_posts_v1';
const MY_PUBLISHED_KEY = 'mankashabda_my_published_posts_v1';
const CLIENT_USER_ID_KEY = 'mankashabda_client_user_id_v1';

export interface PublishPayload {
  title?: string;
  content: string;
  author: string;
  category: CategoryId;
  type: ItemType;
  language?: Language;
  tags?: string[];
}

export class CommunityService {
  /**
   * Get or initialize a stable client user/device token
   */
  static getClientUserId(): string {
    let id = localStorage.getItem(CLIENT_USER_ID_KEY);
    if (!id) {
      id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(CLIENT_USER_ID_KEY, id);
    }
    return id;
  }

  /**
   * Get IDs of posts published by this client/device
   */
  static getMyPublishedIds(): string[] {
    try {
      const data = localStorage.getItem(MY_PUBLISHED_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Record that a post was published by this client
   */
  static recordMyPublishedPost(postId: string) {
    try {
      const ids = this.getMyPublishedIds();
      if (!ids.includes(postId)) {
        ids.unshift(postId);
        localStorage.setItem(MY_PUBLISHED_KEY, JSON.stringify(ids));
      }
    } catch (e) {
      console.error('Failed to record published post ID', e);
    }
  }

  /**
   * Check if a post was already liked by this user
   */
  static isPostLiked(postId: string): boolean {
    try {
      const data = localStorage.getItem(LIKED_POSTS_KEY);
      const list: string[] = data ? JSON.parse(data) : [];
      return list.includes(postId);
    } catch {
      return false;
    }
  }

  /**
   * Mark a post as liked locally
   */
  static recordPostLiked(postId: string) {
    try {
      const data = localStorage.getItem(LIKED_POSTS_KEY);
      const list: string[] = data ? JSON.parse(data) : [];
      if (!list.includes(postId)) {
        list.push(postId);
        localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Failed to save liked post', e);
    }
  }

  /**
   * Fetch public community posts from shared online database
   */
  static async fetchPosts(params?: {
    category?: string;
    sort?: 'latest' | 'popular';
    search?: string;
  }): Promise<{ posts: ShayariItem[]; total: number; storageBackend: string }> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'all') {
      searchParams.set('category', params.category);
    }
    if (params?.sort) {
      searchParams.set('sort', params.sort);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }

    const url = `/api/community/posts?${searchParams.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`समुदाय पोस्ट प्राप्त गर्न असफल भयो (${res.status})`);
    }

    const data = await res.json();
    const myIds = new Set(this.getMyPublishedIds());

    const posts: ShayariItem[] = (data.posts || []).map((p: any) => ({
      ...p,
      isCommunityPost: true,
      isUserCreated: myIds.has(p.id),
      isLikedByUser: this.isPostLiked(p.id)
    }));

    return {
      posts,
      total: data.total || posts.length,
      storageBackend: data.storageBackend || 'Shared Online Database'
    };
  }

  /**
   * Publish a post to the shared online database for all users
   */
  static async publishPost(payload: PublishPayload): Promise<ShayariItem> {
    const clientAuthorId = this.getClientUserId();
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        clientAuthorId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'प्रकाशन गर्न सकिएन');
    }

    this.recordMyPublishedPost(data.post.id);

    return {
      ...data.post,
      isCommunityPost: true,
      isUserCreated: true
    };
  }

  /**
   * Like a post in the shared online database
   */
  static async likePost(postId: string): Promise<number> {
    this.recordPostLiked(postId);
    const res = await fetch(`/api/community/posts/${postId}/like`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error('लाइक थप्न सकिएन');
    }
    const data = await res.json();
    return data.likesCount;
  }

  /**
   * Share a post
   */
  static async sharePost(postId: string): Promise<number> {
    const res = await fetch(`/api/community/posts/${postId}/share`, {
      method: 'POST'
    });
    if (!res.ok) {
      return 0;
    }
    const data = await res.json();
    return data.sharesCount;
  }

  /**
   * Submit moderation / spam report for a community post
   */
  static async reportPost(
    postId: string,
    reason: string,
    details: string,
    postTitle?: string
  ): Promise<{ message: string; autoHidden: boolean }> {
    const reporterId = this.getClientUserId();
    const res = await fetch(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        details,
        postTitle,
        reporterId
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'उजुरी पठाउन सकिएन');
    }
    return data;
  }

  /**
   * Fetch community stats
   */
  static async getStats(): Promise<{
    status: string;
    totalPublished: number;
    totalLikes: number;
    storageType: string;
  }> {
    try {
      const res = await fetch('/api/community/stats');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch community stats', e);
    }
    return {
      status: 'offline',
      totalPublished: 0,
      totalLikes: 0,
      storageType: 'Local Cache'
    };
  }
}
