import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Shield,
  Save,
  Upload,
  Camera,
  CheckCircle,
  Loader2,
  Trash2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { DominantFoot, Player } from '../../types/database.ts';
import { useData } from '../../context/DataContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTO_SIZE_LABEL,
  formatFileSize,
  processAndCompressImage,
} from '../../utils/imageUtils.ts';

interface PlayerFormModalProps {
  playerToEdit?: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (player: Player) => void;
}

const POSITIONS = [
  'Kiper',
  'Bek Tengah',
  'Bek Sayap Kanan',
  'Bek Sayap Kiri',
  'Gelandang',
  'Penyerang Sayap',
  'Penyerang Tengah',
];

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  playerToEdit,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { teams, createPlayer, updatePlayer } = useData();
  const { canViewGuardianContact } = useAuth();

  const isEditing = Boolean(playerToEdit);

  const [fullName, setFullName] = useState(playerToEdit?.fullName || '');
  const [nickname, setNickname] = useState(playerToEdit?.nickname || '');
  const [birthDate, setBirthDate] = useState(playerToEdit?.birthDate || '2016-05-12');
  const [joinDate, setJoinDate] = useState(
    playerToEdit?.joinDate || new Date().toISOString().split('T')[0]
  );
  const [teamId, setTeamId] = useState(playerToEdit?.teamId || 'team-b');
  const [primaryPosition, setPrimaryPosition] = useState(
    playerToEdit?.primaryPosition || 'Gelandang'
  );
  const [jerseyNumber, setJerseyNumber] = useState<string>(
    playerToEdit?.jerseyNumber !== undefined ? String(playerToEdit.jerseyNumber) : ''
  );
  const [secondaryPosition, setSecondaryPosition] = useState(
    playerToEdit?.secondaryPosition || ''
  );
  const [dominantFoot, setDominantFoot] = useState<DominantFoot>(
    playerToEdit?.dominantFoot || 'Kanan'
  );
  const [guardianName, setGuardianName] = useState(playerToEdit?.guardianName || '');
  const [guardianContact, setGuardianContact] = useState(
    playerToEdit?.guardianContact || ''
  );
  const [guardianRelation, setGuardianRelation] = useState(
    playerToEdit?.guardianRelation || 'Ayah'
  );
  const [photoUrl, setPhotoUrl] = useState(playerToEdit?.photoUrl || '');
  const [address, setAddress] = useState(playerToEdit?.address || '');
  const [school, setSchool] = useState(playerToEdit?.school || '');
  const [schoolGrade, setSchoolGrade] = useState(playerToEdit?.schoolGrade || '');
  const [birthPlace, setBirthPlace] = useState(playerToEdit?.birthPlace || '');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>(playerToEdit?.gender || 'Laki-laki');
  const [playingExperience, setPlayingExperience] = useState(playerToEdit?.playingExperience || '');
  const [previousClub, setPreviousClub] = useState(playerToEdit?.previousClub || '');
  const [coachNotesForParent, setCoachNotesForParent] = useState(playerToEdit?.coachNotesForParent || '');
  const [parentRecommendations, setParentRecommendations] = useState(playerToEdit?.parentRecommendations || '');

  const [coachNotes, setCoachNotes] = useState(playerToEdit?.coachNotes || '');
  const [individualTarget, setIndividualTarget] = useState(
    playerToEdit?.individualTarget || ''
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadSuccessInfo(null);
    setIsCompressingPhoto(true);

    try {
      const result = await processAndCompressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.85,
        maxSizeBytes: MAX_PHOTO_SIZE_BYTES, // 10MB
      });
      setPhotoUrl(result.dataUrl);
      setUploadSuccessInfo(
        `Foto berhasil dimuat & dioptimalkan (${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)})`
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memproses file foto.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  // Synchronize state when opening modal or changing playerToEdit
  React.useEffect(() => {
    if (isOpen) {
      if (playerToEdit) {
        setFullName(playerToEdit.fullName || '');
        setNickname(playerToEdit.nickname || '');
        setBirthDate(playerToEdit.birthDate || '');
        setJoinDate(playerToEdit.joinDate || new Date().toISOString().split('T')[0]);
        setTeamId(playerToEdit.teamId || 'team-b');
        setPrimaryPosition(playerToEdit.primaryPosition || 'Gelandang');
        setJerseyNumber(playerToEdit.jerseyNumber !== undefined ? String(playerToEdit.jerseyNumber) : '');
        setSecondaryPosition(playerToEdit.secondaryPosition || '');
        setDominantFoot(playerToEdit.dominantFoot || 'Kanan');
        setGuardianName(playerToEdit.guardianName || '');
        setGuardianContact(playerToEdit.guardianContact || '');
        setGuardianRelation(playerToEdit.guardianRelation || 'Ayah');
        setCoachNotes(playerToEdit.coachNotes || '');
        setIndividualTarget(playerToEdit.individualTarget || '');
        setPhotoUrl(playerToEdit.photoUrl || '');
        setAddress(playerToEdit.address || '');
        setSchool(playerToEdit.school || '');
        setSchoolGrade(playerToEdit.schoolGrade || '');
        setBirthPlace(playerToEdit.birthPlace || '');
        setGender(playerToEdit.gender || 'Laki-laki');
        setPlayingExperience(playerToEdit.playingExperience || '');
        setPreviousClub(playerToEdit.previousClub || '');
        setCoachNotesForParent(playerToEdit.coachNotesForParent || '');
        setParentRecommendations(playerToEdit.parentRecommendations || '');
      } else {
        setFullName('');
        setNickname('');
        setBirthDate('2016-05-12');
        setJoinDate(new Date().toISOString().split('T')[0]);
        setTeamId('team-b');
        setPrimaryPosition('Gelandang');
        setJerseyNumber('');
        setSecondaryPosition('');
        setDominantFoot('Kanan');
        setGuardianName('');
        setGuardianContact('');
        setGuardianRelation('Ayah');
        setCoachNotes('');
        setIndividualTarget('');
        setPhotoUrl('');
        setAddress('');
        setSchool('');
        setSchoolGrade('');
        setBirthPlace('');
        setGender('Laki-laki');
        setPlayingExperience('');
        setPreviousClub('');
        setCoachNotesForParent('');
        setParentRecommendations('');
      }
      setError(null);
      setUploadSuccessInfo(null);
      setShowUrlInput(false);
      setCustomUrl('');
    }
  }, [isOpen, playerToEdit]);

  if (!isOpen) return null;

  // Auto calculate birth year display
  const birthYear = birthDate ? new Date(birthDate).getFullYear() : '-';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Nama lengkap pemain wajib diisi.');
      return;
    }
    if (!birthDate) {
      setError('Tanggal lahir wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<Player> = {
        fullName: fullName.trim(),
        nickname: nickname.trim() || fullName.trim().split(' ')[0],
        birthDate,
        joinDate,
        teamId,
        jerseyNumber: jerseyNumber.trim() ? parseInt(jerseyNumber.trim(), 10) : undefined,
        primaryPosition,
        secondaryPosition: secondaryPosition || undefined,
        dominantFoot,
        guardianName: guardianName.trim() || 'Orang Tua / Wali',
        guardianContact: guardianContact.trim() || '-',
        guardianRelation,
        photoUrl: photoUrl.trim() ? photoUrl.trim() : '',
        address: address.trim() || undefined,
        school: school.trim() || undefined,
        schoolGrade: schoolGrade.trim() || undefined,
        birthPlace: birthPlace.trim() || undefined,
        gender,
        playingExperience: playingExperience.trim() || undefined,
        previousClub: previousClub.trim() || undefined,
        coachNotes: coachNotes.trim(),
        coachNotesForParent: coachNotesForParent.trim() || undefined,
        parentRecommendations: parentRecommendations.trim() || undefined,
        individualTarget: individualTarget.trim(),
        status: playerToEdit?.status || 'active',
      };

      let result: Player;
      if (isEditing && playerToEdit) {
        result = await updatePlayer(playerToEdit.id, payload);
      } else {
        result = await createPlayer(payload);
      }

      if (onSaved) onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data pemain');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? `Edit Pemain: ${playerToEdit?.fullName}` : 'Tambah Pemain Baru'}
              </h2>
              <p className="text-xs text-emerald-200">
                {isEditing
                  ? `Player ID: ${playerToEdit?.id} (Permanen)`
                  : 'Player ID unik (CFA-YYYY-XXX) akan dibuat otomatis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Section 1: Profil Dasar & Foto */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-100 pb-1">
              1. Identitas Pemain Usia Dini & Foto Profil
            </h3>

            {/* Photo Picker */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative group shrink-0 mx-auto sm:mx-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Foto Profil"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-2xs">
                      <User className="w-7 h-7 text-gray-400 mb-0.5" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">Kosong</span>
                    </div>
                  )}
                  {isCompressingPhoto && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold">
                      <Loader2 className="w-5 h-5 animate-spin mb-1 text-emerald-400" />
                      <span>Optimasi...</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      Foto Profil Pemain
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Maks. {MAX_PHOTO_SIZE_LABEL} (Auto-Compress)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2.5">
                    Unggah foto dari galeri HP / laptop (hingga {MAX_PHOTO_SIZE_LABEL}) atau ambil via kamera. Jika belum ada foto, profil pemain akan dikosongkan.
                  </p>

                  {/* Hidden Inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Foto ({MAX_PHOTO_SIZE_LABEL})</span>
                    </button>

                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-gray-600" />
                      <span>Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span>URL</span>
                    </button>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setUploadSuccessInfo('Foto profil dikosongkan.');
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {uploadSuccessInfo && (
                    <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{uploadSuccessInfo}</span>
                    </div>
                  )}

                  {/* Direct URL input */}
                  {showUrlInput && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200 flex gap-2 animate-in fade-in">
                      <input
                        type="url"
                        placeholder="Tempel link URL foto (https://...)"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUrl.trim()) {
                            setPhotoUrl(customUrl.trim());
                            setUploadSuccessInfo('URL foto berhasil diterapkan.');
                            setShowUrlInput(false);
                            setCustomUrl('');
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Terapkan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Alif Ramadhan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Alif"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tahun Lahir (Auto)
                </label>
                <input
                  type="text"
                  readOnly
                  value={birthYear}
                  className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Bergabung
                </label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kelompok Tim & Posisi 7v7 */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-100 pb-1">
              2. Kelompok Tim & Karakteristik Sepak Bola
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kelompok Tim
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.ageGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kaki Dominan
                </label>
                <select
                  value={dominantFoot}
                  onChange={(e) => setDominantFoot(e.target.value as DominantFoot)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                >
                  <option value="Kanan">Kanan</option>
                  <option value="Kiri">Kiri</option>
                  <option value="Keduanya">Keduanya (Ambidextrous)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor Punggung (Jersey)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="Contoh: 10"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Posisi Utama (7v7)
                </label>
                <select
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Posisi Alternatif (Opsional)
                </label>
                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Tidak ada --</option>
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Wali & Kontak (Protected Access) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                3. Data Orang Tua / Wali
              </h3>
              {!canViewGuardianContact && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Akses Terbatas Sesuai Hak Akses
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Wali
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bapak Bambang"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Hubungan
                </label>
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder={canViewGuardianContact ? '0812-xxxx-xxxx' : 'Dirahasiakan'}
                  disabled={!canViewGuardianContact}
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Target Perkembangan & Catatan Pelatih */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-100 pb-1">
              4. Target & Catatan Observasi Pelatih
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Perkembangan Individual Awal
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Belajar scanning sebelum menerima bola dan passing mendatar kaki kiri..."
                value={individualTarget}
                onChange={(e) => setIndividualTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Catatan Karakter / Respon Anak
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Semangat tinggi, cepat berteman, perlu apresiasi positif saat mencoba teknik baru..."
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Pemain'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
