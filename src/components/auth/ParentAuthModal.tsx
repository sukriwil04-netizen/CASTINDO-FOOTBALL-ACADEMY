import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';

interface ParentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ParentAuthModal: React.FC<ParentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, loginParent, switchRole, logout } = useAuth();
  const { registerParentUser } = useData();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRelationship, setRegRelationship] = useState('Ayah');
  const [regInviteCode, setRegInviteCode] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setErrorMsg('Harap masukkan email akun orang tua.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await loginParent(loginEmail.trim(), loginPassword.trim() || undefined);
      setSuccessMsg('Berhasil masuk ke portal orang tua.');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk akun orang tua.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Nama lengkap dan email wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await registerParentUser({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim() || '123456',
        relationship: regRelationship,
        inviteCode: regInviteCode.trim() || undefined,
      });

      // Automatically login with newly created parent user
      await loginParent(regEmail.trim(), regPassword.trim() || '123456');

      setSuccessMsg(
        result.linkedPlayerId
          ? 'Pendaftaran berhasil dan akun langsung terhubung dengan ananda!'
          : 'Pendaftaran akun orang tua berhasil! Anda kini dapat menghubungkan ananda.'
      );

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar akun orang tua.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoParent = () => {
    switchRole('parent');
    setSuccessMsg('Beralih ke mode demonstrasi Akun Orang Tua / Wali Murid.');
    if (onSuccess) onSuccess();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Portal Orang Tua & Wali Murid</h3>
              <p className="text-[11px] text-emerald-300">Castindo Football Academy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-100 gap-1 border-b border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-3 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 px-3 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
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

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Masuk ke Portal Orang Tua'}</span>
              </button>

              <div className="pt-3 border-t border-gray-200 text-center space-y-2">
                <span className="text-[11px] text-gray-500 block">Ingin mencoba langsung tanpa login?</span>
                <button
                  type="button"
                  onClick={handleQuickDemoParent}
                  className="w-full py-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-colors"
                >
                  ⚡ Masuk Cepat sebagai Mode Orang Tua
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Orang Tua / Wali</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Ibu Ratna Dewi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hubungan</label>
                  <select
                    value={regRelationship}
                    onChange={(e) => setRegRelationship(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Wali">Wali Murid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Akun</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="email.wali@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kata Sandi</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Kode Undangan Anak dari Akademi (Opsional)
                </label>
                <input
                  type="text"
                  value={regInviteCode}
                  onChange={(e) => setRegInviteCode(e.target.value)}
                  placeholder="Contoh: INV-CFA-2026-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Jika belum memiliki kode undangan, Anda dapat menautkan anak nanti melalui dashboard.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 mt-3"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun Orang Tua'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
