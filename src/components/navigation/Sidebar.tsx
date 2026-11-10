import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Activity,
  ClipboardList,
  Target,
  Zap,
  TrendingUp,
  FileText,
  Award,
  Settings,
  Shield,
  X,
  ChevronRight,
  Edit2,
  UserCheck,
  UserPlus,
  HeartHandshake,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useData } from '../../context/DataContext.tsx';
import { UserEditModal } from '../users/UserEditModal.tsx';
import { ParentAuthModal } from '../auth/ParentAuthModal.tsx';

export type NavTab =
  | 'dashboard'
  | 'players'
  | 'verification'
  | 'registration'
  | 'attendance'
  | 'training-load'
  | 'sessions'
  | 'evaluations'
  | 'motor-tests'
  | 'ltad'
  | 'reports'
  | 'promotion'
  | 'parent-management'
  | 'parent-dashboard'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { currentUser, switchRole, logout } = useAuth();
  const {
    teams,
    selectedTeamId,
    setSelectedTeamId,
    database,
    pendingRegistrationsCount,
    pendingLinkRequestsCount,
    pendingIdentityRequestsCount,
  } = useData();
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isParentAuthOpen, setIsParentAuthOpen] = useState(false);

  const isParent = currentUser?.role === 'parent';
  const isAdmin = currentUser?.role === 'admin';
  const isCoach = currentUser?.role === 'head_coach' || currentUser?.role === 'assistant_coach';
  const pendingParentRequests = pendingLinkRequestsCount + pendingIdentityRequestsCount;

  // Tailored menu items strictly separated by role
  let menuItems: { id: NavTab; label: string; icon: any; badge?: number; alert?: boolean }[] = [];

  if (isParent) {
    menuItems = [
      { id: 'parent-dashboard' as NavTab, label: 'Dashboard Anak Saya', icon: LayoutDashboard },
      { id: 'settings' as NavTab, label: 'Pengaturan Akun', icon: Settings },
    ];
  } else if (isAdmin) {
    // Administrator: Full access to verification, parent management, system config, and coaching tools
    menuItems = [
      { id: 'dashboard' as NavTab, label: 'Dashboard Admin & Pelatih', icon: LayoutDashboard },
      { id: 'players' as NavTab, label: 'Database Pemain', icon: Users, badge: (database?.players || []).filter((p) => p && p.status === 'active').length },
      {
        id: 'verification' as NavTab,
        label: 'Verifikasi Data Pemain',
        icon: UserCheck,
        badge: pendingRegistrationsCount > 0 ? pendingRegistrationsCount : undefined,
        alert: pendingRegistrationsCount > 0,
      },
      {
        id: 'parent-management' as NavTab,
        label: 'Portal Orang Tua / Wali',
        icon: HeartHandshake,
        badge: pendingParentRequests > 0 ? pendingParentRequests : undefined,
        alert: pendingParentRequests > 0,
      },
      { id: 'registration' as NavTab, label: 'Pendaftaran Atlet Baru', icon: UserPlus },
      { id: 'attendance' as NavTab, label: 'Presensi Kehadiran', icon: CalendarCheck },
      { id: 'training-load' as NavTab, label: 'Beban Latihan (Load)', icon: Activity },
      { id: 'sessions' as NavTab, label: 'Jadwal & Sesi Latihan', icon: ClipboardList, badge: (database?.trainingSessions || []).length },
      { id: 'evaluations' as NavTab, label: 'Evaluasi Teknik & Taktik', icon: Target },
      { id: 'motor-tests' as NavTab, label: 'Tes Fisik & Motorik', icon: Zap },
      { id: 'ltad' as NavTab, label: 'LTAD & Target Individu', icon: TrendingUp },
      { id: 'reports' as NavTab, label: 'Laporan Perkembangan', icon: FileText },
      { id: 'promotion' as NavTab, label: 'Evaluasi Promosi Tim A', icon: Award, alert: (database?.promotionReviews || []).length > 0 },
      { id: 'settings' as NavTab, label: 'Pengaturan Akademi', icon: Settings },
    ];
  } else {
    // Coach / Assistant Coach: Strictly coaching features only
    menuItems = [
      { id: 'dashboard' as NavTab, label: 'Dashboard Kepelatihan', icon: LayoutDashboard },
      { id: 'players' as NavTab, label: 'Database Pemain', icon: Users, badge: (database?.players || []).filter((p) => p && p.status === 'active').length },
      { id: 'attendance' as NavTab, label: 'Presensi Kehadiran', icon: CalendarCheck },
      { id: 'training-load' as NavTab, label: 'Beban Latihan (Load)', icon: Activity },
      { id: 'sessions' as NavTab, label: 'Jadwal & Sesi Latihan', icon: ClipboardList, badge: (database?.trainingSessions || []).length },
      { id: 'evaluations' as NavTab, label: 'Evaluasi Teknik & Taktik', icon: Target },
      { id: 'motor-tests' as NavTab, label: 'Tes Fisik & Motorik', icon: Zap },
      { id: 'ltad' as NavTab, label: 'LTAD & Target Individu', icon: TrendingUp },
      { id: 'reports' as NavTab, label: 'Laporan Perkembangan', icon: FileText },
      { id: 'promotion' as NavTab, label: 'Evaluasi Promosi Tim A', icon: Award, alert: (database?.promotionReviews || []).length > 0 },
      { id: 'settings' as NavTab, label: 'Profil Saya', icon: Settings },
    ];
  }

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden print:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-emerald-950 text-emerald-50 border-r border-emerald-800 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Academy Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/80 bg-emerald-900/40">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white p-1 shadow-md shadow-emerald-950/40 border border-emerald-500/30 shrink-0">
              <img
                src="/logo.png"
                alt="Castindo Football Academy"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider uppercase text-emerald-100 leading-tight">
                Castindo
              </div>
              <div className="text-[11px] font-medium text-emerald-300 tracking-wider">
                Football Academy
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Team Switcher in Sidebar */}
        <div className="px-4 py-3 bg-emerald-900/20 border-b border-emerald-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
              Kelompok Tim Aktif ({teams.filter((t) => t.active !== false).length})
            </label>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/60 font-mono">
              PSSI / FIFA
            </span>
          </div>
          <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
            {teams.filter((t) => t.active !== false).map((t) => {
              const isSelected = selectedTeamId === t.id;
              const count = (database?.players || []).filter((p) => p.teamId === t.id && p.status === 'active').length;
              const cleanName = t.name.replace('Castindo ', '');
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-all flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs border-emerald-400'
                      : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/70 border-emerald-800/60'
                  }`}
                  title={`${t.name} (${t.ageGroup || t.format})`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                    <span className="truncate">{cleanName}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-900 text-emerald-300'
                    }`}>
                      {count} atlet
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5"></span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-emerald-100 hover:bg-emerald-900/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-emerald-300 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-emerald-900 text-emerald-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Identity & Direct Edit Profile Option */}
        <div className="p-3.5 border-t border-emerald-800/80 bg-emerald-900/50">
          <div
            onClick={() => setIsEditUserOpen(true)}
            className="flex items-center justify-between p-1.5 -m-1.5 rounded-xl hover:bg-emerald-800/50 transition-colors cursor-pointer group mb-2"
            title="Klik untuk mengedit profil pelatih / pengguna"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border border-emerald-500 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-emerald-500/60 bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{currentUser?.name || 'Pelatih'}</span>
                </div>
                <div className="text-[10px] text-emerald-300 truncate">
                  {currentUser?.role === 'admin'
                    ? 'Administrator'
                    : currentUser?.role === 'head_coach'
                    ? 'Head Coach'
                    : currentUser?.role === 'assistant_coach'
                    ? 'Assistant Coach'
                    : 'Orang Tua / Wali Murid'}
                </div>
              </div>
            </div>

            <div className="p-1 rounded text-emerald-300 group-hover:text-white group-hover:bg-emerald-700/80 transition-colors" title="Edit Profil">
              <Edit2 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-800/60">
            {isAdmin && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-emerald-300/80 uppercase tracking-wider font-semibold">
                    Simulasi Akses Peran (Admin):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(true)}
                    className="text-[10px] text-emerald-300 hover:text-white font-bold underline"
                  >
                    Kelola
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  <button
                    onClick={() => switchRole('admin')}
                    className={`px-1 py-1 rounded text-center truncate ${
                      currentUser?.role === 'admin'
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                    }`}
                    title="Admin"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => switchRole('head_coach')}
                    className={`px-1 py-1 rounded text-center truncate ${
                      currentUser?.role === 'head_coach'
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                    }`}
                    title="Head Coach"
                  >
                    Head
                  </button>
                  <button
                    onClick={() => switchRole('assistant_coach')}
                    className={`px-1 py-1 rounded text-center truncate ${
                      currentUser?.role === 'assistant_coach'
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                    }`}
                    title="Assistant Coach"
                  >
                    Asisten
                  </button>
                  <button
                    onClick={() => switchRole('parent')}
                    className={`px-1 py-1 rounded text-center truncate ${
                      currentUser?.role === 'parent'
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                    }`}
                    title="Orang Tua / Wali"
                  >
                    Wali
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditUserOpen(true)}
                className="flex-1 py-1.5 px-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-700/60"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Profil</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex-1 py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-800/60"
                title="Keluar dari sistem"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* User Edit Modal */}
      <UserEditModal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
      />

      {/* Parent Auth Modal */}
      <ParentAuthModal
        isOpen={isParentAuthOpen}
        onClose={() => setIsParentAuthOpen(false)}
        onSuccess={() => {
          setIsParentAuthOpen(false);
          onSelectTab('parent-dashboard');
        }}
      />
    </>
  );
};
