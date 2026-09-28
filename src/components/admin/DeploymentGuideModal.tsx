import { X, Globe, Shield, Smartphone, Key, Monitor, CheckCircle2, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface DeploymentGuideModalProps {
  onClose: () => void;
}

export function DeploymentGuideModal({ onClose }: DeploymentGuideModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const adminUrl = window.location.origin + '?view=admin';

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(adminUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCreds = () => {
    navigator.clipboard?.writeText('Email: admin@geoattend.com\nPassword: Admin@2026\nRole: Super Admin / HR Head');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                डिप्लॉयमेंट गाइड: एडमिन अपना पोर्टल कैसे खोलेगी?
              </h3>
              <p className="text-xs text-slate-500">
                Production Deployment & Admin Access Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto leading-relaxed">
          {/* Main Answer Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-cyan-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>सीधा उत्तर: एडमिन के लिए 3 बहुत आसान तरीके हैं:</span>
            </div>
            <p className="text-slate-700 text-xs">
              प्रोजेक्ट डिप्लॉय होने के बाद एडमिन अपने <strong>लैपटॉप/कंप्यूटर ब्राउज़र (Chrome, Edge, Safari)</strong> में कंपनी के वेब लिंक (Domain URL) को खोलेगी और अपने एडमिन क्रेडेंशियल से लॉगिन करेगी।
            </p>
          </div>

          {/* 4 Core Pillars */}
          <div className="space-y-4">
            {/* 1. Direct Admin Web Link */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                    1
                  </div>
                  <span>वेबसाइट लिंक (Dedicated Admin Web URL)</span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-[11px] flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <p className="text-slate-500">
                जब यह प्रोजेक्ट होस्ट होगा (उदा. Cloud Run, Vercel, Firebase या आपके कस्टम डोमेन जैसे <code>https://hrms.yourcompany.com</code>):
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-cyan-700 text-[11px] break-all">
                {window.location.origin}/admin &nbsp;(या डायरेक्ट &ldquo;Admin Portal&rdquo; बटन)
              </div>
            </div>

            {/* 2. Admin Credentials */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <div className="w-6 h-6 rounded-md bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs">
                    2
                  </div>
                  <span>एडमिन लॉगिन आईडी व पासवर्ड (Admin Credentials)</span>
                </div>
                <button
                  onClick={handleCopyCreds}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-[11px] flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCreds ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Admin Email / Username:</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">admin@geoattend.com</div>
                  <div className="text-[10px] text-slate-500">(या avanishdhake1@gmail.com)</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Admin Master Password:</div>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">Admin@2026</div>
                  <div className="text-[10px] text-slate-500">(कंपनी द्वारा बदला जा सकता है)</div>
                </div>
              </div>
            </div>

            {/* 3. Device & Role Separation (PC vs Mobile) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                  3
                </div>
                <span>एडमिन और कर्मचारी के बीच स्पष्ट अंतर (Role Architecture)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg space-y-1">
                  <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>व्यवस्थापक (Admin Portal):</span>
                  </div>
                  <p className="text-slate-700">
                    एडमिन इसे <strong>कंप्यूटर / लैपटॉप</strong> की बड़ी स्क्रीन पर खोलती है जहाँ उसे लाइव जीपीएस रडार मैप, पेरोल गणना, नए कर्मचारी जोड़ने का फॉर्म, और छुट्टी मंज़ूरी का पूरा कंट्रोल मिलता है।
                  </p>
                </div>

                <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg space-y-1">
                  <div className="font-bold text-cyan-700 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>कर्मचारी (Employee Mobile App):</span>
                  </div>
                  <p className="text-slate-700">
                    कर्मचारी को केवल <strong>मोबाइल ऐप (Flutter APK / PWA)</strong> दिया जाता है। वे अपने ऑटो-जनरेटेड Login ID (उदा. <code>avanish1001</code>) से लॉगिन करते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Single Portal Smart Redirection */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                  4
                </div>
                <span>स्मार्ट ऑटो-रीडायरेक्शन (Auto Role Routing)</span>
              </div>
              <p className="text-slate-500">
                यदि एडमिन और कर्मचारी दोनों एक ही मुख्य वेबसाइट पर जाते हैं, तो लॉगिन पेज पर:
              </p>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                <li>
                  यदि <strong>Admin ID</strong> दर्ज की जाती है ➔ सीधे <strong>Admin Console</strong> खुलता है।
                </li>
                <li>
                  यदि <strong>Employee ID</strong> दर्ज की जाती है ➔ सीधे <strong>Employee Attendance App</strong> खुलता है।
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL एन्क्रिप्टेड एडमिन एक्सेस</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            समझ गया (Got It)
          </button>
        </div>
      </div>
    </div>
  );
}
