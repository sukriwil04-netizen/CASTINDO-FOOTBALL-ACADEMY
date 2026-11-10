import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  KeyRound,
  History,
  Shield,
  Search,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  Link,
  Unlink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { ParentInviteCode } from '../../types/database.ts';
import { ConfirmModal } from '../../components/common/ConfirmModal.tsx';

export const ParentManagementView: React.FC = () => {
  const { currentUser, usersList } = useAuth();
  const {
    activePlayers,
    parentInviteCodes,
    parentLinkRequests,
    parentAuditLogs,
    childIdentityChangeRequests,
    createParentInviteCode,
    approveParentLinkRequest,
    rejectParentLinkRequest,
    approveChildIdentityChangeRequest,
    rejectChildIdentityChangeRequest,
    linkParentDirect,
    unlinkParentDirect,
    pendingLinkRequestsCount,
    pendingIdentityRequestsCount,
  } = useData();

  const [activeTab, setActiveTab] = useState<'links' | 'identity' | 'invites' | 'parents' | 'audit'>('links');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite code creation state
  const [selectedPlayerForInvite, setSelectedPlayerForInvite] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('Wali');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<ParentInviteCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Direct link state
  const [directParentId, setDirectParentId] = useState('');
  const [directPlayerId, setDirectPlayerId] = useState('');
  const [isDirectLinking, setIsDirectLinking] = useState(false);

  // Rejection modal/state
  const [rejectingLinkId, setRejectingLinkId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [rejectingIdentityId, setRejectingIdentityId] = useState<string | null>(null);
  const [identityRejectionNotes, setIdentityRejectionNotes] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter parent users
  const parentUsers = usersList.filter((u) => u.role === 'parent');

  // Generate Invite Code
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForInvite) return;
    setIsCreatingInvite(true);
    try {
      const inv = await createParentInviteCode(
        selectedPlayerForInvite,
        currentUser?.name || 'Admin',
        inviteRelationship
      );
      setCreatedInvite(inv);
      setSelectedPlayerForInvite('');
      showNotice('success', `Kode undangan untuk ${inv.playerName} berhasil dibuat: ${inv.code}`);
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal membuat kode undangan');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Approve Link
  const handleApproveLink = async (requestId: string) => {
    try {
      await approveParentLinkRequest(requestId, currentUser?.name || 'Admin');
      showNotice('success', 'Permintaan tautan orang tua berhasil disetujui.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menyetujui tautan.');
    }
  };

  // Reject Link
  const handleRejectLink = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      showNotice('error', 'Harap isi alasan penolakan.');
      return;
    }
    try {
      await rejectParentLinkRequest(requestId, rejectionReason.trim(), currentUser?.name || 'Admin');
      setRejectingLinkId(null);
      setRejectionReason('');
      showNotice('success', 'Permintaan tautan telah ditolak.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menolak tautan.');
    }
  };

  // Approve Identity Request
  const handleApproveIdentity = async (requestId: string) => {
    try {
      await approveChildIdentityChangeRequest(requestId, currentUser?.name || 'Admin');
      showNotice('success', 'Perubahan identitas anak telah disetujui dan diperbarui di database utama.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menyetujui perubahan.');
    }
  };

  // Reject Identity Request
  const handleRejectIdentity = async (requestId: string) => {
    if (!identityRejectionNotes.trim()) {
      showNotice('error', 'Harap isi catatan penolakan.');
      return;
    }
    try {
      await rejectChildIdentityChangeRequest(requestId, identityRejectionNotes.trim(), currentUser?.name || 'Admin');
      setRejectingIdentityId(null);
      setIdentityRejectionNotes('');
      showNotice('success', 'Pengajuan perubahan identitas telah ditolak.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menolak pengajuan.');
    }
  };

  // Direct Link
  const handleDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directParentId || !directPlayerId) return;
    setIsDirectLinking(true);
    try {
      await linkParentDirect(directParentId, directPlayerId, currentUser?.name || 'Admin');
      showNotice('success', 'Akun orang tua berhasil dihubungkan langsung dengan pemain.');
      setDirectPlayerId('');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal menghubungkan akun.');
    } finally {
      setIsDirectLinking(false);
    }
  };

  // Direct Unlink
  const [unlinkTarget, setUnlinkTarget] = useState<{ parentId: string; playerId: string } | null>(null);

  const handleDirectUnlink = (parentId: string, playerId: string) => {
    setUnlinkTarget({ parentId, playerId });
  };

  const handleConfirmUnlink = async () => {
    if (!unlinkTarget) return;
    try {
      await unlinkParentDirect(unlinkTarget.parentId, unlinkTarget.playerId, currentUser?.name || 'Admin');
      showNotice('success', 'Hubungan akun wali dengan pemain telah diputus.');
    } catch (err: any) {
      showNotice('error', err.message || 'Gagal memutus hubungan.');
    } finally {
      setUnlinkTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-800 text-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Panel Pengelola
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide">
            Portal & Manajemen Orang Tua / Wali Murid
          </h1>
          <p className="text-xs text-emerald-300">
            Kelola verifikasi akun wali, tautan anak, kode undangan, dan riwayat audit perubahan data.
          </p>
        </div>

        {/* Pending Alerts */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/60 text-center">
            <span className="text-[10px] text-emerald-300 font-bold block uppercase">Verifikasi Tautan</span>
            <span className="text-xl font-black text-white">{pendingLinkRequestsCount}</span>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-700/60 text-center">
            <span className="text-[10px] text-emerald-300 font-bold block uppercase">Perubahan Identitas</span>
            <span className="text-xl font-black text-amber-300">{pendingIdentityRequestsCount}</span>
          </div>
        </div>
      </div>

      {/* Global Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 gap-1 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'links'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Verifikasi Tautan Anak</span>
          {pendingLinkRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              {pendingLinkRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'identity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Pengajuan Identitas</span>
          {pendingIdentityRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              {pendingIdentityRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'invites'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Kode Undangan Wali ({parentInviteCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parents')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'parents'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Daftar Akun Orang Tua ({parentUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Riwayat Audit ({parentAuditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: VERIFIKASI TAUTAN ANAK */}
      {activeTab === 'links' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Antrean Verifikasi Permohonan Tautan Anak</h3>
              <p className="text-xs text-gray-500">
                Wali murid yang mengajukan izin untuk melihat performa dan data perkembangan pemain.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-600">
              Total Permohonan: {parentLinkRequests.length}
            </span>
          </div>

          {parentLinkRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl">
              Belum ada permohonan tautan profil anak dari orang tua.
            </div>
          ) : (
            <div className="space-y-3">
              {parentLinkRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-gray-900">{req.parentName}</strong>
                      <span className="text-gray-500">({req.relationship})</span>
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          Menunggu Persetujuan
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Disetujui
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          Ditolak
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      Email: <span className="font-mono">{req.parentEmail}</span> • HP: <span>{req.parentPhone || '-'}</span>
                    </p>
                    <p className="text-emerald-800 font-semibold">
                      Ingin Terhubung dengan: <span className="text-gray-900 font-bold">{req.playerName}</span> ({req.playerId})
                    </p>
                    {req.inviteCodeUsed && (
                      <p className="text-[11px] text-gray-500">
                        Kode Undangan: <code className="bg-gray-200 px-1 py-0.5 rounded">{req.inviteCodeUsed}</code>
                      </p>
                    )}
                    {req.notes && (
                      <p className="text-[11px] text-gray-500 italic">Catatan Wali: "{req.notes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveLink(req.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingLinkId(req.id);
                          setRejectionReason('Data tidak sesuai verifikasi admin');
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                    <div className="text-[11px] text-gray-400 text-right">
                      Diverifikasi: {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('id-ID') : '-'}
                      <br />
                      Oleh: {req.reviewedBy || '-'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reject Modal */}
          {rejectingLinkId && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">Alasan Penolakan Permohonan Tautan</h4>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan untuk orang tua..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectingLinkId(null)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleRejectLink(rejectingLinkId)}
                    className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500"
                  >
                    Tolak Tautan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENGAJUAN PERUBAHAN IDENTITAS UTAMA */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Pengajuan Perubahan Identitas Resmi Pemain</h3>
              <p className="text-xs text-gray-500">
                Pemeriksaan permintaan perubahan nama lengkap, tanggal lahir, tempat lahir, atau jenis kelamin.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-600">
              Total Pengajuan: {childIdentityChangeRequests.length}
            </span>
          </div>

          {childIdentityChangeRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl">
              Tidak ada pengajuan perubahan identitas resmi dari orang tua.
            </div>
          ) : (
            <div className="space-y-3">
              {childIdentityChangeRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">Pemain: {req.playerName} ({req.playerId})</span>
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          Menunggu Verifikasi
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Disetujui
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          Ditolak
                        </span>
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Field: </span>
                      <strong className="text-emerald-900 uppercase">{req.field}</strong>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-500">Semula: </span>
                      <span className="line-through text-gray-600">{req.currentValue}</span>
                      <span className="mx-1 text-emerald-600 font-bold">→ Nilai Baru:</span>
                      <strong className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">{req.proposedValue}</strong>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Alasan Wali ({req.parentName}): <span className="italic text-gray-800">"{req.reason}"</span>
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveIdentity(req.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui Perubahan</span>
                      </button>
                      <button
                        onClick={() => {
                          setRejectingIdentityId(req.id);
                          setIdentityRejectionNotes('Dokumen bukti tidak memadai');
                        }}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}

                  {req.status !== 'pending' && (
                    <div className="text-[11px] text-gray-400 text-right">
                      Ditinjau: {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('id-ID') : '-'}
                      <br />
                      Oleh: {req.reviewedBy || '-'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Identity Reject Modal */}
          {rejectingIdentityId && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">Alasan Penolakan Perubahan Identitas</h4>
                <textarea
                  rows={3}
                  value={identityRejectionNotes}
                  onChange={(e) => setIdentityRejectionNotes(e.target.value)}
                  placeholder="Tuliskan alasan penolakan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectingIdentityId(null)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleRejectIdentity(rejectingIdentityId)}
                    className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500"
                  >
                    Tolak Pengajuan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KODE UNDANGAN WALI MURID */}
      {activeTab === 'invites' && (
        <div className="space-y-6">
          {/* Generator Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Buat Kode Undangan Akun Orang Tua Baru</span>
              </h3>
              <p className="text-xs text-gray-500">
                Kode undangan memungkinkan orang tua menghubungkan akun mereka langsung ke profil anak saat registrasi.
              </p>
            </div>

            <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Pemain Aktif</label>
                <select
                  value={selectedPlayerForInvite}
                  onChange={(e) => setSelectedPlayerForInvite(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) - Lahir {p.birthYear}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!selectedPlayerForInvite || isCreatingInvite}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingInvite ? 'Membuat...' : 'Buat Kode Undangan'}</span>
                </button>
              </div>
            </form>

            {createdInvite && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                    Kode Undangan Baru untuk {createdInvite.playerName}:
                  </span>
                  <code className="text-lg font-black text-emerald-950 font-mono tracking-wider">
                    {createdInvite.code}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(createdInvite.code)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500 transition-colors"
                >
                  {copiedCode === createdInvite.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === createdInvite.code ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Invites List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Daftar Semua Kode Undangan</h4>
            {parentInviteCodes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl">
                Belum ada kode undangan yang dibuat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Kode Undangan</th>
                      <th className="py-2.5 px-3">Pemain</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Digunakan Oleh</th>
                      <th className="py-2.5 px-3">Dibuat Oleh</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {parentInviteCodes.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          {inv.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <strong className="text-gray-900">{inv.playerName}</strong> ({inv.playerId})
                        </td>
                        <td className="py-2.5 px-3">
                          {inv.isUsed ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold text-[10px]">
                              Sudah Dipakai
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              Aktif / Siap Pakai
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          {inv.usedByParentName ? (
                            <span>{inv.usedByParentName}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {inv.createdBy} ({new Date(inv.createdAt).toLocaleDateString('id-ID')})
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleCopyCode(inv.code)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Salin Kode"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DAFTAR AKUN ORANG TUA */}
      {activeTab === 'parents' && (
        <div className="space-y-6">
          {/* Direct Link Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-600" />
                <span>Hubungkan Langsung Akun Orang Tua dengan Pemain</span>
              </h3>
              <p className="text-xs text-gray-500">
                Fitur admin untuk menautkan akun wali yang sudah terdaftar dengan pemain tanpa perlu kode undangan.
              </p>
            </div>

            <form onSubmit={handleDirectLink} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Akun Orang Tua</label>
                <select
                  value={directParentId}
                  onChange={(e) => setDirectParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Pilih Akun Wali --</option>
                  {parentUsers.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Pemain yang Dihubungkan</label>
                <select
                  value={directPlayerId}
                  onChange={(e) => setDirectPlayerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!directParentId || !directPlayerId || isDirectLinking}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Hubungkan</span>
                </button>
              </div>
            </form>
          </div>

          {/* Parents Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Daftar Akun Orang Tua Terdaftar ({parentUsers.length})</h4>
            {parentUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl">
                Belum ada akun wali yang terdaftar di sistem.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nama Wali Murid</th>
                      <th className="py-2.5 px-3">Kontak Email & HP</th>
                      <th className="py-2.5 px-3">Hubungan</th>
                      <th className="py-2.5 px-3">Profil Anak Terhubung</th>
                      <th className="py-2.5 px-3 text-right">Kelola Tautan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    {parentUsers.map((parent) => {
                      const linked = activePlayers.filter((p) =>
                        (parent.linkedPlayerIds || []).includes(p.id)
                      );
                      return (
                        <tr key={parent.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3">
                            <strong className="text-gray-900 block">{parent.name}</strong>
                            <span className="text-[10px] text-gray-400 font-mono">{parent.id}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-gray-700">{parent.email}</span>
                            <br />
                            <span className="text-gray-500">{parent.phone || '-'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-700">
                            {parent.relationship || 'Wali'}
                          </td>
                          <td className="py-2.5 px-3">
                            {linked.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {linked.map((p) => (
                                  <span
                                    key={p.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[11px]"
                                  >
                                    <span>{p.fullName}</span>
                                    <button
                                      onClick={() => handleDirectUnlink(parent.id, p.id)}
                                      className="text-emerald-700 hover:text-rose-700 ml-1"
                                      title="Putus Tautan"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Belum ada anak terhubung</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setDirectParentId(parent.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-xs font-semibold"
                            >
                              + Hubungkan Anak
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: RIWAYAT AUDIT PERUBAHAN */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Riwayat Audit Perubahan Data oleh Orang Tua</h3>
              <p className="text-xs text-gray-500">
                Pencatatan rekam jejak otomatis untuk kepatuhan administrasi dan perlindungan data anak.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-600">
              Total Log: {parentAuditLogs.length}
            </span>
          </div>

          {parentAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl">
              Belum ada riwayat aktivitas perubahan data oleh orang tua.
            </div>
          ) : (
            <div className="space-y-2">
              {parentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 uppercase text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <strong className="text-gray-900">{log.fieldChanged}</strong>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Pemain: <strong>{log.playerName}</strong></span>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Oleh Akun: <strong>{log.parentName}</strong> ({log.parentId})
                    </div>
                    {(log.oldValue || log.newValue) && (
                      <div className="text-[11px] font-mono bg-white p-2 rounded border border-gray-200 text-gray-800">
                        <span className="text-gray-400">Semula:</span> {log.oldValue || '-'} →{' '}
                        <span className="text-emerald-700">Baru:</span> {log.newValue || '-'}
                      </div>
                    )}
                    {log.notes && (
                      <p className="text-[11px] text-gray-500 italic">{log.notes}</p>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono shrink-0">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Unlink Modal */}
      <ConfirmModal
        isOpen={!!unlinkTarget}
        title="Putus Hubungan Akun Wali"
        message="Apakah Anda yakin ingin memutus hubungan akun wali murid ini dari pemain? Akses wali ke profil anak akan dihentikan."
        confirmText="Ya, Putus Hubungan"
        variant="danger"
        onConfirm={handleConfirmUnlink}
        onClose={() => setUnlinkTarget(null)}
      />
    </div>
  );
};
