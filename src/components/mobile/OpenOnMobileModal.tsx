import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Download,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface OpenOnMobileModalProps {
  onClose: () => void;
}

export function OpenOnMobileModal({ onClose }: OpenOnMobileModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  // Compute the direct mobile link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-rfzx5puo5d7ikvxogikllw-759842074649.asia-east1.run.app';
  // Use shared app url or current origin with view=mobile
  const mobileUrl = `${currentOrigin}?view=mobile`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`GeoAttend HRMS मोबाइल ऐप लिंक: ${mobileUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                अपने मोबाइल में यह ऐप कैसे लें?
              </h3>
              <p className="text-xs text-slate-400">
                Scan QR Code or Install as App on Android & iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers: Instant PWA vs Flutter APK */}
        <div className="px-6 pt-4 bg-slate-950/40 border-b border-slate-800/80 flex gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pwa'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>विधि 1: 10 सेकंड में तुरंत इंस्टॉल करें (Instant Web App / PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'apk'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>विधि 2: Flutter APK (Native Android)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
          {activeTab === 'pwa' ? (
            <div className="space-y-5">
              {/* Step 1: Scan QR Code */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex items-center justify-center">
                  <QRCodeSVG
                    value={mobileUrl}
                    size={150}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-2.5 text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-300 font-bold">
                    <QrCode className="w-3 h-3" />
                    <span>कदम 1: कैमरा से स्कैन करें</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    अपने फोन के कैमरे से इस QR कोड को स्कैन करें
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Android (Google Lens / Camera) या iPhone (Camera) से स्कैन करते ही यह ऐप आपके मोबाइल में खुल जाएगा।
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'लिंक कॉपी हो गया!' : 'मोबाइल लिंक कॉपी करें'}</span>
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800 rounded-xl flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp पर भेजें</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Add to Home Screen (How to install on phone) */}
              <div className="bg-gradient-to-r from-slate-950 to-indigo-950/50 p-4 rounded-2xl border border-indigo-900/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>कदम 2: फोन में ऐप की तरह कैसे सेव करें (Add to Home Screen)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Android instructions */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Android (Chrome Browser):</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px] leading-tight">
                      <li>Chrome में ऊपर दाएँ कोने में <strong>3 डॉट्स (⋮)</strong> दबाएँ।</li>
                      <li><strong>&ldquo;Install app&rdquo;</strong> या <strong>&ldquo;Add to Home screen&rdquo;</strong> चुनें।</li>
                      <li>आपके फोन की होम स्क्रीन पर GeoAttend ऐप का आइकन आ जाएगा!</li>
                    </ol>
                  </div>

                  {/* iPhone instructions */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Apple iPhone (Safari):</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px] leading-tight">
                      <li>नीचे दिए गए <strong>Share बटन (वर्गाकार + तीर)</strong> पर टैप करें।</li>
                      <li>नीचे स्क्रॉल करके <strong>&ldquo;Add to Home Screen&rdquo;</strong> चुनें।</li>
                      <li>ऊपर दाएँ कोने में <strong>&ldquo;Add&rdquo;</strong> दबाएँ।</li>
                    </ol>
                  </div>
                </div>

                <p className="text-[11px] text-cyan-300/90 bg-cyan-950/50 p-2.5 rounded-xl border border-cyan-800/60">
                  ⚡ <strong>विशेषता:</strong> इसमें आपके फोन का असली GPS, कैमरा (सेल्फी वेरिफिकेशन), और बैकग्राउंड लोकेशन ट्रैकिंग सब कुछ वास्तविक ऐप की तरह काम करता है!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Flutter Native Android APK बनाना:</span>
                </div>
                <p className="text-slate-300">
                  इस प्रोजेक्ट में कर्मचारियों के लिए संपूर्ण <strong>Flutter (Dart)</strong> नेटिव कोड पहले से शामिल है। आप इसे 1 कमांड में कंपाइल करके <code>.apk</code> फाइल बना सकते हैं:
                </p>

                <div className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-cyan-300 border border-slate-800 space-y-1">
                  <div className="text-slate-500"># 1. Flutter dependencies डाउनलोड करें</div>
                  <div>flutter pub get</div>
                  <div className="text-slate-500 pt-1"># 2. Release APK बनाएं</div>
                  <div className="text-emerald-400 font-bold">flutter build apk --release</div>
                </div>

                <p className="text-slate-400 text-[11px]">
                  उत्पन्न हुई APK फाइल <code>build/app/outputs/flutter-apk/app-release.apk</code> को आप WhatsApp या Google Drive से कर्मचारियों के Android फोन में सीधे इनस्टॉल करवा सकते हैं।
                </p>

                <div className="pt-2">
                  <a
                    href="#flutter"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      // App.tsx will handle view switch if needed
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    <span>शीर्ष बार में &ldquo;Flutter Code&rdquo; टैब में पूरा कोड देखें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Instant Cloud Preview Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
          >
            समझ गया (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
