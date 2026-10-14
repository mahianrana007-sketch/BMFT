import React, { useState } from 'react';
import { 
  X, Copy, Check, Share2, Globe, QrCode, Sparkles, 
  MessageCircle 
} from 'lucide-react';

interface ShareWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentName: string;
}

export const ShareWebsiteModal: React.FC<ShareWebsiteModalProps> = ({
  isOpen,
  onClose,
  tournamentName,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const OFFICIAL_SITE_URL = 'https://bmftauction.netlify.app';
  const baseUrl = OFFICIAL_SITE_URL;

  const links = [
    {
      key: 'main',
      title: 'অফিসিয়াল ওয়েবসাইট লিংক (Official Website)',
      desc: 'সবার জন্য টুর্নামেন্টের ওভারভিউ, দল ও স্কোরবোর্ড দেখার উন্মুক্ত লিংক',
      url: OFFICIAL_SITE_URL,
      badge: 'অফিসিয়াল লিংক',
    },
    {
      key: 'register',
      title: 'প্লেয়ার রেজিস্ট্রেশন লিংক (Player Registration)',
      desc: 'খেলোয়াড়দের সম্পূর্ণ ফ্রি রেজিস্ট্রেশন ও প্রোফাইল এডিট লিংক',
      url: `${OFFICIAL_SITE_URL}/?tab=player-register`,
      badge: 'ফ্রি প্লেয়ার নিবন্ধন',
    },
    {
      key: 'live',
      title: 'লাইভ নিলাম ও প্রজেক্টর ভিউ (Live Auction & Spectator)',
      desc: 'বড় পর্দা বা দর্শকদের রিয়েল-টাইম লাইভ বিডিং দেখার লিংক',
      url: `${OFFICIAL_SITE_URL}/?tab=live`,
      badge: 'ফ্রি লাইভ দর্শক',
    },
    {
      key: 'teams',
      title: 'দলের তালিকা ও স্কোয়াড লিংক (Teams & Squads)',
      desc: '৪টি দল, ওনারদের বিবরণ, অবশিষ্ট বাজেট এবং টিম স্কোয়াড দেখার লিংক',
      url: `${OFFICIAL_SITE_URL}/?tab=teams`,
      badge: '৪ টিম স্কোয়াড',
    },
    {
      key: 'history',
      title: 'নিলামের ফলাফল ও হিস্ট্রি লিংক (Auction History)',
      desc: 'বিক্রিত খেলোয়াড়, সর্বোচ্চ দর ও নিলামের পূর্ণাঙ্গ লগ দেখার লিংক',
      url: `${OFFICIAL_SITE_URL}/?tab=history`,
      badge: 'অকশন হিস্ট্রি',
    },
    {
      key: 'players',
      title: 'খেলোয়াড় তালিকা লিংক (All Players Pool)',
      desc: 'রেজিস্ট্রেশনকৃত সকল খেলোয়াড়ের প্রোফাইল ও স্ট্যাটাস দেখার লিংক',
      url: `${OFFICIAL_SITE_URL}/?tab=players`,
      badge: 'প্লেয়ার লিস্ট',
    },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(baseUrl)}&bgcolor=041a10&color=10b981&qzone=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#07190f] border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white font-sport">
                পাবলিক শেয়ার ও ফ্রি ওয়েবসাইট লিংক
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black">
                ১০০% ফ্রি
              </span>
            </div>
            <p className="text-xs text-slate-400">
              যেকোনো ডিভাইসে বিনামূল্যে ব্যবহার ও সবার সাথে শেয়ার করুন
            </p>
          </div>
        </div>

        {/* Free Banner Notice */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-black/60 to-emerald-950/70 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              কোনো সাবস্ক্রিপশন বা ক্রেডিট কার্ডের প্রয়োজন নেই। প্লেয়ার, ওনার ও দর্শকরা বিনামূল্যে ব্যবহার করতে পারবেন।
            </span>
          </div>
        </div>

        {/* Links List */}
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.key}
              className="p-3 rounded-xl bg-black/50 border border-emerald-950 space-y-2 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{link.title}</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">
                      {link.badge}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">{link.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={link.url}
                  className="flex-1 px-3 py-1.5 bg-black/80 border border-emerald-950 rounded-lg text-xs font-mono text-emerald-300 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(link.url, link.key)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  {copiedKey === link.key ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Section */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-[#041a10] p-1.5 shrink-0 flex items-center justify-center">
            <img
              src={qrCodeUrl}
              alt="Tournament QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <span className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>মোবাইল স্ক্যানার কিউআর কোড (QR Code)</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              মোবাইলের ক্যামেরা দিয়ে স্ক্যান করলেই বিনামূল্যে ওয়েবসাইটটি খুলে যাবে। টুর্নামেন্ট পোস্টার বা ব্যানার তৈরিতে ব্যবহার করতে পারেন।
            </p>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950">
          <div className="flex items-center gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${tournamentName} ফ্রি ফুটবল অকশন পোর্টাল: ${baseUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Facebook</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
