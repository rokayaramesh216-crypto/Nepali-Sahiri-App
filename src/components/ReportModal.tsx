import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ShayariItem } from '../types/shayari';
import { StorageService } from '../services/storage';

interface ReportModalProps {
  item: ShayariItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ item, isOpen, onClose }) => {
  const [reason, setReason] = useState<'copyright' | 'inappropriate' | 'spam' | 'incorrect_info' | 'other'>('copyright');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveReport({
      itemId: item.id,
      itemContentSnippet: item.content.slice(0, 50),
      reason,
      details,
      email,
      reportedAt: new Date().toISOString()
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails('');
      setEmail('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900 font-nepali">
              सामग्री उजुरी (Report Content)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 font-nepali">
              उजुरी प्राप्त भयो (Report Submitted)
            </h4>
            <p className="text-xs text-slate-600 font-nepali">
              तपाईंको उजुरी समीक्षा गरिनेछ र प्रतिलिपि अधिकार वा नियम विपरीत भएमा तत्काल हटाइनेछ। धन्यवाद!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
              <span className="font-semibold text-slate-800">रचना: </span>
              <span className="italic line-clamp-2">"{item.content}"</span>
              <div className="text-[11px] text-slate-500 mt-1">— {item.author}</div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                उजुरीको कारण (Reason for Report) *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-nepali"
              >
                <option value="copyright">प्रतिलिपि अधिकार उल्लङ्घन (Copyright Infringement)</option>
                <option value="incorrect_info">गलत लेखक वा स्रोत (Wrong Author / Source)</option>
                <option value="inappropriate">अनुचित वा अश्लील शब्द (Inappropriate Content)</option>
                <option value="spam">स्प्याम वा विज्ञापन (Spam)</option>
                <option value="other">अन्य कारण (Other)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                विस्तृत विवरण (Details)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="कृपया समस्याबारे केही स्पष्ट पार्नुहोस्..."
                className="w-full p-2.5 rounded-xl border border-slate-200 font-nepali"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                तपाईंको इमेल (Email - ऐच्छिक)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                रद्द (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-semibold shadow-xs transition-colors"
              >
                उजुरी पठाउनुहोस् (Submit)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
