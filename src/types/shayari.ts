export type CategoryId =
  | 'all'
  | 'love'
  | 'sad'
  | 'poetry'
  | 'muktak'
  | 'ghazal'
  | 'friendship'
  | 'motivation'
  | 'life'
  | 'family'
  | 'patriotic'
  | 'festival'
  | 'hindi'
  | 'english';

export type ItemType = 'shayari' | 'poem' | 'ghazal' | 'muktak' | 'quote' | 'status';

export type Language = 'nepali' | 'hindi' | 'english';

export interface CategoryInfo {
  id: CategoryId;
  nameNepali: string;
  nameEnglish: string;
  iconName: string;
  description: string;
  count?: number;
}

export interface ShayariItem {
  id: string;
  title?: string;
  content: string;
  author: string;
  category: CategoryId;
  type: ItemType;
  language: Language;
  source?: string;
  sourceUrl?: string;
  isUserCreated?: boolean;
  createdAt: string;
  tags?: string[];
  likesCount?: number;
  copiedCount?: number;
  isPublicDomain?: boolean;
  isCommunityPost?: boolean;
  clientAuthorId?: string;
  sharesCount?: number;
  reportsCount?: number;
  status?: 'published' | 'under_review' | 'removed';
  isLikedByUser?: boolean;
}

export type CardThemeId =
  | 'rhododendron'
  | 'royal-gold'
  | 'himalayan-night'
  | 'vintage-parchment'
  | 'emerald-forest'
  | 'minimal-dark'
  | 'sunset-marigold';

export interface CardTheme {
  id: CardThemeId;
  name: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  fontFamily: string;
}

export type TabId = 'home' | 'community' | 'search' | 'create' | 'favorites' | 'downloads';

export interface CommunityReport {
  id: string;
  postId: string;
  postTitle?: string;
  reason: 'spam' | 'inappropriate' | 'copyright' | 'hate_speech' | 'other';
  details: string;
  reporterId?: string;
  timestamp: string;
}

export interface ReportContentData {
  itemId: string;
  itemTitle?: string;
  reason: 'copyright' | 'inappropriate' | 'spam' | 'incorrect_info' | 'other';
  details: string;
  userEmail?: string;
  timestamp: string;
}
