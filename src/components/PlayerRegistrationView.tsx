import React, { useState } from 'react';
import { Player, Position } from '../types';
import { 
  UserPlus, Upload, Check, AlertCircle, Copy, CheckCheck, 
  Edit3, PlayCircle, Loader2, Globe, ShieldCheck
} from 'lucide-react';
import { getSafePlayerPhoto, DEFAULT_PLAYER_PHOTO, compressImageFile } from '../utils/media';
import { FirestoreSync } from '../services/firebase';

interface PlayerRegistrationViewProps {
  players: Player[];
  defaultBasePrice: number;
  onRegisterPlayer: (player: Player) => Promise<{ success: boolean; error?: string }> | void;
  onUpdatePlayerProfile: (player: Player) => Promise<{ success: boolean; error?: string }> | void;
  onWatchLiveAuction: () => void;
}

export const PlayerRegistrationView: React.FC<PlayerRegistrationViewProps> = ({
  players,
  defaultBasePrice,
  onRegisterPlayer,
  onUpdatePlayerProfile,
  onWatchLiveAuction,
}) => {
  const [mode, setMode] = useState<'register' | 'edit-login' | 'editing'>('register');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Registration Form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [age, setAge] = useState<number>(20);
  const [jerseyNumber, setJerseyNumber] = useState<number>(10);
  const [position, setPosition] = useState<Position>('MID');
  const [preferredFoot, setPreferredFoot] = useState<'Right' | 'Left' | 'Both'>('Right');
  const [experience, setExperience] = useState('স্থানীয় ফুটবল টুর্নামেন্ট প্লেয়ার');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [height, setHeight] = useState('5 ft 9 in');
  const [weight, setWeight] = useState('68 kg');

  // Edit Login state
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [activeEditingPlayer, setActiveEditingPlayer] = useState<Player | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const OFFICIAL_SITE_URL = 'https://bmftauction.netlify.app';
  const registrationLink = `${OFFICIAL_SITE_URL}/?tab=player-register`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারে' });
        return;
      }
      setIsCompressingPhoto(true);
      try {
        const compressed = await compressImageFile(file, 480, 480, 0.82);
        setPhotoUrl(compressed);
        setMessage({ type: 'success', text: 'ছবি সফলভাবে অপ্টিমাইজ ও লোড হয়েছে!' });
      } catch {
        setMessage({ type: 'error', text: 'ছবি প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।' });
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'আপনার নাম প্রদান করুন' });
      return;
    }
    if (!mobile.trim()) {
      setMessage({ type: 'error', text: 'মোবাইল নম্বর প্রদান করুন' });
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setMessage({ type: 'error', text: 'প্রোফাইল সুরক্ষায় কমপক্ষে ৪ সংখ্যার পিন কোড দিন' });
      return;
    }

    // Check duplicate mobile
    const existing = players.find(
      (p) => p.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '')
    );
    if (existing) {
      setMessage({
        type: 'error',
        text: 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে একজন প্লেয়ার নিবন্ধিত হয়েছে! "প্রোফাইল এডিট" ট্যাবে যান।',
      });
      return;
    }

    const maxNum = players.reduce((max, p) => {
      const match = p.id.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 100;
      return num > max ? num : max;
    }, 100);
    const nextPlayerId = `PL-${maxNum + 1}`;

    const newPlayer: Player = {
      id: nextPlayerId,
      name: name.trim(),
      age: Number(age) || 20,
      mobile: mobile.trim(),
      jerseyNumber: Number(jerseyNumber) || 10,
      position,
      rating: 8.0,
      experience: experience.trim() || 'স্থানীয় টুর্নামেন্ট প্লেয়ার',
      basePrice: defaultBasePrice || 200,
      status: 'available',
      approvalStatus: 'PENDING',
      teamId: null,
      soldPrice: null,
      photoUrl: photoUrl.trim() || DEFAULT_PLAYER_PHOTO,
      bio: bio.trim(),
      preferredFoot,
      height: height.trim(),
      weight: weight.trim(),
      registeredViaLink: true,
      pin: pin.trim(),
      createdAt: new Date().toISOString(),
      careerStats: {
        matchesPlayed: 15,
        goals: position === 'ST' ? 6 : position === 'MID' ? 3 : 0,
        assists: position === 'MID' ? 5 : 2,
        cleanSheets: position === 'GK' || position === 'DEF' ? 4 : 0,
        yellowCards: 1,
        redCards: 0,
        shotAccuracy: 75,
        passAccuracy: 80,
      },
    };

    setIsSubmitting(true);
    try {
      const res = await onRegisterPlayer(newPlayer);
      if (res && typeof res === 'object' && res.success === false) {
        setMessage({
          type: 'error',
          text: `ডাটাবেজ সংরক্ষণ ব্যর্থ হয়েছে: ${res.error || 'Firebase-এ সংযোগ সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।'}`,
        });
        return;
      }

      setMessage({
        type: 'success',
        text: `রেজিস্ট্রেশন সফল ও Firebase-এ সংরক্ষিত! প্লেয়ার ID: ${newPlayer.id}। আপনার প্রোফাইলটি বর্তমানে এডমিন অনুমোদনের অপেক্ষায় রয়েছে (Status: PENDING)। এডমিন অনুমোদন করলেই আপনি অফিসিয়াল নিলাম পুলে যুক্ত হবেন।`,
      });

      // Reset fields on success
      setName('');
      setMobile('');
      setPin('');
      setBio('');
      setPhotoUrl('');

      // Record player registration session in Firestore
      const getDevice = () => {
        if (typeof navigator === 'undefined') return 'ওয়েব ব্রাউজার';
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'Android Mobile';
        if (/iPad|iPhone|iPod/.test(ua)) return 'iPhone/iOS';
        if (/mobile/i.test(ua)) return 'Mobile Device';
        return 'ওয়েব ব্রাউজার';
      };
      FirestoreSync.recordUserLogin({
        id: `sess-reg-${newPlayer.id}-${Date.now()}`,
        userId: newPlayer.id,
        name: newPlayer.name,
        role: 'player',
        deviceInfo: getDevice(),
        loginTime: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: 'online',
      }).catch(() => {});
    } catch (err) {
      console.error('Registration submit error:', err);
      setMessage({
        type: 'error',
        text: 'Firebase Database-এ সংরক্ষণ ব্যর্থ হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanMobile = loginMobile.replace(/\D/g, '');
    const player = players.find((p) => {
      const pClean = p.mobile.replace(/\D/g, '');
      return pClean === cleanMobile || p.id.toLowerCase() === loginMobile.trim().toLowerCase();
    });

    if (!player) {
      setMessage({ type: 'error', text: 'এই মোবাইল বা Player ID দিয়ে কোনো প্লেয়ার পাওয়া যায়নি।' });
      return;
    }

    if (player.pin && player.pin !== loginPin.trim()) {
      setMessage({ type: 'error', text: 'ভুল পিন কোড! সঠিক পিন দিয়ে চেষ্টা করুন।' });
      return;
    }

    setActiveEditingPlayer(player);
    setName(player.name);
    setMobile(player.mobile);
    setAge(player.age);
    setJerseyNumber(player.jerseyNumber);
    setPosition(player.position);
    setPreferredFoot(player.preferredFoot || 'Right');
    setExperience(player.experience);
    setBio(player.bio || '');
    setPhotoUrl(player.photoUrl);
    setHeight(player.height || '5 ft 9 in');
    setWeight(player.weight || '68 kg');
    setMode('editing');

    // Record player edit login session in Firestore
    const getDevice = () => {
      if (typeof navigator === 'undefined') return 'ওয়েব ব্রাউজার';
      const ua = navigator.userAgent;
      if (/android/i.test(ua)) return 'Android Mobile';
      if (/iPad|iPhone|iPod/.test(ua)) return 'iPhone/iOS';
      if (/mobile/i.test(ua)) return 'Mobile Device';
      return 'ওয়েব ব্রাউজার';
    };
    FirestoreSync.recordUserLogin({
      id: `sess-player-${player.id}-${Date.now()}`,
      userId: player.id,
      name: player.name,
      role: 'player',
      deviceInfo: getDevice(),
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'online',
    }).catch(() => {});
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingPlayer) return;

    const updated: Player = {
      ...activeEditingPlayer,
      name: name.trim(),
      age: Number(age),
      jerseyNumber: Number(jerseyNumber),
      position,
      preferredFoot,
      experience: experience.trim(),
      bio: bio.trim(),
      photoUrl: photoUrl.trim() || DEFAULT_PLAYER_PHOTO,
      height: height.trim(),
      weight: weight.trim(),
    };

    setIsSubmitting(true);
    try {
      await onUpdatePlayerProfile(updated);
      setActiveEditingPlayer(null);
      setMode('register');
      setMessage({
        type: 'success',
        text: 'আপনার প্লেয়ার প্রোফাইল সফলভাবে Firebase-এ আপডেট করা হয়েছে!',
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner with Direct Registration Link */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#041a10] via-[#072417] to-[#041a10] border border-emerald-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>প্লেয়ার সেলফ-রেজিস্ট্রেশন পোর্টাল</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[11px] font-bold shadow-md">
                ১০০% ফ্রি রেজিস্ট্রেশন (Zero Fees)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-sport">
              ফুটবলারদের অনলাইন নিবন্ধন ও প্রোফাইল
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              প্লেয়ারদের জন্য সম্পূর্ণ বিনামূল্যে নিবন্ধন। কোনো ফি বা চার্জ নেই। নিবন্ধন করে নিজের প্রোফাইল এডিট করতে পারবেন এবং বিনামূল্যে লাইভ নিলাম দেখতে পারবেন।
            </p>
          </div>

          <button
            onClick={onWatchLiveAuction}
            className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sport font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <PlayCircle className="w-4 h-4" />
            <span>লাইভ নিলাম দেখুন (Watch Live)</span>
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <span className="text-xs font-bold text-emerald-400 shrink-0">রেজিস্ট্রেশন লিংক:</span>
            <span className="text-xs text-slate-300 font-mono truncate select-all">
              {registrationLink || 'লিংক তৈরি হচ্ছে...'}
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto py-1.5 px-4 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-950 bg-[#06180f] rounded-2xl p-1 gap-1">
        <button
          onClick={() => {
            setMode('register');
            setMessage(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'register'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন প্লেয়ার নিবন্ধন (Register)</span>
        </button>

        <button
          onClick={() => {
            setMode('edit-login');
            setMessage(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'edit-login' || mode === 'editing'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>নিজের প্রোফাইল এডিট (Edit My Profile)</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Mode 1: Register Form */}
      {mode === 'register' && (
        <form
          onSubmit={handleRegisterSubmit}
          className="p-6 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-5 shadow-xl text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
            <h3 className="text-base font-bold text-white font-sport">
              প্লেয়ার তথ্য ফর্ম পূরণ করুন
            </h3>
            <span className="text-slate-400 text-[11px]">* চিহ্নিত ফিল্ডগুলো আবশ্যক</span>
          </div>

          {/* Photo Upload & Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-black/40 border border-emerald-950">
            <div className="relative w-24 h-28 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 shrink-0 shadow-md">
              <img
                src={getSafePlayerPhoto(photoUrl)}
                alt="Preview"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                }}
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                প্লেয়ারের ছবি (Player Photo)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="py-2 px-3.5 rounded-xl bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ডিভাইস থেকে আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="অথবা অনলাইন ছবির লিংক দিন (https://...)"
                className="w-full px-3 py-1.5 bg-black/60 border border-emerald-950 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Name & Mobile & PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">আপনার পুরো নাম *</label>
              <input
                type="text"
                required
                placeholder="যেমন: তানভীর ইসলাম"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">মোবাইল নম্বর *</label>
              <input
                type="text"
                required
                placeholder="017xxxxxxxx"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                ৪ সংখ্যার পিন কোড (ভবিষ্যতে এডিটের জন্য) *
              </label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="যেমন: 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Age, Jersey, Position */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">বয়স (Age)</label>
              <input
                type="number"
                min="14"
                max="50"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">পছন্দের জার্সি নম্বর</label>
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">খেলার পজিশন *</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              >
                <option value="GK">GK (গোলকিপার)</option>
                <option value="DEF">DEF (ডিফেন্ডার)</option>
                <option value="MID">MID (মিডফিল্ডার)</option>
                <option value="ST">ST (স্ট্রাইকার)</option>
              </select>
            </div>
          </div>

          {/* Foot, Height, Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">পছন্দের পা (Foot)</label>
              <select
                value={preferredFoot}
                onChange={(e) => setPreferredFoot(e.target.value as 'Right' | 'Left' | 'Both')}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              >
                <option value="Right">ডান পা (Right)</option>
                <option value="Left">বাম পা (Left)</option>
                <option value="Both">উভয় পা (Both)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">উচ্চতা (Height)</label>
              <input
                type="text"
                placeholder="5 ft 10 in"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">ওজন (Weight)</label>
              <input
                type="text"
                placeholder="70 kg"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">খেলার পূর্ব অভিজ্ঞতা</label>
            <input
              type="text"
              placeholder="যেমন: ৩ বছর জেলা লিগ"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">সংক্ষিপ্ত বায়ো / নিজের কথা</label>
            <textarea
              rows={3}
              placeholder="আপনার প্রিয় কৌশল, গতি, ড্রিবলিং বা খেলার বিশেষ দিক লিখুন..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              * নিবন্ধন সম্পন্ন হলে আপনি সরাসরি লাইভ নিলাম স্ক্রিন দেখতে পারবেন
            </span>
            <button
              type="submit"
              disabled={isSubmitting || isCompressingPhoto}
              className={`py-3 px-6 rounded-xl font-bold font-sport text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting || isCompressingPhoto
                  ? 'bg-emerald-600/60 text-emerald-100 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25 hover:scale-[1.02]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Firebase-এ সংরক্ষণ হচ্ছে...</span>
                </>
              ) : isCompressingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>ছবি প্রসেস হচ্ছে...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>নিবন্ধন সম্পন্ন করুন (Submit Registration)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Mode 2: Player Login for Profile Edit */}
      {mode === 'edit-login' && (
        <form
          onSubmit={handleEditLogin}
          className="p-6 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-4 max-w-md mx-auto shadow-xl text-xs"
        >
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white font-sport">
              প্লেয়ার লগইন (প্রোফাইল এডিট)
            </h3>
            <p className="text-slate-400 text-xs">
              আপনার নিবন্ধিত মোবাইল নম্বর অথবা Player ID এবং পিন কোড দিন
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              মোবাইল নম্বর অথবা Player ID *
            </label>
            <input
              type="text"
              required
              placeholder="017xxxxxxxx অথবা PL-101"
              value={loginMobile}
              onChange={(e) => setLoginMobile(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">পিন কোড (PIN) *</label>
            <input
              type="password"
              required
              placeholder="নিবন্ধনের সময় দেওয়া পিন কোড"
              value={loginPin}
              onChange={(e) => setLoginPin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-sport cursor-pointer transition-colors shadow-lg"
          >
            প্রোফাইলে প্রবেশ করুন
          </button>
        </form>
      )}

      {/* Mode 3: Player Editing their own Profile */}
      {mode === 'editing' && activeEditingPlayer && (
        <form
          onSubmit={handleProfileSave}
          className="p-6 rounded-2xl bg-[#06180f] border border-emerald-950 space-y-4 shadow-xl text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
            <div>
              <h3 className="text-base font-bold text-white font-sport">
                প্রোফাইল তথ্য সম্পাদনা ({activeEditingPlayer.name})
              </h3>
              <span className="text-emerald-400 font-mono text-xs">ID: {activeEditingPlayer.id}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setActiveEditingPlayer(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              বাতিল
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-black/40 border border-emerald-950">
            <div className="relative w-20 h-24 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 shrink-0">
              <img
                src={getSafePlayerPhoto(photoUrl)}
                alt="Profile Preview"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PLAYER_PHOTO;
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                ছবি পরিবর্তন (Upload New Photo)
              </label>
              <label className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>নতুন ছবি বেছে নিন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                placeholder="অথবা অনলাইন ছবির URL দিন"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-1 bg-black/60 border border-emerald-950 rounded-lg text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">নাম *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">জার্সি নম্বর</label>
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">পজিশন</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white"
              >
                <option value="GK">GK</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="ST">ST</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">বায়োগ্রাফি / নিজের নোট</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-emerald-950 rounded-xl text-white resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setActiveEditingPlayer(null);
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-sport cursor-pointer shadow-lg"
            >
              প্রোফাইল আপডেট করুন
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
