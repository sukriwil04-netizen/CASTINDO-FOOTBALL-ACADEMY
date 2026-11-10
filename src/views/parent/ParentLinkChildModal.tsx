import React, { useState } from 'react';
import {
  X,
  KeyRound,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Shield,
  Search,
  Clock,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';

interface ParentLinkChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked?: () => void;
}

export const ParentLinkChildModal: React.FC<ParentLinkChildModalProps> = ({
  isOpen,
  onClose,
  onLinked,
}) => {
  const { currentUser } = useAuth();
  const {
    activePlayers,
    parentInviteCodes,
    parentLinkRequests,
    submitParentLinkRequest,
    teams,
  } = useData();

  const [linkMode, setLinkMode] = useState<'invite_code' | 'request'>('invite_code');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [relationship, setRelationship] = useState('Ayah');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLinkByInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!inviteCode.trim()) {
      setErrorMsg('Harap masukkan kode undangan dari akademi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = inviteCode.trim().toUpperCase();
    const matchedInvite = parentInviteCodes.find(
      (inv) => inv.code.trim().toUpperCase() === cleanCode && !inv.isUsed
    );

    if (!matchedInvite) {
      setErrorMsg(
        'Kode undangan tidak valid, kadaluarsa, atau sudah pernah digunakan. Silakan hubungi admin/pelatih akademi.'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await submitParentLinkRequest({
        parentId: currentUser.id,
        parentName: currentUser.name,
        parentEmail: currentUser.email,
        parentPhone: currentUser.phone,
        relationship,
        playerId: matchedInvite.playerId,
        inviteCodeUsed: cleanCode,
        notes: `Tautan mandiri menggunakan kode undangan resmi ${cleanCode}`,
      });

      setSuccessMsg(
        `Sukses! Profil ananda ${matchedInvite.playerName} (${matchedInvite.playerId}) berhasil dihubungkan ke akun Anda.`
      );
      setInviteCode('');
      if (onLinked) onLinked();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses tautan akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!selectedPlayerId) {
      setErrorMsg('Pilih profil pemain yang merupakan anak/tanggungan Anda.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const player = activePlayers.find((p) => p.id === selectedPlayerId);
    if (!player) {
      setErrorMsg('Pemain tidak ditemukan.');
      setIsSubmitting(false);
      return;
    }

    try {
      await submitParentLinkRequest({
        parentId: currentUser.id,
        parentName: currentUser.name,
        parentEmail: currentUser.email,
        parentPhone: currentUser.phone,
        relationship,
        playerId: player.id,
        notes: notes.trim(),
      });

      setSuccessMsg(
        `Permintaan menghubungkan profil ${player.fullName} berhasil dikirim ke admin akademi untuk diverifikasi.`
      );
      setSelectedPlayerId('');
      setNotes('');
      if (onLinked) onLinked();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirimkan permohonan tautan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const myRequests = parentLinkRequests.filter(
    (r) => r.parentId === currentUser?.id
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hubungkan Profil Anak</h2>
              <p className="text-xs text-emerald-300">Akses Pemantauan Performa Pemain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-2 bg-gray-100 gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setLinkMode('invite_code'); setErrorMsg(null); }}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              linkMode === 'invite_code'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Pakai Kode Undangan</span>
          </button>
          <button
            type="button"
            onClick={() => { setLinkMode('request'); setErrorMsg(null); }}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              linkMode === 'request'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ajukan Verifikasi Manual</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {linkMode === 'invite_code' ? (
            <form onSubmit={handleLinkByInviteCode} className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                <span className="font-bold block mb-1">Mempunyai Kode Undangan Akademi?</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Masukkan kode undangan yang diberikan oleh staf admin atau pelatih untuk menghubungkan profil ananda secara instan (contoh: <code>INV-CFA2026001-A1B2</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kode Undangan Akademi
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Masukkan kode undangan (contoh: INV-...)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hubungan Keluarga</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="Ayah">Ayah Kandung</option>
                  <option value="Ibu">Ibu Kandung</option>
                  <option value="Wali">Wali Murid</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi...' : 'Hubungkan Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequestLink} className="space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950">
                <span className="font-bold block mb-1">Pengajuan Tautan Profil Pemain:</span>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Pilih ananda dari daftar pemain aktif akademi. Demi perlindungan data anak, staf admin akan melakukan verifikasi data sebelum profil dibuka untuk akun Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Pemain</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Pilih Nama Pemain --</option>
                  {activePlayers.map((p) => {
                    const tm = teams.find((t) => t.id === p.teamId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.id}) - {tm?.name || p.teamId}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hubungan Keluarga</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="Ayah">Ayah Kandung</option>
                  <option value="Ibu">Ibu Kandung</option>
                  <option value="Wali">Wali Murid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan untuk Admin</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Mengajukan akses untuk memantau perkembangan Kevin..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Previous Link Requests */}
          {myRequests.length > 0 && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status Pengajuan Tautan Sebelumnya:
              </h5>
              <div className="space-y-1.5">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{req.playerName} ({req.playerId})</p>
                      <p className="text-[11px] text-gray-500">Hubungan: {req.relationship}</p>
                    </div>
                    <div>
                      {req.status === 'pending' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          Menunggu Verifikasi Admin
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Terhubung
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          Ditolak: {req.rejectionReason || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
