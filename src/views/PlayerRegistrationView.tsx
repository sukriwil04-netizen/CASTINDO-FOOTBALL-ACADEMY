import React, { useState, useEffect } from 'react';
import {
  User,
  Activity,
  Award,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Save,
  Search,
  Sparkles,
  ChevronRight,
  Upload,
  Info,
  Calendar,
  MapPin,
  School,
  FileCheck,
  Camera,
  Loader2,
} from 'lucide-react';
import { useData } from '../context/DataContext.tsx';
import { DominantFoot, PlayerRegistration } from '../types/database.ts';
import {
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_LABEL,
  formatFileSize,
  processAndCompressImage,
} from '../utils/imageUtils.ts';
import { safeStorage } from '../utils/safeStorage.ts';

const DRAFT_STORAGE_KEY = 'cfa_self_reg_draft_v1';

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

export const PlayerRegistrationView: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const { createRegistration, updateRegistration, checkDuplicatePlayer, registrations } = useData();

  // Mode: 'register' | 'status_check' | 'success'
  const [viewMode, setViewMode] = useState<'register' | 'status_check' | 'success'>('register');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Success result state
  const [submittedResult, setSubmittedResult] = useState<PlayerRegistration | null>(null);

  // Check status search state
  const [searchRegNumber, setSearchRegNumber] = useState('');
  const [foundRegistration, setFoundRegistration] = useState<PlayerRegistration | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '', // for revision re-submit
    fullName: '',
    nickname: '',
    birthPlace: '',
    birthDate: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    photoUrl: '',
    address: '',
    school: '',
    schoolGrade: '',
    primaryPosition: '',
    secondaryPosition: '',
    dominantFoot: 'Kanan' as DominantFoot,
    playingExperience: '',
    previousClub: '',
    additionalNotes: '',
  });

  // Duplicate warning notification
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = safeStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save draft whenever formData changes (except during revision edit)
  const saveDraft = (data = formData) => {
    try {
      safeStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  };

  const clearDraft = () => {
    safeStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData({
      id: '',
      fullName: '',
      nickname: '',
      birthPlace: '',
      birthDate: '',
      gender: 'Laki-laki',
      photoUrl: '',
      address: '',
      school: '',
      schoolGrade: '',
      primaryPosition: '',
      secondaryPosition: '',
      dominantFoot: 'Kanan',
      playingExperience: '',
      previousClub: '',
      additionalNotes: '',
    });
    setCurrentStep(1);
  };

  // Calculate age and birth year
  const calculatedBirthYear = formData.birthDate ? new Date(formData.birthDate).getFullYear() : null;
  const calculatedAge = calculatedBirthYear ? new Date().getFullYear() - calculatedBirthYear : null;

  // Real-time check duplicate warning when step 1 completes
  const handleValidateStep1 = async () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Nama lengkap pemain wajib diisi.');
      return false;
    }
    if (!formData.nickname.trim()) {
      setErrorMessage('Nama panggilan pemain wajib diisi.');
      return false;
    }
    if (!formData.birthPlace.trim()) {
      setErrorMessage('Tempat lahir wajib diisi.');
      return false;
    }
    if (!formData.birthDate) {
      setErrorMessage('Tanggal lahir wajib diisi.');
      return false;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Alamat domisili wajib diisi.');
      return false;
    }
    if (!formData.school.trim()) {
      setErrorMessage('Nama sekolah wajib diisi.');
      return false;
    }
    if (!formData.schoolGrade.trim()) {
      setErrorMessage('Kelas saat ini wajib diisi.');
      return false;
    }

    setErrorMessage(null);

    // Check duplicate
    try {
      const dup = await checkDuplicatePlayer(formData.fullName, formData.birthDate);
      if (dup.isDuplicate) {
        setDuplicateWarning(
          `Catatan: Nama dan tanggal lahir ini mirip dengan pemain yang sudah terdaftar. Jika ini adalah pendaftaran ulang, data Anda akan diverifikasi khusus oleh staf pelatih.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      // ignore
    }

    saveDraft(formData);
    return true;
  };

  const handleValidateStep2 = () => {
    if (!formData.primaryPosition) {
      setErrorMessage('Posisi utama bermain wajib dipilih.');
      return false;
    }
    if (!formData.playingExperience) {
      setErrorMessage('Lama pengalaman bermain sepak bola wajib dipilih.');
      return false;
    }

    setErrorMessage(null);
    saveDraft(formData);
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const ok = await handleValidateStep1();
      if (ok) setCurrentStep(2);
    } else if (currentStep === 2) {
      const ok = handleValidateStep2();
      if (ok) setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  // Submit Registration
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (formData.id) {
        // Re-submit revision
        const updated = await updateRegistration(formData.id, {
          ...formData,
          status: 'pending', // Re-enter pending verification queue
        });
        safeStorage.removeItem(DRAFT_STORAGE_KEY);
        setSubmittedResult(updated);
        setViewMode('success');
      } else {
        // Create new registration
        const created = await createRegistration(formData);
        safeStorage.removeItem(DRAFT_STORAGE_KEY);
        setSubmittedResult(created);
        setViewMode('success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan formulir pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload / photo preset with auto compression up to 10MB
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      const result = await processAndCompressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        maxSizeBytes: MAX_PHOTO_SIZE_BYTES, // 10MB
      });
      setFormData((prev) => ({ ...prev, photoUrl: result.dataUrl }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file foto.');
    } finally {
      e.target.value = '';
    }
  };

  // Check Status Handler
  const handleSearchStatus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    const query = searchRegNumber.trim().toLowerCase();
    if (!query) {
      setFoundRegistration(null);
      return;
    }

    const found = registrations.find(
      (r) =>
        r.registrationNumber?.toLowerCase() === query ||
        r.fullName?.toLowerCase().includes(query) ||
        r.id?.toLowerCase() === query
    );
    setFoundRegistration(found || null);
  };

  // Load registration for revision
  const handleLoadForRevision = (reg: PlayerRegistration) => {
    setFormData({
      id: reg.id,
      fullName: reg.fullName || '',
      nickname: reg.nickname || '',
      birthPlace: reg.birthPlace || '',
      birthDate: reg.birthDate || '',
      gender: reg.gender || 'Laki-laki',
      photoUrl: reg.photoUrl || '',
      address: reg.address || '',
      school: reg.school || '',
      schoolGrade: reg.schoolGrade || '',
      primaryPosition: reg.primaryPosition || '',
      secondaryPosition: reg.secondaryPosition || '',
      dominantFoot: reg.dominantFoot || 'Kanan',
      playingExperience: reg.playingExperience || '',
      previousClub: reg.previousClub || '',
      additionalNotes: reg.additionalNotes || '',
    });
    setViewMode('register');
    setCurrentStep(1);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-emerald-950 flex items-center justify-center font-black shadow-md">
                <Shield className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                  Castindo Football Academy
                </span>
                <p className="text-[11px] text-emerald-200/80">Self-Service Player Registration</p>
              </div>
            </div>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/15"
              >
                Kembali ke Aplikasi Utama
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1">
            Formulir Isi Data Pemain
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
            Isi data pemain mandiri melalui HP Anda. Data yang dikirim akan diverifikasi oleh staf pelatih Castindo Football Academy sebelum penerbitan Player ID resmi.
          </p>

          {/* Navigation Pill Switcher */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('register');
                setErrorMessage(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'register'
                  ? 'bg-emerald-400 text-emerald-950 shadow-md'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/80 border border-emerald-700/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Isi Formulir Pendaftaran
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('status_check');
                setErrorMessage(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'status_check'
                  ? 'bg-emerald-400 text-emerald-950 shadow-md'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/80 border border-emerald-700/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Cek Status Pengajuan
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE: STATUS CHECK */}
      {viewMode === 'status_check' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              Pemeriksaan Status Pendaftaran
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Masukkan nomor registrasi (contoh: <span className="font-mono font-semibold">REG-2026-001</span>) atau nama lengkap pemain untuk melihat status verifikasi.
            </p>
          </div>

          <form onSubmit={handleSearchStatus} className="flex gap-2">
            <input
              type="text"
              placeholder="Nomor Registrasi atau Nama Lengkap..."
              value={searchRegNumber}
              onChange={(e) => setSearchRegNumber(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              Cari
            </button>
          </form>

          {hasSearched && (
            <div className="pt-2">
              {!foundRegistration ? (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">Data Tidak Ditemukan</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    Pastikan nomor registrasi atau ejaan nama lengkap yang Anda masukkan sudah sesuai.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border bg-gray-50/70 border-gray-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div>
                      <span className="font-mono text-xs text-gray-500 font-semibold">
                        {foundRegistration.registrationNumber}
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {foundRegistration.fullName} ({foundRegistration.nickname})
                      </h3>
                    </div>

                    <div>
                      {foundRegistration.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Disetujui
                        </span>
                      )}
                      {foundRegistration.status === 'needs_revision' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Perlu Perbaikan
                        </span>
                      )}
                      {foundRegistration.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Ditolak
                        </span>
                      )}
                      {foundRegistration.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu Verifikasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status explanation */}
                  {foundRegistration.status === 'approved' && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                      <p className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        Selamat! Pendaftaran Telah Disetujui
                      </p>
                      <p className="text-xs text-emerald-800">
                        Pemain telah resmi terdaftar dalam database utama Castindo Football Academy.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs">
                          <span className="text-gray-500">Player ID Resmi: </span>
                          <strong className="font-mono text-emerald-900 font-bold">{foundRegistration.approvedPlayerId}</strong>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-xs">
                          <span className="text-gray-500">Tim: </span>
                          <strong className="text-emerald-900 font-bold">
                            {foundRegistration.assignedTeamId === 'team-a' ? 'Castindo Tim A' : 'Castindo Tim B'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {foundRegistration.status === 'needs_revision' && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3">
                      <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                        Perlu Perbaikan Data
                      </p>
                      <p className="text-xs text-amber-800">
                        Staf pelatih meminta perbaikan pada data formulir Anda dengan catatan:
                      </p>
                      <blockquote className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-amber-950 font-medium italic">
                        "{foundRegistration.adminNotes || 'Mohon lengkapi bagian data yang belum sesuai.'}"
                      </blockquote>
                      <button
                        type="button"
                        onClick={() => handleLoadForRevision(foundRegistration)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Perbaiki Data & Kirim Ulang Sekarang
                      </button>
                    </div>
                  )}

                  {foundRegistration.status === 'pending' && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                      <p className="font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Sedang Dalam Antrean Verifikasi
                      </p>
                      <p>
                        Formulir Anda telah tersimpan dengan aman pada sistem akademi. Staf pelatih akan meninjau data Anda segera.
                      </p>
                    </div>
                  )}

                  {foundRegistration.status === 'rejected' && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
                      <p className="font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Pengajuan Tidak Disetujui
                      </p>
                      <p>
                        Alasan: {foundRegistration.adminNotes || 'Data pendaftaran belum memenuhi kriteria akademi saat ini.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: SUCCESS CONFIRMATION */}
      {viewMode === 'success' && submittedResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Status: Menunggu Verifikasi
            </span>
            <h2 className="text-2xl font-black text-gray-900">
              Pendaftaran Berhasil Dikirim!
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Terima kasih, data calon pemain <strong className="text-gray-900">{submittedResult.fullName}</strong> telah berhasil disimpan dalam antrean verifikasi akademi.
            </p>
          </div>

          {/* Ticket / Registration Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-300/80 max-w-md mx-auto space-y-3">
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Nomor Registrasi Anda
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-950 tracking-wider">
              {submittedResult.registrationNumber}
            </div>
            <p className="text-[11px] text-emerald-700">
              Simpan nomor registrasi ini untuk mengecek status verifikasi pengajuan sewaktu-waktu.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(submittedResult.registrationNumber);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mx-auto shadow-xs"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Nomor Disalin!' : 'Salin Nomor Registrasi'}
            </button>
          </div>

          {/* Summary Mini Info */}
          <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <span className="text-gray-500">Nama Panggilan:</span>
              <p className="font-semibold text-gray-800">{submittedResult.nickname}</p>
            </div>
            <div>
              <span className="text-gray-500">Posisi Utama:</span>
              <p className="font-semibold text-gray-800">{submittedResult.primaryPosition}</p>
            </div>
            <div>
              <span className="text-gray-500">Kaki Dominan:</span>
              <p className="font-semibold text-gray-800">{submittedResult.dominantFoot}</p>
            </div>
            <div>
              <span className="text-gray-500">Waktu Kirim:</span>
              <p className="font-semibold text-gray-800">
                {new Date(submittedResult.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchRegNumber(submittedResult.registrationNumber);
                setViewMode('status_check');
                setHasSearched(true);
                setFoundRegistration(submittedResult);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Pantau Status Pengajuan
            </button>

            <button
              type="button"
              onClick={() => {
                clearDraft();
                setViewMode('register');
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
            >
              Daftarkan Pemain Lain
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE: REGISTRATION FORM */}
      {viewMode === 'register' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          {/* Multi-step Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span className="text-emerald-850">
                Langkah {currentStep} dari 3: {currentStep === 1 ? 'Identitas Pemain' : currentStep === 2 ? 'Informasi Sepak Bola' : 'Ringkasan & Pengiriman'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 hidden sm:inline">Draft otomatis tersimpan di HP</span>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Reset Form
                </button>
              </div>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-[11px] font-semibold text-gray-400">
              <div className={currentStep >= 1 ? 'text-emerald-800 font-bold' : ''}>1. Identitas</div>
              <div className={currentStep >= 2 ? 'text-emerald-800 font-bold' : ''}>2. Sepak Bola</div>
              <div className={currentStep >= 3 ? 'text-emerald-800 font-bold' : ''}>3. Ringkasan Data</div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Mohon lengkapi data:</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Duplicate Warning notice */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p>{duplicateWarning}</p>
            </div>
          )}

          {formData.id && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>Mode Perbaikan Data (ID: {formData.id})</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, id: '' })}
                className="text-amber-900 font-bold hover:underline"
              >
                Batalkan Mode Revisi
              </button>
            </div>
          )}

          {/* STEP 1: IDENTITAS PEMAIN */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-gray-100 pb-2">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  A. Identitas Calon Pemain
                </h2>
                <p className="text-xs text-gray-500">
                  Data diri lengkap pemain untuk pendaftaran resmi akademi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Nama Lengkap <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Rayhan Pratama"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Nama Panggilan */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Nama Panggilan <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rayhan"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tempat Lahir <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bandung"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tanggal Lahir <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  {calculatedAge !== null && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      Usia saat ini: {calculatedAge} tahun (Tahun kelahiran {calculatedBirthYear})
                    </p>
                  )}
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Jenis Kelamin <span className="text-red-500">* Wajib</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Laki-laki' })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        formData.gender === 'Laki-laki'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Perempuan' })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        formData.gender === 'Perempuan'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      Perempuan
                    </button>
                  </div>
                </div>

                {/* Foto Profil (Opsional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-800">
                      Foto Profil Pemain <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Maks. {MAX_PHOTO_SIZE_LABEL}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 text-center transition flex items-center justify-center gap-1.5 shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pilih Foto ({MAX_PHOTO_SIZE_LABEL})</span>
                        </div>
                      </label>
                      {formData.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                          className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs transition font-medium"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alamat Domisili */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Alamat Domisili <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jl. Sukamaju No. 12, Buahbatu, Bandung"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Sekolah */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Sekolah <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SD Islam Al-Azhar 36"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Kelas <span className="text-red-500">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelas 3 SD"
                    value={formData.schoolGrade}
                    onChange={(e) => setFormData({ ...formData, schoolGrade: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INFORMASI SEPAK BOLA */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-gray-100 pb-2">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  B. Informasi Sepak Bola
                </h2>
                <p className="text-xs text-gray-500">
                  Riwayat teknis dan profil posisi bermain sepak bola pemain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tahun Kelahiran (Auto-computed) */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Tahun Kelahiran
                  </label>
                  <input
                    type="text"
                    disabled
                    value={calculatedBirthYear ? `${calculatedBirthYear} (${calculatedAge} Tahun)` : '-'}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-700 font-semibold cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Dihitung otomatis dari tanggal lahir yang diisi pada Langkah 1.
                  </p>
                </div>

                {/* Posisi Utama */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Posisi Utama Bermain <span className="text-red-500">* Wajib</span>
                  </label>
                  <select
                    value={formData.primaryPosition}
                    onChange={(e) => setFormData({ ...formData, primaryPosition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Posisi Utama --</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Posisi Alternatif */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Posisi Alternatif / Cadangan <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  <select
                    value={formData.secondaryPosition}
                    onChange={(e) => setFormData({ ...formData, secondaryPosition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">-- Tidak Ada / Opsional --</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kaki Dominan */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Kaki Dominan <span className="text-red-500">* Wajib</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Kanan', 'Kiri', 'Keduanya'] as DominantFoot[]).map((foot) => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setFormData({ ...formData, dominantFoot: foot })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                          formData.dominantFoot === foot
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {foot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lama Pengalaman Bermain */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Lama Pengalaman Bermain Sepak Bola <span className="text-red-500">* Wajib</span>
                  </label>
                  <select
                    value={formData.playingExperience}
                    onChange={(e) => setFormData({ ...formData, playingExperience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Lama Pengalaman --</option>
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Klub / SSB Sebelumnya */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Klub / SSB / Akademi Sebelumnya <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SSB Saswco / Baru pertama ikut"
                    value={formData.previousClub}
                    onChange={(e) => setFormData({ ...formData, previousClub: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: KETERANGAN TAMBAHAN & RINGKASAN DATA */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-gray-100 pb-2">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  C. Informasi Tambahan & Ringkasan Data
                </h2>
                <p className="text-xs text-gray-500">
                  Periksa ringkasan seluruh data sebelum mengirimkan pendaftaran.
                </p>
              </div>

              {/* Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Keterangan Tambahan yang Relevan <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan kondisi fisik khusus, alergi, riwayat cedera ringan, atau prestasi sepak bola yang pernah diraih..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Ringkasan Data Card */}
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    Ringkasan Data Pemain
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Siap Dikirim
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Nama Lengkap</span>
                    <strong className="text-gray-900 text-sm">{formData.fullName}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Nama Panggilan</span>
                    <strong className="text-gray-900 text-sm">{formData.nickname}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Tempat, Tgl Lahir</span>
                    <span className="text-gray-800 font-semibold">
                      {formData.birthPlace}, {formData.birthDate} ({calculatedAge} th)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Jenis Kelamin</span>
                    <span className="text-gray-800 font-semibold">{formData.gender}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80 sm:col-span-2">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Alamat Domisili</span>
                    <span className="text-gray-800 font-semibold">{formData.address}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Sekolah & Kelas</span>
                    <span className="text-gray-800 font-semibold">{formData.school} ({formData.schoolGrade})</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Posisi Utama</span>
                    <strong className="text-emerald-800">{formData.primaryPosition}</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Kaki Dominan</span>
                    <span className="text-gray-800 font-semibold">{formData.dominantFoot}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200/80">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Pengalaman Bermain</span>
                    <span className="text-gray-800 font-semibold">{formData.playingExperience}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                  <strong>Pernyataan:</strong> Saya menyatakan bahwa data calon pemain yang diisi di atas adalah benar dan akurat. Saya memahami bahwa data ini akan masuk ke antrean verifikasi staf pelatih sebelum resmi diterbitkan Player ID.
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 ml-auto"
              >
                Lanjutkan
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg transition flex items-center gap-2 ml-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sedang Mengirim Data...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Kirim Formulir Pendaftaran
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
