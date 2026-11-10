import {
  Menu,
  Search,
  Plus,
  Database,
  RefreshCw,
  UserCheck,
  Calendar,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { NavTab } from './Sidebar.tsx';

interface HeaderProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  onQuickAction: (action: 'add_player' | 'add_session' | 'quick_attendance') => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Utama',
    subtitle: 'Ringkasan performa pembinaan, kehadiran, dan beban latihan tim',
  },
  players: {
    title: 'Database Pemain',
    subtitle: 'Manajemen data pemain Tim B & Tim A usia dini (2016–2017)',
  },
  verification: {
    title: 'Verifikasi Data Pemain',
    subtitle: 'Tinjau, validasi, dan setujui pengajuan pendaftaran mandiri calon pemain',
  },
  registration: {
    title: 'Isi Data Pemain (Pendaftaran Mandiri)',
    subtitle: 'Formulir online pengisian data pemain mandiri Castindo Football Academy',
  },
  attendance: {
    title: 'Presensi & Kehadiran',
    subtitle: 'Pencatatan kehadiran dan menit bermain aktual di lapangan',
  },
  'training-load': {
    title: 'Monitoring Training Load',
    subtitle: 'Pemantauan Session-RPE skala 1–10 dan akumulasi beban latihan (AU)',
  },
  sessions: {
    title: 'Manajemen Sesi Latihan',
    subtitle: 'Rencana 3 sesi mingguan, fokus teknis, peralatan bola & marker',
  },
  evaluations: {
    title: 'Evaluasi Teknik & Taktik',
    subtitle: 'Observasi perkembangan 1–4 untuk penguasaan 1v1, passing, dan 7v7',
  },
  'motor-tests': {
    title: 'Tes Motorik & Fisik',
    subtitle: 'Hasil pengukuran kelincahan, akselerasi, dan keseimbangan berbasis marker',
  },
  ltad: {
    title: 'LTAD & Target Individu',
    subtitle: 'Kerangka Long-Term Athlete Development siklus peninjauan 4–8 minggu',
  },
  reports: {
    title: 'Laporan Perkembangan',
    subtitle: 'Rapor evaluasi komprehensif siap cetak dan ekspor CSV',
  },
  promotion: {
    title: 'Evaluasi Kesiapan Promosi Tim A',
    subtitle: 'Dokumentasi bukti performa dan keputusan staf pelatih',
  },
  'parent-dashboard': {
    title: 'Portal Orang Tua / Wali Murid',
    subtitle: 'Pemantauan perkembangan dan rapor performa sepak bola ananda',
  },
  'parent-management': {
    title: 'Manajemen Portal Orang Tua & Wali',
    subtitle: 'Verifikasi tautan akun anak, kode undangan, dan riwayat audit perubahan data',
  },
  settings: {
    title: 'Pengaturan & Struktur Akademi',
    subtitle: 'Manajemen pengguna, tim, pencadangan data, dan kurikulum',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  onQuickAction,
}) => {
  const { currentUser, logout } = useAuth();
  const {
    teams,
    selectedTeamId,
    setSelectedTeamId,
    searchQuery,
    setSearchQuery,
    database,
    isLoading,
  } = useData();

  const tabInfo = TAB_TITLES[currentTab] || { title: 'Castindo Academy', subtitle: '' };
  const hasNoPlayers = (database?.players || []).length === 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 print:hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
            aria-label="Buka navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-gray-200 shadow-2xs shrink-0 lg:hidden flex items-center justify-center">
            <img src="/logo.png" alt="CFA" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
              {tabInfo.title}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block truncate">
              {tabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, Team Dropdown, Quick Action */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Global Player Search (visible on sm+) */}
          <div className="relative hidden md:block w-48 lg:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pemain / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Team Filter */}
          <div className="relative">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Tim</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Primary */}
          {currentTab === 'players' && (
            <button
              onClick={() => onQuickAction('add_player')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Pemain</span>
            </button>
          )}

          {currentTab === 'sessions' && (
            <button
              onClick={() => onQuickAction('add_session')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Buat Sesi Latihan</span>
            </button>
          )}

          {currentTab === 'attendance' && (
            <button
              onClick={() => onQuickAction('quick_attendance')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Isi Presensi Sesi</span>
            </button>
          )}

          {/* User profile & Logout */}
          <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-800 leading-tight">
                {currentUser?.name || 'Staf Pelatih'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {currentUser?.role === 'admin'
                  ? 'Administrator'
                  : currentUser?.role === 'head_coach'
                  ? 'Head Coach'
                  : currentUser?.role === 'parent'
                  ? 'Orang Tua / Wali'
                  : 'Staf Pelatih'}
              </span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:text-red-700 bg-gray-100 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
              title="Keluar dari sistem"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
