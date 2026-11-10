import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Users,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext.tsx';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { database, restoreBackup } = useData();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedJson, setPastedJson] = useState('');
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndPreviewJson = (content: string) => {
    setParseError(null);
    setResultMsg(null);
    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Data bukan berformat objek JSON yang valid.');
      }

      // Check if it has any recognizable CFA database arrays
      const hasPlayers = Array.isArray(parsed.players);
      const hasRegistrations = Array.isArray(parsed.playerRegistrations);
      const hasTeams = Array.isArray(parsed.teams);
      const hasSessions = Array.isArray(parsed.trainingSessions);
      const hasUsers = Array.isArray(parsed.users);

      if (!hasPlayers && !hasRegistrations && !hasTeams && !hasSessions && !hasUsers) {
        throw new Error(
          'Berkas ini bukan berkas cadangan database CFA yang valid (tidak ditemukan data pemain, tim, pendaftaran, atau pengguna).'
        );
      }

      setParsedData(parsed);
    } catch (err: any) {
      setParsedData(null);
      setParseError(err.message || 'Gagal memproses berkas JSON.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setParseError('Harap pilih berkas dengan format .json');
      setSelectedFile(null);
      setParsedData(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      validateAndPreviewJson(text);
    };
    reader.onerror = () => {
      setParseError('Gagal membaca berkas dari perangkat Anda.');
      setSelectedFile(null);
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (val: string) => {
    setPastedJson(val);
    if (val.trim()) {
      validateAndPreviewJson(val);
    } else {
      setParsedData(null);
      setParseError(null);
    }
  };

  const handleDownloadCurrentBackup = () => {
    const jsonStr = JSON.stringify(database, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `castindo_cfa_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteRestore = async () => {
    if (!parsedData) return;

    setIsSubmitting(true);
    setResultMsg(null);
    try {
      const res = await restoreBackup(parsedData, restoreMode);
      setResultMsg({
        type: 'success',
        message: `Berhasil memulihkan data cadangan! (${res.restoredPlayersCount || 0} Pemain, ${res.restoredRegistrationsCount || 0} Pendaftaran, ${res.restoredSessionsCount || 0} Sesi Latihan).`,
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        message: err.message || 'Gagal memulihkan berkas cadangan ke server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Memasukkan & Memulihkan Cadangan Data (Backup)</h3>
              <p className="text-xs text-emerald-200">
                Unggah berkas JSON cadangan untuk memulihkan seluruh database akademi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Status Message */}
          {resultMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 font-bold ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{resultMsg.message}</span>
            </div>
          )}

          {/* Quick Action: Export current database first */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-bold text-gray-900 block">Simpan Cadangan Saat Ini Dulu?</span>
              <span className="text-[11px] text-gray-500">
                Unduh berkas .json cadangan data saat ini sebelum memasukkan data baru
              </span>
            </div>
            <button
              onClick={handleDownloadCurrentBackup}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-semibold border border-gray-300 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unduh Cadangan (.JSON)</span>
            </button>
          </div>

          {/* Input Method Tabs */}
          <div className="space-y-3">
            <label className="font-bold text-gray-900 block text-xs">Pilih Sumber Berkas Cadangan:</label>
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-4 font-bold border-b-2 text-xs transition-colors ${
                  activeTab === 'upload'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Unggah Berkas .JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`py-2 px-4 font-bold border-b-2 text-xs transition-colors ${
                  activeTab === 'paste'
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tempel Teks JSON
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50/60 hover:bg-emerald-50/30 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                <span className="font-bold text-gray-900 block text-sm">
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih berkas cadangan .JSON'}
                </span>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  {selectedFile
                    ? `Ukuran berkas: ${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Mendukung berkas JSON hasil ekspor dari aplikasi CASTINDO CFA'}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <textarea
                  rows={6}
                  value={pastedJson}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  placeholder="Tempelkan seluruh kode JSON database cadangan di sini (misal: { &quot;players&quot;: [...], ... })"
                  className="w-full p-3 font-mono text-[11px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Validated Backup Preview Summary */}
          {parsedData && (
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Berkas Cadangan Terverifikasi Valid
                </span>
                {parsedData.meta?.lastUpdated && (
                  <span className="text-[10px] text-emerald-700 font-mono">
                    Waktu Backup: {new Date(parsedData.meta.lastUpdated).toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Pemain</span>
                  <span className="text-base font-black text-emerald-800">
                    {(parsedData.players || []).length}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Pendaftaran</span>
                  <span className="text-base font-black text-emerald-800">
                    {(parsedData.playerRegistrations || []).length}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Sesi Latihan</span>
                  <span className="text-base font-black text-emerald-800">
                    {(parsedData.trainingSessions || []).length}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">Akun Pengguna</span>
                  <span className="text-base font-black text-emerald-800">
                    {(parsedData.users || []).length}
                  </span>
                </div>
              </div>

              {/* Restore Mode Selection */}
              <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                <span className="font-bold text-gray-900 block">Pilih Mode Pemulihan:</span>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <strong className="text-gray-900 block">
                        Ganti Total (Restore Penuh) — Direkomendasikan
                      </strong>
                      <span className="text-[11px] text-gray-500">
                        Menggantikan seluruh isi database saat ini dengan isi berkas cadangan ini secara utuh.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-300 cursor-pointer">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <strong className="text-gray-900 block">Gabungkan Data (Merge)</strong>
                      <span className="text-[11px] text-gray-500">
                        Menambahkan pemain dan pendaftaran baru dari cadangan tanpa menghapus data yang sudah ada di database saat ini.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-bold transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleExecuteRestore}
            disabled={!parsedData || isSubmitting}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Pemulihan...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Mulai Masukkan Data Cadangan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
