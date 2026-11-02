import React from 'react';
import { X, ShieldCheck, Lock, Eye, Download, CheckCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-auto text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900 font-nepali">
              गोपनीयता नीति (Privacy Policy)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-900">एप: </span>
            <span>मनका शब्द - नेपाली शायरी (Man Ka Shabda)</span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              पछिल्लो अद्यावधिक: २०२६ (Latest Update: 2026)
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              १. व्यक्तिगत डाटा र स्थानीय भण्डारण (Local Storage & Room DB)
            </h4>
            <p className="text-slate-600">
              हाम्रो एपले तपाईंको कुनै पनि संवेदनशील व्यक्तिगत विवरण (जस्तै सम्पर्क नम्बर वा निजी सन्देश) सर्भरमा पठाउँदैन। तपाईंले सिर्जना गर्नुभएका आफ्ना रचनाहरू, मनपरेका (Favorites) र अफ्लाइन डाउनलोडहरू केवल तपाईंको उपकरणको आन्तरिक मेमोरी (Local Storage / Room Database) मा सुरक्षित रहन्छन्।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-rose-600" />
              २. फोटो र स्टोरेज अनुमति (Permissions on Android)
            </h4>
            <p className="text-slate-600">
              फोटो शायरी कार्ड (PNG) डाउनलोड गर्दा मात्र उपकरणको डाउनलोड्स फोल्डर वा ग्यालेरीमा फाइल सुरक्षित गर्न अनुमति प्रयोग गरिन्छ। एन्ड्रोइड १३+ मा केवल फोटो बचत गर्न आवश्यक Scoped Storage सिद्धान्त पालना गरिन्छ।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              ३. विज्ञापन नीति (Google AdMob Policy)
            </h4>
            <p className="text-slate-600">
              हाम्रो एप गुगल एडमोब (Google AdMob) को कडा नीति पालना गर्दछ। विकास चरणमा केवल आधिकारिक परीक्षण आईडी (Official Test Ad Unit IDs) प्रयोग गरिन्छ। विज्ञापनहरू प्रयोगकर्ताको सामग्री नछेकिने ठाउँमा मात्र राखिन्छ र कुनै पनि भ्रामक वा जबर्जस्ती क्लिक गराउने काम गरिँदैन।
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              ४. प्रतिलिपि अधिकार तथा खुला स्रोत (Copyright & Public Domain)
            </h4>
            <p className="text-slate-600">
              हामी साहित्यिक स्रष्टाहरूको सम्मान गर्छौं। एपमा रहेका शास्त्रीय रचनाहरू सार्वजनिक सम्पत्ति (Public Domain) हुन्। यदि कुनै सामग्रीमा प्रतिलिपि अधिकारको विषय भएमा एपभित्र रहेको "उजुरी (Report)" सुविधाबाट तुरुन्त जानकारी गराउन सक्नुहुन्छ।
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            स्वीकार गर्दछु (Acknowledge)
          </button>
        </div>
      </div>
    </div>
  );
};
