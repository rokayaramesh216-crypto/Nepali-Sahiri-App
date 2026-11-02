import { CategoryId, CategoryInfo, CardTheme } from '../types/shayari';

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'love',
    nameNepali: 'माया / प्रेम',
    nameEnglish: 'Love',
    iconName: 'Heart',
    description: 'मुटु छुने माया र प्रेमका भावनाहरू'
  },
  {
    id: 'sad',
    nameNepali: 'दुःखी / पीडा',
    nameEnglish: 'Sad & Pain',
    iconName: 'HeartCrack',
    description: 'टुटेको मन र आँशुका अभिव्यक्ति'
  },
  {
    id: 'poetry',
    nameNepali: 'नेपाली कविता',
    nameEnglish: 'Nepali Poetry',
    iconName: 'BookOpen',
    description: 'देवकोटा, भानुभक्त र आधुनिक कविहरू'
  },
  {
    id: 'muktak',
    nameNepali: 'मुक्तक',
    nameEnglish: 'Muktak',
    iconName: 'Feather',
    description: 'चार हरफमा कोरिएका गहिरा भावना'
  },
  {
    id: 'ghazal',
    nameNepali: 'गजल',
    nameEnglish: 'Ghazal',
    iconName: 'Music',
    description: 'मतला र मक्तासहितका मीठा गजलहरू'
  },
  {
    id: 'friendship',
    nameNepali: 'साथी / मित्रता',
    nameEnglish: 'Friendship',
    iconName: 'Users',
    description: 'सच्चा दोस्ती र मितेरी सम्बन्ध'
  },
  {
    id: 'motivation',
    nameNepali: 'प्रेरणा / हौसला',
    nameEnglish: 'Motivation',
    iconName: 'Sparkles',
    description: 'सङ्घर्ष र सफलताको ऊर्जा'
  },
  {
    id: 'life',
    nameNepali: 'जिन्दगी / जीवन',
    nameEnglish: 'Life & Reality',
    iconName: 'Compass',
    description: 'जीवनका यथार्थ र अनुभवहरू'
  },
  {
    id: 'family',
    nameNepali: 'परिवार / आमा-बुबा',
    nameEnglish: 'Family',
    iconName: 'Home',
    description: 'आमाको ममता र बुबाको त्याग'
  },
  {
    id: 'patriotic',
    nameNepali: 'देशभक्ति / नेपाल',
    nameEnglish: 'Patriotic',
    iconName: 'Flag',
    description: 'मेची-महाकाली र मातृभूमिको माया'
  },
  {
    id: 'festival',
    nameNepali: 'चाडपर्व / उत्सव',
    nameEnglish: 'Festivals',
    iconName: 'Calendar',
    description: 'दशैं, तिहार, छठ र नयाँ वर्ष'
  },
  {
    id: 'hindi',
    nameNepali: 'हिन्दी शायरी',
    nameEnglish: 'Hindi Shayari',
    iconName: 'ScrollText',
    description: 'मिर्जा गालिब र राहत इन्दोरीका शेर'
  },
  {
    id: 'english',
    nameNepali: 'अंग्रेजी / Quotes',
    nameEnglish: 'English Quotes',
    iconName: 'Quote',
    description: 'Inspiring English poems and famous quotes'
  }
];

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'rhododendron',
    name: 'नेपाली लालीगुराँस (Crimson)',
    bgGradient: 'from-red-900 via-rose-950 to-red-900',
    textColor: '#ffffff',
    accentColor: '#fecdd3',
    borderColor: '#e11d48',
    fontFamily: 'Mukta'
  },
  {
    id: 'royal-gold',
    name: 'शाही सुनौलो (Royal Gold)',
    bgGradient: 'from-amber-950 via-neutral-900 to-amber-950',
    textColor: '#fef3c7',
    accentColor: '#f59e0b',
    borderColor: '#d97706',
    fontFamily: 'Rozha One'
  },
  {
    id: 'himalayan-night',
    name: 'हिमालको रात (Midnight Indigo)',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    textColor: '#e0e7ff',
    accentColor: '#818cf8',
    borderColor: '#4f46e5',
    fontFamily: 'Mukta'
  },
  {
    id: 'vintage-parchment',
    name: 'भोजपत्र (Vintage Paper)',
    bgGradient: 'from-amber-50 via-orange-50 to-amber-100',
    textColor: '#451a03',
    accentColor: '#92400e',
    borderColor: '#b45309',
    fontFamily: 'Yantramanav'
  },
  {
    id: 'emerald-forest',
    name: 'हरियो पहाड (Forest Emerald)',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    textColor: '#d1fae5',
    accentColor: '#34d399',
    borderColor: '#059669',
    fontFamily: 'Mukta'
  },
  {
    id: 'minimal-dark',
    name: 'गाढा कालो (Obsidian)',
    bgGradient: 'from-neutral-950 via-stone-900 to-neutral-950',
    textColor: '#f5f5f5',
    accentColor: '#e5e5e5',
    borderColor: '#525252',
    fontFamily: 'Plus Jakarta Sans'
  },
  {
    id: 'sunset-marigold',
    name: 'सयपत्री सुन्तला (Sunset Marigold)',
    bgGradient: 'from-orange-950 via-amber-900 to-red-950',
    textColor: '#ffedd5',
    accentColor: '#fb923c',
    borderColor: '#ea580c',
    fontFamily: 'Rozha One'
  }
];
