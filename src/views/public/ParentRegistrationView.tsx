import React, { useState } from 'react';
import {
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Plus,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { calculateAgeGroup } from '../../utils/ageGroup.ts';
import { DominantFoot, Player, PlayerRegistration } from '../../types/database.ts';

interface ParentRegistrationViewProps {
  onBackToHome: () => void;
  onGoToLogin: () => void;
  onOpenPrivacyTerms: () => void;
  onRegistrationComplete: (userRole: string) => void;
}

const POSITIONS = [
  'Penyerang Tengah (Striker)',
  'Penyerang Sayap (Winger)',
  'Gelandang Serang (Attacking Midfield)',
  'Gelandang Tengah (Central Midfield)',
  'Gelandang Bertahan (Defensive Midfield)',
  'Bek Sayap Kanan (Right Back)',
  'Bek Sayap Kiri (Left Back)',
  'Bek Tengah (Center Back)',
  'Kiper (Goalkeeper)',
];

const EXPERIENCE_OPTIONS = [
  'Pemula (< 6 bulan)',
  '6 bulan – 1 tahun',
  '1 – 2 tahun',
  '2 – 3 tahun',
  'Lebih dari 3 tahun',
];

const MAX_CHILDREN = 4;

interface AthleteInput {
  fullName: string;
  nickname: string;
  birthDate: string;
  birthPlace: string;
  gender: 'Laki-laki' | 'Perempuan';
  photoUrl: string;
  address: string;
  school: string;
  schoolGrade: string;
  primaryPosition: string;
  secondaryPosition: string;
  dominantFoot: DominantFoot;
  playingExperience: string;
  previousClub: string;
  additionalNotes: string;
}

const createDefaultAthlete = (): AthleteInput => ({
  fullName: '',
  nickname: '',
  birthDate: '2016-05-15',
  birthPlace: '',
  gender: 'Laki-laki',
  photoUrl: '',
  address: '',
  school: '',
  schoolGrade: '',
  primaryPosition: POSITIONS[0],
  secondaryPosition: '',
  dominantFoot: 'Kanan',
  playingExperience: EXPERIENCE_OPTIONS[1],
  previousClub: '',
  additionalNotes: '',
});

export const ParentRegistrationView: React.FC<ParentRegistrationViewProps> = ({
  onBackToHome,
  onGoToLogin,
  onOpenPrivacyTerms,
  onRegistrationComplete,
}) => {
  const { registerParentWithAthlete, activateUserSession } = useAuth();
  const { injectRegisteredPlayerAndUser } = useData();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Success result storage supporting 1 to 4 children
  const [successData, setSuccessData] = useState<{
    players: Player[];
    registrations: PlayerRegistration[];
    user: any;
    token: string;
  } | null>(null);

  // Parent Form State
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [relationship, setRelationship] = useState('Ayah');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Multiple Athletes State (Max 4)
  const [athletes, setAthletes] = useState<AthleteInput[]>([createDefaultAthlete()]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  const currentAthlete = athletes[activeChildIndex] || athletes[0];
  const currentAgeCalc = calculateAgeGroup(currentAthlete.birthDate);

  const updateCurrentAthlete = <K extends keyof AthleteInput>(field: K, value: AthleteInput[K]) => {
    setAthletes((prev) => {
      const copy = [...prev];
      copy[activeChildIndex] = {
        ...copy[activeChildIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const addChild = () => {
    if (athletes.length >= MAX_CHILDREN) return;
    setAthletes((prev) => [...prev, createDefaultAthlete()]);
    setActiveChildIndex(athletes.length);
  };

  const removeChild = (indexToRemove: number) => {
    if (athletes.length <= 1) return;
    setAthletes((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setActiveChildIndex((prev) => (prev >= indexToRemove ? Math.max(0, prev - 1) : prev));
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    setErrorMessage(null);
    if (!parentName.trim()) {
      setErrorMessage('Nama lengkap orang tua/wali wajib diisi.');
      return;
    }
    const cleanEmail = parentEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Email aktif yang valid wajib diisi untuk verifikasi akun.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Kebijakan Privasi dan Ketentuan Penggunaan untuk melanjutkan.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation (check all athletes)
  const handleNextFromStep2 = () => {
    setErrorMessage(null);
    for (let i = 0; i < athletes.length; i++) {
      const child = athletes[i];
      const childName = child.nickname.trim() || `Anak ke-${i + 1}`;
      if (!child.fullName.trim()) {
        setActiveChildIndex(i);
        setErrorMessage(`Nama lengkap untuk ${childName} wajib diisi.`);
        return;
      }
      if (!child.nickname.trim()) {
        setActiveChildIndex(i);
        setErrorMessage(`Nama panggilan untuk ${childName} wajib diisi.`);
        return;
      }
      if (!child.birthDate) {
        setActiveChildIndex(i);
        setErrorMessage(`Tanggal lahir untuk ${childName} wajib diisi.`);
        return;
      }
    }
    setCurrentStep(3);
  };

  // Final Submission (Kirim Pendaftaran 1 - 4 Atlet)
  const handleSubmitAll = async () => {
    setErrorMessage(null);

    // Validate football info for each child
    for (let i = 0; i < athletes.length; i++) {
      const child = athletes[i];
      const childName = child.nickname.trim() || `Anak ke-${i + 1}`;
      if (!child.primaryPosition) {
        setActiveChildIndex(i);
        setErrorMessage(`Posisi bermain utama untuk ${childName} wajib dipilih.`);
        return;
      }
    }

    if (athletes.length > MAX_CHILDREN) {
      setErrorMessage(`Batas maksimal pendaftaran adalah ${MAX_CHILDREN} anak/pemain.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedAthletes = athletes.map((a) => ({
        fullName: a.fullName.trim(),
        nickname: a.nickname.trim(),
        birthDate: a.birthDate,
        birthPlace: a.birthPlace.trim(),
        gender: a.gender,
        photoUrl: a.photoUrl.trim() || undefined,
        address: a.address.trim() || undefined,
        school: a.school.trim() || undefined,
        schoolGrade: a.schoolGrade.trim() || undefined,
        primaryPosition: a.primaryPosition,
        secondaryPosition: a.secondaryPosition || undefined,
        dominantFoot: a.dominantFoot,
        playingExperience: a.playingExperience,
        previousClub: a.previousClub.trim() || undefined,
        additionalNotes: a.additionalNotes.trim() || undefined,
      }));

      const result = await registerParentWithAthlete(
        {
          parent: {
            name: parentName.trim(),
            email: parentEmail.trim().toLowerCase(),
            password,
            phone: parentPhone.trim(),
            relationship,
            avatarUrl: undefined,
          },
          athletes: formattedAthletes,
        },
        { autoLogin: false }
      );

      const createdPlayers = result.players || (result.player ? [result.player] : []);
      const createdRegistrations = result.registrations || (result.registration ? [result.registration] : []);

      setSuccessData({
        players: createdPlayers,
        registrations: createdRegistrations,
        user: result.user,
        token: result.token,
      });

      // Synchronously inject all registered players into DataContext
      injectRegisteredPlayerAndUser(createdPlayers, result.user);
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Terjadi kesalahan saat menyimpan data registrasi. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Breadcrumb */}
      <div className="max-w-3xl mx-auto w-full mb-6 relative z-10 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
        >
          ← Kembali ke Halaman Awal
        </button>

        <button
          onClick={onGoToLogin}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Sudah punya akun? <span className="text-emerald-400 font-bold underline">Login</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Title & Progress Indicator */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Castindo Football Academy"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Pendaftaran Terpadu Akun Wali & Atlet
                  </h1>
                </div>
                <p className="text-xs text-slate-400">
                  Castindo Football Academy · 1 Akun Orang Tua Dapat Mendaftarkan Hingga Maksimal 4 Anak
                </p>
              </div>
            </div>

            {/* Step Progress Bar */}
            {currentStep < 4 && (
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={currentStep === 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    1. Akun Wali
                  </span>
                  <span className={currentStep === 2 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    2. Identitas Atlet ({athletes.length}/4 Anak)
                  </span>
                  <span className={currentStep === 3 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    3. Profil Sepak Bola
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-300"
                    style={{
                      width:
                        currentStep === 1 ? '33.3%' : currentStep === 2 ? '66.6%' : '100%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="m-6 mb-0 p-4 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Periksa Kembali Data Anda</p>
                <p className="text-red-300 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            {/* STEP 1: AKUN WALI */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-base font-bold text-white">Bagian 1 — Informasi Akun Orang Tua / Wali</h2>
                  <p className="text-xs text-slate-400">
                    Akun ini digunakan untuk memantau rekam jejak hasil tes fisik dan evaluasi pelatih (dapat mendaftarkan hingga maksimal 4 anak).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap Orang Tua / Wali <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.T."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Aktif <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="wali@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nomor HP / WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hubungan dengan Atlet <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Ayah', 'Ibu', 'Wali'].map((rel) => (
                      <button
                        type="button"
                        key={rel}
                        onClick={() => setRelationship(rel)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          relationship === rel
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kata Sandi <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Konfirmasi Kata Sandi <span className="text-red-400">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed">
                      Saya menyetujui{' '}
                      <button
                        type="button"
                        onClick={onOpenPrivacyTerms}
                        className="text-emerald-400 font-semibold underline underline-offset-2 hover:text-emerald-300"
                      >
                        Kebijakan Privasi dan Ketentuan Penggunaan
                      </button>{' '}
                      Castindo Football Academy mengenai perlindungan data pribadi atlet usia dini.
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-md transition-all"
                  >
                    Lanjut: Identitas Atlet
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: IDENTITAS ATLET (MULTI-CHILD UP TO 4) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-base font-bold text-white">Bagian 2 — Identitas Atlet</h2>
                    <p className="text-xs text-slate-400">
                      Anda dapat mendaftarkan 1 hingga 4 anak sekaligus dalam 1 akun orang tua.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] font-bold text-emerald-300 self-start sm:self-auto">
                    <Users className="w-3.5 h-3.5" />
                    {athletes.length} dari Maks 4 Anak
                  </span>
                </div>

                {/* Child Tabs Navigation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {athletes.map((ath, idx) => {
                      const isActive = idx === activeChildIndex;
                      const displayName = ath.nickname.trim() || `Anak ${idx + 1}`;
                      return (
                        <div key={idx} className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveChildIndex(idx)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>{idx + 1}. {displayName}</span>
                          </button>
                          {athletes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChild(idx)}
                              className="ml-1 p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              title={`Hapus Anak ${idx + 1}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {athletes.length < MAX_CHILDREN && (
                    <button
                      type="button"
                      onClick={addChild}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Tambah Anak ({athletes.length + 1})</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Formulir: Anak ke-{activeChildIndex + 1}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Nama panggilan: <strong className="text-white">{currentAthlete.nickname || '—'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap Atlet <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={currentAthlete.fullName}
                        onChange={(e) => updateCurrentAthlete('fullName', e.target.value)}
                        placeholder="Contoh: Muhammad Kevin Pratama"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Panggilan <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={currentAthlete.nickname}
                        onChange={(e) => updateCurrentAthlete('nickname', e.target.value)}
                        placeholder="Contoh: Kevin"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Tanggal Lahir <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={currentAthlete.birthDate}
                        onChange={(e) => updateCurrentAthlete('birthDate', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={currentAthlete.birthPlace}
                        onChange={(e) => updateCurrentAthlete('birthPlace', e.target.value)}
                        placeholder="Contoh: Jakarta"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
                      <select
                        value={currentAthlete.gender}
                        onChange={(e) => updateCurrentAthlete('gender', e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Calculated Age Group Display */}
                  {currentAgeCalc && (
                    <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Perhitungan Kelompok Umur Otomatis
                        </span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          Kategori: <span className="text-emerald-300">{currentAgeCalc.ageGroupCode}</span> ({currentAgeCalc.ageGroupLabel})
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Fase: {currentAgeCalc.developmentStage} · Format: {currentAgeCalc.recommendedFormat}
                        </p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span className="text-xs text-slate-400">Tim Terpetakan:</span>
                        <p className="text-xs font-bold text-white">
                          {currentAgeCalc.recommendedTeamName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Sekolah (Opsional)
                      </label>
                      <input
                        type="text"
                        value={currentAthlete.school}
                        onChange={(e) => updateCurrentAthlete('school', e.target.value)}
                        placeholder="Contoh: SD Negeri 01 Pagi"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kelas Sekolah (Opsional)
                      </label>
                      <input
                        type="text"
                        value={currentAthlete.schoolGrade}
                        onChange={(e) => updateCurrentAthlete('schoolGrade', e.target.value)}
                        placeholder="Contoh: Kelas 3 SD"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Alamat Domisili (Opsional)
                    </label>
                    <input
                      type="text"
                      value={currentAthlete.address}
                      onChange={(e) => updateCurrentAthlete('address', e.target.value)}
                      placeholder="Contoh: Jl. Merpati No. 12, Jakarta Timur"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-md transition-all"
                  >
                    Lanjut: Informasi Sepak Bola
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: INFORMASI SEPAK BOLA (MULTI-CHILD UP TO 4) */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-base font-bold text-white">Bagian 3 — Profil Sepak Bola Atlet</h2>
                    <p className="text-xs text-slate-400">
                      Tentukan posisi dan pengalaman bermain sepak bola untuk masing-masing anak.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] font-bold text-emerald-300 self-start sm:self-auto">
                    <Users className="w-3.5 h-3.5" />
                    {athletes.length} Atlet Terdaftar
                  </span>
                </div>

                {/* Child Tabs Navigation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {athletes.map((ath, idx) => {
                      const isActive = idx === activeChildIndex;
                      const displayName = ath.nickname.trim() || `Anak ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveChildIndex(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{idx + 1}. {displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Mengedit: <strong className="text-emerald-400">{currentAthlete.fullName || `Anak ${activeChildIndex + 1}`}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Posisi Bermain Utama <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={currentAthlete.primaryPosition}
                        onChange={(e) => updateCurrentAthlete('primaryPosition', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Posisi Alternatif (Opsional)
                      </label>
                      <select
                        value={currentAthlete.secondaryPosition}
                        onChange={(e) => updateCurrentAthlete('secondaryPosition', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Tidak ada / Belum ditentukan --</option>
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kaki Dominan <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Kanan', 'Kiri', 'Keduanya'] as DominantFoot[]).map((foot) => (
                          <button
                            type="button"
                            key={foot}
                            onClick={() => updateCurrentAthlete('dominantFoot', foot)}
                            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                              currentAthlete.dominantFoot === foot
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {foot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Pengalaman Bermain Sepak Bola
                      </label>
                      <select
                        value={currentAthlete.playingExperience}
                        onChange={(e) => updateCurrentAthlete('playingExperience', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {EXPERIENCE_OPTIONS.map((exp) => (
                          <option key={exp} value={exp}>
                            {exp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Klub / SSB / Akademi Sebelumnya (Opsional)
                    </label>
                    <input
                      type="text"
                      value={currentAthlete.previousClub}
                      onChange={(e) => updateCurrentAthlete('previousClub', e.target.value)}
                      placeholder="Contoh: SSB Tunas Bangsa (atau kosongkan jika pemula)"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Catatan Khusus / Riwayat Kesehatan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={currentAthlete.additionalNotes}
                      onChange={(e) => updateCurrentAthlete('additionalNotes', e.target.value)}
                      placeholder="Contoh: Memiliki riwayat alergi dingin atau preferensi latihan khusus"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Submission Confirmation notice */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <p>
                    Saat tombol <strong className="text-white">"Kirim Pendaftaran ({athletes.length} Atlet)"</strong> ditekan, akun wali dan seluruh data {athletes.length} atlet akan langsung dibuat serta terhubung secara otomatis di database resmi CFA.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitAll}
                    disabled={isSubmitting}
                    className={`px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Mendaftarkan {athletes.length} Atlet...
                      </>
                    ) : (
                      <>
                        Kirim Pendaftaran ({athletes.length} Atlet)
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: KONFIRMASI PENDAFTARAN SUKSES - SATU ALUR LANGSUNG AKTIF */}
            {currentStep === 4 && successData && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Pendaftaran Berhasil · {successData.players.length} Anak Terdaftar
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {successData.players.length === 1 ? 'Pemain Berhasil Terdaftar di CFA!' : `${successData.players.length} Pemain Berhasil Terdaftar di CFA!`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
                    Data seluruh pemain telah <span className="text-emerald-400 font-semibold">langsung masuk ke database resmi pemain akademi</span> dan terhubung ke akun wali Anda. Akun Anda dapat memantau hingga 4 anak sekaligus.
                  </p>
                </div>

                {/* List of Registered Players */}
                <div className="space-y-3 max-w-2xl mx-auto text-left">
                  {successData.players.map((player, idx) => {
                    const reg = successData.registrations[idx] || successData.registrations[0];
                    const isItemCopied = copiedId === player.id;
                    return (
                      <div
                        key={player.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 shadow-xl"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Anak ke-{idx + 1} · ID Atlet Resmi
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                                {player.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(player.id)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                title="Salin ID Atlet"
                              >
                                {isItemCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              No. Registrasi
                            </span>
                            <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
                              {reg?.registrationNumber || `REG-${player.id}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Nama Lengkap & Panggilan:</span>
                            <span className="font-bold text-white block mt-0.5">
                              {player.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">Panggilan: {player.nickname}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Kelompok Umur & Tim:</span>
                            <span className="font-bold text-emerald-300 block mt-0.5">
                              {calculateAgeGroup(player.birthDate)?.recommendedTeamName || (player.teamId === 'team-b' ? 'Tim B (U-8/U-9)' : 'Tim A (U-9/U-10)')}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Lahir: {player.birthDate}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Posisi & Kaki Dominan:</span>
                            <span className="font-medium text-slate-200 block mt-0.5">
                              {player.primaryPosition}
                            </span>
                            <span className="text-[11px] text-slate-400">Kaki: {player.dominantFoot}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quota Info Box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-w-xl mx-auto text-xs text-slate-400">
                  <p>
                    <strong className="text-white">Status Kuota Anak:</strong> Anda telah mendaftarkan{' '}
                    <span className="text-emerald-400 font-bold">{successData.players.length}</span> dari batas maksimal{' '}
                    <span className="text-white font-bold">{MAX_CHILDREN} anak</span> per akun wali.
                    {successData.players.length < MAX_CHILDREN && (
                      <span> Anda masih dapat mendaftarkan {MAX_CHILDREN - successData.players.length} anak lagi kapan saja melalui tombol "Tambah Atlet" di Portal Wali.</span>
                    )}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (successData.user && successData.token) {
                        activateUserSession(successData.user, successData.token);
                      }
                      onRegistrationComplete('parent');
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    Buka Portal & Dashboard Pemantauan Fisik
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
