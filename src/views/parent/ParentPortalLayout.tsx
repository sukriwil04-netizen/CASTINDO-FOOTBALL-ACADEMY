import React, { useState } from 'react';
import {
  Activity,
  LogOut,
  Shield,
  User,
  Plus,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ParentDashboardView } from './ParentDashboardView.tsx';
import { ParentAddAthleteModal } from './ParentAddAthleteModal.tsx';
import { TermsPrivacyModal } from '../public/TermsPrivacyModal.tsx';

export const ParentPortalLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [isAddAthleteOpen, setIsAddAthleteOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const isPending = currentUser?.status === 'pending';
  const currentCount = currentUser?.linkedPlayerIds?.length || 0;
  const isMaxReached = currentCount >= 4;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30 shrink-0">
              <img
                src="/logo.png"
                alt="Castindo Football Academy"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-base sm:text-lg text-white">
                  CASTINDO
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  PORTAL WALI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Pemantauan & Analisis Fisik Pemain Sepak Bola
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsAddAthleteOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
                isMaxReached
                  ? 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
              }`}
              title={
                isMaxReached
                  ? 'Batas maksimal 4 anak/pemain tercapai'
                  : 'Daftarkan anak lain ke akun wali ini (Maks. 4)'
              }
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Tambah Atlet</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                isMaxReached
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-950/40 text-slate-950'
              }`}>
                {currentCount}/4
              </span>
            </button>

            {/* Parent Profile Badge */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-800">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border border-emerald-500/50 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-emerald-500/50 bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-white truncate max-w-[130px]">
                  {currentUser?.name || 'Wali Murid'}
                </p>
                <div className="flex items-center gap-1 text-[10px]">
                  {isPending ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Verifikasi
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-300 border border-slate-700 hover:border-red-800 transition-all shadow-xs"
              title="Keluar dari akun wali"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Pending Verification Notice Banner */}
      {isPending && (
        <div className="bg-amber-950/60 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p>
              <strong>Status Pendaftaran: Menunggu Verifikasi Admin.</strong> Data akun dan atlet Anda telah tersimpan dengan aman di database. Tim pelatih dan admin sedang memeriksa kelengkapan berkas sebelum jadwal sesi resmi berikutnya.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <ParentDashboardView
          onNavigateToRegistration={() => setIsAddAthleteOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Castindo Football Academy. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Kebijakan Privasi & Ketentuan
            </button>
            <span>·</span>
            <span>Kontak Akademi: info@castindo.ac.id</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ParentAddAthleteModal
        isOpen={isAddAthleteOpen}
        onClose={() => setIsAddAthleteOpen(false)}
        onAdded={() => setIsAddAthleteOpen(false)}
      />

      <TermsPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};
