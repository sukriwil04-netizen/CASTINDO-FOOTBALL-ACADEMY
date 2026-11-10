import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { calculateAgeGroup } from '../../utils/ageGroup.ts';
import { DominantFoot } from '../../types/database.ts';

interface ParentAddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (playerId: string) => void;
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

export const ParentAddAthleteModal: React.FC<ParentAddAthleteModalProps> = ({
  isOpen,
  onClose,
  onAdded,
}) => {
  const { addAthleteForParent, currentUser } = useAuth();
  const { injectRegisteredPlayerAndUser, refreshData } = useData();
  const currentCount = currentUser?.linkedPlayerIds?.length || 0;
  const MAX_CHILDREN = 4;
  const isLimitReached = currentCount >= MAX_CHILDREN;

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('2017-06-20');
  const [birthPlace, setBirthPlace] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [school, setSchool] = useState('');
  const [schoolGrade, setSchoolGrade] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState(POSITIONS[0]);
  const [dominantFoot, setDominantFoot] = useState<DominantFoot>('Kanan');
  const [playingExperience, setPlayingExperience] = useState('6 bulan – 1 tahun');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const ageCalc = calculateAgeGroup(birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isLimitReached) {
      setErrorMessage(`Batas maksimal tercapai: 1 akun orang tua/wali hanya dapat mendaftarkan maksimal ${MAX_CHILDREN} anak/pemain.`);
      return;
    }

    if (!fullName.trim() || !nickname.trim() || !birthDate || !primaryPosition) {
      setErrorMessage('Harap isi semua kolom wajib (nama lengkap, panggilan, tanggal lahir, dan posisi).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addAthleteForParent({
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        birthDate,
        birthPlace: birthPlace.trim(),
        gender,
        school: school.trim(),
        schoolGrade: schoolGrade.trim(),
        primaryPosition,
        dominantFoot,
        playingExperience,
      });

      // Synchronously inject new player into DataContext
      if (res.player) {
        injectRegisteredPlayerAndUser(res.player, res.user);
      }
      refreshData().catch(() => {});

      onAdded(res.player.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menambahkan atlet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl text-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Tambah Atlet Baru ke Akun Wali</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isLimitReached
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}>
                  {currentCount}/{MAX_CHILDREN} Anak
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1 akun orang tua dapat mendaftarkan hingga maksimal 4 anak/pemain.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLimitReached && (
          <div className="m-5 mb-0 p-3.5 bg-amber-950/60 border border-amber-700/80 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Batas Kuota Maksimal Tercapai ({MAX_CHILDREN}/{MAX_CHILDREN} Anak)</p>
              <p className="text-amber-300/90 mt-0.5 leading-relaxed">
                Akun wali Anda telah mencapai batas maksimal 4 anak/pemain terdaftar. Anda tidak dapat menambahkan anak lagi ke akun ini. Jika memerlukan bantuan atau pemindahan data atlet, hubungi admin akademi.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="m-5 mb-0 p-3.5 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Lengkap Atlet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Dimas Pratama"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nama Panggilan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Dimas"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Tanggal Lahir <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Jakarta"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          {ageCalc && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Kelompok Umur Dihitung Otomatis:</span>
                <p className="font-bold text-white mt-0.5">{ageCalc.ageGroupCode} ({ageCalc.ageGroupLabel})</p>
              </div>
              <span className="text-emerald-300 font-bold">{ageCalc.recommendedTeamName}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Posisi Utama Sepak Bola <span className="text-red-400">*</span>
              </label>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Kaki Dominan</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Kanan', 'Kiri', 'Keduanya'] as DominantFoot[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setDominantFoot(f)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      dominantFoot === f
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLimitReached}
              className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md ${
                isLimitReached
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isLimitReached
                ? 'Batas Kuota 4 Anak Tercapai'
                : isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Atlet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
