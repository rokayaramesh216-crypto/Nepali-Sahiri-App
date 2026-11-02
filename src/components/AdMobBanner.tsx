import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

interface AdMobBannerProps {
  placement?: 'bottom' | 'inline';
  onShowComposeGuide?: () => void;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({ placement = 'bottom', onShowComposeGuide }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Official Google AdMob Android Test Banner Ad Unit ID
  const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
  const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

  if (isDismissed) return null;

  return (
    <div
      className={`w-full transition-all duration-200 select-none ${
        placement === 'bottom'
          ? 'bg-slate-900 border-t border-slate-800 text-white py-1.5 px-3 shadow-lg'
          : 'my-4 bg-slate-900/95 border border-slate-800 rounded-xl text-white p-2.5 shadow-sm'
      }`}
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            Ad · Test
          </span>
          <div className="truncate text-xs">
            <span className="text-slate-300 font-medium">Google AdMob Test Banner</span>
            <span className="hidden sm:inline text-slate-500 text-[11px] ml-2">ID: {TEST_BANNER_ID}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowInfo(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors text-xs flex items-center gap-1"
            title="AdMob Test Configuration"
            aria-label="View AdMob Details"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">AdMob Setup</span>
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AdMob Configuration Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Google AdMob Integration</h3>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs text-slate-600">
              <p>
                In accordance with Google AdMob policy, this app is configured with <strong>official test ad unit IDs</strong> to prevent policy violations and invalid traffic during development.
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Android Banner Test ID</div>
                  <code className="text-xs font-mono text-rose-700 select-all block bg-white p-1 rounded border border-slate-200 mt-0.5">
                    {TEST_BANNER_ID}
                  </code>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Sample App ID</div>
                  <code className="text-xs font-mono text-slate-700 select-all block bg-white p-1 rounded border border-slate-200 mt-0.5">
                    {TEST_APP_ID}
                  </code>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-50 text-emerald-800 p-3 border border-emerald-200 text-[11px]">
                <strong>Policy Compliance:</strong> Non-intrusive placement, no automatic clicks, and no disruptive full-screen ads on every navigation action.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {onShowComposeGuide && (
                <button
                  onClick={() => {
                    setShowInfo(false);
                    onShowComposeGuide();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  View Jetpack Compose Code
                </button>
              )}
              <button
                onClick={() => setShowInfo(false)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                बुझें (Understood)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
