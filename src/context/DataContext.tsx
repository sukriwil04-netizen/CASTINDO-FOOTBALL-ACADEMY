import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AcademyDatabase,
  AttendanceRecord,
  LtadGoal,
  MotorTest,
  MotorTestResult,
  Player,
  PromotionReview,
  Team,
  TechnicalTacticalEvaluation,
  TrainingLoadRecord,
  TrainingSession,
  PlayerRegistration,
  ParentInviteCode,
  ParentLinkRequest,
  ParentAuditLog,
  ChildIdentityChangeRequest,
  MatchRecord,
} from '../types/database.ts';
import { api, safeSetDatabaseCache } from '../services/api.ts';
import { safeStorage } from '../utils/safeStorage.ts';
import { createEmptyDatabase } from '../utils/initialData.ts';
import { useAuth } from './AuthContext.tsx';

interface DataContextType {
  database: AcademyDatabase;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  seedDemo: () => Promise<void>;
  resetData: () => Promise<void>;
  injectRegisteredPlayerAndUser: (player: Player | Player[], user?: any) => void;

  // Filters
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  selectedDateRange: string; // 'all' | 'last_30' | 'last_90' | 'this_year'
  setSelectedDateRange: (range: string) => void;
  selectedBirthYear: string; // 'all' | '2016' | '2017' | '2015'
  setSelectedBirthYear: (year: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Entities
  players: Player[];
  activePlayers: Player[];
  archivedPlayers: Player[];
  teams: Team[];
  sessions: TrainingSession[];
  attendanceRecords: AttendanceRecord[];
  trainingLoads: TrainingLoadRecord[];
  evaluations: TechnicalTacticalEvaluation[];
  motorTests: MotorTest[];
  motorTestResults: MotorTestResult[];
  ltadGoals: LtadGoal[];
  promotionReviews: PromotionReview[];
  matches: MatchRecord[];
  registrations: PlayerRegistration[];
  pendingRegistrationsCount: number;

  // Parent Portal Entities
  parentInviteCodes: ParentInviteCode[];
  parentLinkRequests: ParentLinkRequest[];
  parentAuditLogs: ParentAuditLog[];
  childIdentityChangeRequests: ChildIdentityChangeRequest[];
  pendingLinkRequestsCount: number;
  pendingIdentityRequestsCount: number;

  // Mutators
  createPlayer: (p: Partial<Player>) => Promise<Player>;
  updatePlayer: (id: string, p: Partial<Player>) => Promise<Player>;
  archivePlayer: (id: string, archive: boolean) => Promise<Player>;
  deletePlayer: (id: string) => Promise<boolean>;
  importPlayersCsv: (players: Partial<Player>[]) => Promise<{ count: number; players: Player[] }>;

  // Self-Service Registrations Mutators
  createRegistration: (data: Partial<PlayerRegistration>) => Promise<PlayerRegistration>;
  updateRegistration: (id: string, updates: Partial<PlayerRegistration>) => Promise<PlayerRegistration>;
  approveRegistration: (
    id: string,
    options: { teamId: string; adminNotes?: string; reviewerName: string; overrideDuplicate?: boolean }
  ) => Promise<{ registration: PlayerRegistration; player: Player }>;
  rejectRegistration: (
    id: string,
    options: { reason: string; reviewerName: string }
  ) => Promise<PlayerRegistration>;
  requestRevisionRegistration: (
    id: string,
    options: { notes: string; reviewerName: string }
  ) => Promise<PlayerRegistration>;
  deleteRegistration: (id: string) => Promise<boolean>;
  checkDuplicatePlayer: (
    fullName: string,
    birthDate: string
  ) => Promise<{ isDuplicate: boolean; matchedPlayer?: Player; message?: string }>;

  createSession: (s: Partial<TrainingSession>) => Promise<TrainingSession>;
  updateSession: (id: string, s: Partial<TrainingSession>) => Promise<TrainingSession>;
  deleteSession: (id: string) => Promise<boolean>;

  saveAttendanceBatch: (
    sessionId: string,
    records: Array<{
      playerId: string;
      status: AttendanceRecord['status'];
      actualMinutes: number;
      notes?: string;
    }>
  ) => Promise<void>;

  saveTrainingLoadBatch: (
    sessionId: string,
    records: Array<{
      playerId: string;
      actualDurationMinutes: number;
      rpe: number | null;
      playerResponseNotes?: string;
    }>
  ) => Promise<void>;

  saveEvaluation: (data: Partial<TechnicalTacticalEvaluation>, id?: string) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;

  saveMotorTestResult: (data: Partial<MotorTestResult>, id?: string) => Promise<void>;
  togglePublishMotorTestResult: (id: string, published: boolean) => Promise<void>;
  deleteMotorTestResult: (id: string) => Promise<void>;

  saveLtadGoal: (data: Partial<LtadGoal>, id?: string) => Promise<void>;
  deleteLtadGoal: (id: string) => Promise<void>;

  savePromotionReview: (data: Partial<PromotionReview>, id?: string) => Promise<void>;
  deletePromotionReview: (id: string) => Promise<void>;

  // Team Mutators
  createTeam: (t: Partial<Team>) => Promise<Team>;
  updateTeam: (id: string, t: Partial<Team>) => Promise<Team>;
  deleteTeam: (id: string) => Promise<boolean>;

  // Motor Test Protocol Mutators
  createMotorTest: (t: Partial<MotorTest>) => Promise<MotorTest>;
  updateMotorTest: (id: string, t: Partial<MotorTest>) => Promise<MotorTest>;
  deleteMotorTest: (id: string) => Promise<boolean>;

  // Parent Portal Mutators
  createParentInviteCode: (playerId: string, createdBy?: string, relationship?: string) => Promise<ParentInviteCode>;
  submitParentLinkRequest: (data: any) => Promise<ParentLinkRequest>;
  approveParentLinkRequest: (id: string, adminName?: string) => Promise<ParentLinkRequest>;
  rejectParentLinkRequest: (id: string, reason: string, adminName?: string) => Promise<ParentLinkRequest>;
  linkParentDirect: (parentId: string, playerId: string, adminName?: string) => Promise<boolean>;
  unlinkParentDirect: (parentId: string, playerId: string, adminName?: string) => Promise<boolean>;
  parentUpdateChildBasicInfo: (parentId: string, playerId: string, updates: any) => Promise<Player>;
  createChildIdentityChangeRequest: (data: any) => Promise<ChildIdentityChangeRequest>;
  approveChildIdentityChangeRequest: (id: string, adminName?: string) => Promise<ChildIdentityChangeRequest>;
  rejectChildIdentityChangeRequest: (id: string, adminNotes: string, adminName?: string) => Promise<ChildIdentityChangeRequest>;
  registerParentUser: (data: any) => Promise<{ user: any; linkedPlayerId?: string }>;
  fetchParentAuditLogs: (playerId?: string) => Promise<ParentAuditLog[]>;

  // Analytics Helpers
  getPlayerAttendanceStats: (playerId: string) => {
    totalSessions: number;
    attended: number;
    late: number;
    excused: number;
    sick: number;
    absent: number;
    percentage: number;
    totalMinutes: number;
  };

  getPlayerTrainingLoadStats: (playerId: string) => {
    totalLoad: number;
    averageLoad: number;
    completedSessionsCount: number;
    weeklyAverages: { weekLabel: string; totalLoad: number }[];
    recentLoads: { date: string; load: number; rpe: number | null; minutes: number }[];
  };

  // Client Cache Recovery & Sync
  syncClientDataToServer: (clientData?: Partial<AcademyDatabase>) => Promise<any>;
  restoreAllData: () => Promise<any>;
  getRecoverySnapshotInfo: () => Promise<{
    hasSnapshot: boolean;
    playersCount: number;
    registrationsCount: number;
    usersCount: number;
    lastSaved: string | null;
    samplePlayerNames: string[];
  }>;
  restoreOfficial20Players: () => Promise<void>;
  deleteTestPlayers: () => Promise<{ count: number; remainingPlayers: number }>;
  restoreBackup: (backupData: any, mode?: 'replace' | 'merge') => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [database, setDatabase] = useState<AcademyDatabase>(createEmptyDatabase());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global filters (default to 'all' so no players are hidden by default)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedBirthYear, setSelectedBirthYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDatabase();
      setDatabase(data);
    } catch (err: any) {
      console.error('Error fetching database:', err);
      setError(err.message || 'Gagal terhubung dengan basis data');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatic bidirectional sync on client mount: upload any valid offline registrations/players to server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = safeStorage.getItem('cfa_database_cache');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          // If the cached database contains the old 20 dummy players, purge the cache immediately
          if (
            Array.isArray(parsed?.players) &&
            parsed.players.some((p: any) => p && (p.id === 'CFA-2026-001' || p.fullName === 'Muhammad Fadhil Pratama'))
          ) {
            safeStorage.removeItem('cfa_database_cache');
          } else if (
            (Array.isArray(parsed?.players) && parsed.players.length > 0) ||
            (Array.isArray(parsed?.playerRegistrations) && parsed.playerRegistrations.length > 0)
          ) {
            api.syncClientDataToServer(parsed).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  const refreshData = async () => {
    await loadData();
  };

  const injectRegisteredPlayerAndUser = (playerOrPlayers: Player | Player[], user?: any) => {
    const newPlayers = Array.isArray(playerOrPlayers) ? playerOrPlayers : [playerOrPlayers];
    setDatabase((prev) => {
      const newIds = new Set(newPlayers.map((p) => p.id));
      const updatedPlayers = [...newPlayers, ...prev.players.filter((p) => !newIds.has(p.id))];
      const updatedUsers = user
        ? [user, ...prev.users.filter((u) => u.id !== user.id)]
        : prev.users;
      return {
        ...prev,
        players: updatedPlayers,
        users: updatedUsers,
      };
    });
    // Trigger fresh load to ensure all relational data is synced
    loadData();
  };

  const seedDemo = async () => {
    setIsLoading(true);
    try {
      const demoDb = await api.seedDemo();
      setDatabase(demoDb);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data demo');
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const emptyDb = await api.resetData();
      setDatabase(emptyDb);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncClientDataToServer = async (customData?: Partial<AcademyDatabase>) => {
    setIsLoading(true);
    setError(null);
    try {
      let dataToSend = customData;
      if (!dataToSend && typeof window !== 'undefined') {
        const cached = safeStorage.getItem('cfa_database_cache');
        if (cached) {
          dataToSend = JSON.parse(cached);
        }
      }
      if (dataToSend) {
        const res = await api.syncClientDataToServer(dataToSend);
        if (res.database) {
          setDatabase(res.database);
        }
        await loadData();
        return res;
      }
      return { success: false, restoredPlayersCount: 0 };
    } catch (err: any) {
      console.error('Failed to sync client data to server:', err);
      setError(err.message || 'Gagal menyinkronkan data lokal ke server');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.restoreAllData();
      if (res.database) {
        setDatabase(res.database);
      }
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan seluruh data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecoverySnapshotInfo = async () => {
    return api.getRecoverySnapshotInfo();
  };

  const restoreOfficial20Players = async () => {
    await restoreAllData();
  };

  const deleteTestPlayers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.deleteTestPlayers();
      if (res.database) {
        setDatabase(res.database);
      }
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Gagal membersihkan data uji coba');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (backupData: any, mode: 'replace' | 'merge' = 'replace') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.restoreBackup(backupData, mode);
      if (res.database) {
        setDatabase(res.database);
      }
      await loadData();
      return res;
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan berkas cadangan');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mutators
  const createPlayer = async (p: Partial<Player>) => {
    const created = await api.createPlayer(p);
    setDatabase((prev) => ({
      ...prev,
      players: [...prev.players, created],
    }));
    return created;
  };

  const updatePlayer = async (id: string, p: Partial<Player>) => {
    const updated = await api.updatePlayer(id, p);
    setDatabase((prev) => ({
      ...prev,
      players: prev.players.map((item) => (item.id === id ? updated : item)),
    }));
    return updated;
  };

  const archivePlayer = async (id: string, archive: boolean) => {
    const updated = await api.archivePlayer(id, archive);
    setDatabase((prev) => ({
      ...prev,
      players: prev.players.map((item) => (item.id === id ? updated : item)),
    }));
    return updated;
  };

  const deletePlayer = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const ok = await api.deletePlayer(id);
      if (ok) {
        setDatabase((prev) => {
          const nextDb = {
            ...prev,
            players: prev.players.filter((item) => item.id !== id),
          };
          safeSetDatabaseCache(nextDb);
          return nextDb;
        });
      }
      return ok;
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus pemain');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const importPlayersCsv = async (playersList: Partial<Player>[]) => {
    const res = await api.importPlayersCsv(playersList);
    await refreshData();
    return res;
  };

  const createSession = async (s: Partial<TrainingSession>) => {
    const created = await api.createSession(s);
    await refreshData();
    return created;
  };

  const updateSession = async (id: string, s: Partial<TrainingSession>) => {
    const updated = await api.updateSession(id, s);
    await refreshData();
    return updated;
  };

  const deleteSession = async (id: string) => {
    const ok = await api.deleteSession(id);
    await refreshData();
    return ok;
  };

  const saveAttendanceBatch = async (
    sessionId: string,
    records: Array<{
      playerId: string;
      status: AttendanceRecord['status'];
      actualMinutes: number;
      notes?: string;
    }>
  ) => {
    await api.batchSaveAttendance(sessionId, records);
    await refreshData();
  };

  const saveTrainingLoadBatch = async (
    sessionId: string,
    records: Array<{
      playerId: string;
      actualDurationMinutes: number;
      rpe: number | null;
      playerResponseNotes?: string;
    }>
  ) => {
    await api.batchSaveTrainingLoad(sessionId, records);
    await refreshData();
  };

  const saveEvaluation = async (data: Partial<TechnicalTacticalEvaluation>, id?: string) => {
    await api.saveEvaluation(data, id);
    await refreshData();
  };

  const deleteEvaluation = async (id: string) => {
    await api.deleteEvaluation(id);
    setDatabase((prev) => ({
      ...prev,
      evaluations: prev.evaluations.filter((e) => e.id !== id),
    }));
  };

  const saveMotorTestResult = async (data: Partial<MotorTestResult>, id?: string) => {
    await api.saveMotorTestResult(data, id);
    await refreshData();
  };

  const togglePublishMotorTestResult = async (id: string, published: boolean) => {
    await api.togglePublishMotorTestResult(id, published);
    setDatabase((prev) => ({
      ...prev,
      motorTestResults: prev.motorTestResults.map((r) =>
        r.id === id ? { ...r, publishedToParents: published } : r
      ),
    }));
  };

  const deleteMotorTestResult = async (id: string) => {
    await api.deleteMotorTestResult(id);
    setDatabase((prev) => ({
      ...prev,
      motorTestResults: prev.motorTestResults.filter((r) => r.id !== id),
    }));
  };

  const saveLtadGoal = async (data: Partial<LtadGoal>, id?: string) => {
    await api.saveLtadGoal(data, id);
    await refreshData();
  };

  const deleteLtadGoal = async (id: string) => {
    await api.deleteLtadGoal(id);
    setDatabase((prev) => ({
      ...prev,
      ltadGoals: prev.ltadGoals.filter((g) => g.id !== id),
    }));
  };

  const savePromotionReview = async (data: Partial<PromotionReview>, id?: string) => {
    await api.savePromotionReview(data, id);
    await refreshData();
  };

  const deletePromotionReview = async (id: string) => {
    await api.deletePromotionReview(id);
    setDatabase((prev) => ({
      ...prev,
      promotionReviews: prev.promotionReviews.filter((p) => p.id !== id),
    }));
  };

  // Team Mutators
  const createTeam = async (t: Partial<Team>) => {
    const res = await api.createTeam(t);
    await refreshData();
    return res;
  };

  const updateTeam = async (id: string, t: Partial<Team>) => {
    const res = await api.updateTeam(id, t);
    await refreshData();
    return res;
  };

  const deleteTeam = async (id: string) => {
    const res = await api.deleteTeam(id);
    await refreshData();
    return res;
  };

  // Motor Test Mutators
  const createMotorTest = async (t: Partial<MotorTest>) => {
    const res = await api.createMotorTest(t);
    await refreshData();
    return res;
  };

  const updateMotorTest = async (id: string, t: Partial<MotorTest>) => {
    const res = await api.updateMotorTest(id, t);
    await refreshData();
    return res;
  };

  const deleteMotorTest = async (id: string) => {
    const res = await api.deleteMotorTest(id);
    await refreshData();
    return res;
  };

  // Self-Service Registration Mutators
  const createRegistration = async (data: Partial<PlayerRegistration>) => {
    const created = await api.createRegistration(data);
    setDatabase((prev) => ({
      ...prev,
      playerRegistrations: [created, ...(prev.playerRegistrations || [])],
    }));
    return created;
  };

  const updateRegistration = async (id: string, updates: Partial<PlayerRegistration>) => {
    const updated = await api.updateRegistration(id, updates);
    setDatabase((prev) => ({
      ...prev,
      playerRegistrations: (prev.playerRegistrations || []).map((r) =>
        r.id === id ? updated : r
      ),
    }));
    return updated;
  };

  const approveRegistration = async (
    id: string,
    options: { teamId: string; adminNotes?: string; reviewerName: string; overrideDuplicate?: boolean }
  ) => {
    const result = await api.approveRegistration(id, options);
    setDatabase((prev) => ({
      ...prev,
      players: [...prev.players, result.player],
      playerRegistrations: (prev.playerRegistrations || []).map((r) =>
        r.id === id ? result.registration : r
      ),
    }));
    return result;
  };

  const rejectRegistration = async (
    id: string,
    options: { reason: string; reviewerName: string }
  ) => {
    const result = await api.rejectRegistration(id, options);
    setDatabase((prev) => ({
      ...prev,
      playerRegistrations: (prev.playerRegistrations || []).map((r) =>
        r.id === id ? result.registration : r
      ),
    }));
    return result.registration;
  };

  const requestRevisionRegistration = async (
    id: string,
    options: { notes: string; reviewerName: string }
  ) => {
    const result = await api.requestRevisionRegistration(id, options);
    setDatabase((prev) => ({
      ...prev,
      playerRegistrations: (prev.playerRegistrations || []).map((r) =>
        r.id === id ? result.registration : r
      ),
    }));
    return result.registration;
  };

  const deleteRegistration = async (id: string) => {
    const ok = await api.deleteRegistration(id);
    if (ok) {
      setDatabase((prev) => ({
        ...prev,
        playerRegistrations: (prev.playerRegistrations || []).filter((r) => r.id !== id),
      }));
    }
    return ok;
  };

  const checkDuplicatePlayer = async (fullName: string, birthDate: string) => {
    return api.checkDuplicatePlayer(fullName, birthDate);
  };

  // Filtered views (safely guarded against undefined database keys)
  const players = useMemo(() => database?.players || [], [database?.players]);
  const activePlayers = useMemo(() => players.filter((p) => p && p.status === 'active'), [players]);
  const archivedPlayers = useMemo(() => players.filter((p) => p && p.status === 'archived'), [players]);
  const teams = useMemo(() => database?.teams || [], [database?.teams]);
  const sessions = useMemo(() => database?.trainingSessions || [], [database?.trainingSessions]);
  const attendanceRecords = useMemo(() => database?.attendanceRecords || [], [database?.attendanceRecords]);
  const trainingLoads = useMemo(() => database?.trainingLoadRecords || [], [database?.trainingLoadRecords]);
  const evaluations = useMemo(() => database?.evaluations || [], [database?.evaluations]);
  const motorTests = useMemo(() => database?.motorTests || [], [database?.motorTests]);
  const motorTestResults = useMemo(() => database?.motorTestResults || [], [database?.motorTestResults]);
  const ltadGoals = useMemo(() => database?.ltadGoals || [], [database?.ltadGoals]);
  const promotionReviews = useMemo(() => database?.promotionReviews || [], [database?.promotionReviews]);
  const registrations = useMemo(
    () => database.playerRegistrations || [],
    [database.playerRegistrations]
  );
  const pendingRegistrationsCount = useMemo(
    () => (registrations || []).filter((r) => r && r.status === 'pending').length,
    [registrations]
  );

  // Parent Portal Entities
  const parentInviteCodes = useMemo(
    () => database.parentInviteCodes || [],
    [database.parentInviteCodes]
  );
  const parentLinkRequests = useMemo(
    () => database.parentLinkRequests || [],
    [database.parentLinkRequests]
  );
  const parentAuditLogs = useMemo(
    () => database.parentAuditLogs || [],
    [database.parentAuditLogs]
  );
  const childIdentityChangeRequests = useMemo(
    () => database.childIdentityChangeRequests || [],
    [database.childIdentityChangeRequests]
  );
  const pendingLinkRequestsCount = useMemo(
    () => (parentLinkRequests || []).filter((r) => r && r.status === 'pending').length,
    [parentLinkRequests]
  );
  const pendingIdentityRequestsCount = useMemo(
    () => (childIdentityChangeRequests || []).filter((r) => r && r.status === 'pending').length,
    [childIdentityChangeRequests]
  );

  // Parent Portal Mutator Implementations
  const createParentInviteCode = async (playerId: string, createdBy?: string, relationship?: string) => {
    const inv = await api.createParentInviteCode(playerId, createdBy, relationship);
    await refreshData();
    return inv;
  };

  const submitParentLinkRequest = async (data: any) => {
    const req = await api.createParentLinkRequest(data);
    await refreshData();
    return req;
  };

  const approveParentLinkRequest = async (id: string, adminName?: string) => {
    const req = await api.approveParentLinkRequest(id, adminName);
    await refreshData();
    return req;
  };

  const rejectParentLinkRequest = async (id: string, reason: string, adminName?: string) => {
    const req = await api.rejectParentLinkRequest(id, reason, adminName);
    await refreshData();
    return req;
  };

  const linkParentDirect = async (parentId: string, playerId: string, adminName?: string) => {
    const ok = await api.linkParentToPlayer(parentId, playerId, adminName);
    await refreshData();
    return ok;
  };

  const unlinkParentDirect = async (parentId: string, playerId: string, adminName?: string) => {
    const ok = await api.unlinkParentFromPlayer(parentId, playerId, adminName);
    await refreshData();
    return ok;
  };

  const parentUpdateChildBasicInfo = async (parentId: string, playerId: string, updates: any) => {
    const p = await api.parentUpdateChildBasicInfo(parentId, playerId, updates);
    await refreshData();
    return p;
  };

  const createChildIdentityChangeRequest = async (data: any) => {
    const req = await api.createChildIdentityChangeRequest(data);
    await refreshData();
    return req;
  };

  const approveChildIdentityChangeRequest = async (id: string, adminName?: string) => {
    const req = await api.approveChildIdentityChangeRequest(id, adminName);
    await refreshData();
    return req;
  };

  const rejectChildIdentityChangeRequest = async (id: string, adminNotes: string, adminName?: string) => {
    const req = await api.rejectChildIdentityChangeRequest(id, adminNotes, adminName);
    await refreshData();
    return req;
  };

  const registerParentUser = async (data: any) => {
    const res = await api.registerParent(data);
    await refreshData();
    return res;
  };

  const fetchParentAuditLogs = async (playerId?: string) => {
    return api.getParentAuditLogs(playerId);
  };

  // Accurate Attendance Stats per Player (only non-cancelled sessions that occurred)
  const getPlayerAttendanceStats = (playerId: string) => {
    const player = players.find((p) => p && p.id === playerId);
    if (!player) {
      return { totalSessions: 0, attended: 0, late: 0, excused: 0, sick: 0, absent: 0, percentage: 0, totalMinutes: 0 };
    }

    // Filter sessions applicable to player's team and completed
    const completedSessionIds = new Set(
      (sessions || [])
        .filter((s) => s && s.teamId === player.teamId && s.status === 'completed')
        .map((s) => s.id)
    );

    const playerAtts = (attendanceRecords || []).filter(
      (a) => a && a.playerId === playerId && completedSessionIds.has(a.sessionId)
    );

    let attended = 0;
    let late = 0;
    let excused = 0;
    let sick = 0;
    let absent = 0;
    let totalMinutes = 0;

    playerAtts.forEach((a) => {
      totalMinutes += a.actualMinutes || 0;
      if (a.status === 'present') attended++;
      else if (a.status === 'late') late++;
      else if (a.status === 'excused') excused++;
      else if (a.status === 'sick') sick++;
      else if (a.status === 'absent') absent++;
    });

    const totalHeld = completedSessionIds.size;
    // Hadir + Terlambat counts as participation
    const participationCount = attended + late;
    const percentage = totalHeld > 0 ? Math.round((participationCount / totalHeld) * 100) : 0;

    return {
      totalSessions: totalHeld,
      attended,
      late,
      excused,
      sick,
      absent,
      percentage,
      totalMinutes,
    };
  };

  // Accurate Training Load stats per Player
  const getPlayerTrainingLoadStats = (playerId: string) => {
    const loads = (trainingLoads || []).filter((tl) => tl && tl.playerId === playerId);
    let totalLoad = 0;
    let validSessionsCount = 0;

    const recentLoads: { date: string; load: number; rpe: number | null; minutes: number }[] = [];

    // Sort by session date asc
    const sorted = [...loads].sort((a, b) => (a.sessionDate || '').localeCompare(b.sessionDate || ''));

    sorted.forEach((tl) => {
      if (tl && tl.trainingLoad !== null && tl.trainingLoad !== undefined && tl.trainingLoad > 0) {
        totalLoad += tl.trainingLoad;
        validSessionsCount++;
        recentLoads.push({
          date: tl.sessionDate || '',
          load: tl.trainingLoad,
          rpe: tl.rpe,
          minutes: tl.actualDurationMinutes || 0,
        });
      }
    });

    const averageLoad = validSessionsCount > 0 ? Math.round(totalLoad / validSessionsCount) : 0;

    // Group into weekly loads
    const weeklyMap = new Map<string, number>();
    recentLoads.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      // Week label: "W-MM/DD"
      const weekLabel = `Tgl ${d.getDate()}/${d.getMonth() + 1}`;
      weeklyMap.set(weekLabel, (weeklyMap.get(weekLabel) || 0) + item.load);
    });

    const weeklyAverages = Array.from(weeklyMap.entries()).map(([weekLabel, load]) => ({
      weekLabel,
      totalLoad: load,
    }));

    return {
      totalLoad,
      averageLoad,
      completedSessionsCount: validSessionsCount,
      weeklyAverages,
      recentLoads,
    };
  };

  return (
    <DataContext.Provider
      value={{
        database,
        isLoading,
        error,
        refreshData,
        seedDemo,
        resetData,
        selectedTeamId,
        setSelectedTeamId,
        selectedDateRange,
        setSelectedDateRange,
        selectedBirthYear,
        setSelectedBirthYear,
        searchQuery,
        setSearchQuery,
        players,
        activePlayers,
        archivedPlayers,
        teams,
        sessions,
        attendanceRecords,
        trainingLoads,
        evaluations,
        motorTests,
        motorTestResults,
        ltadGoals,
        promotionReviews,
        matches: database.matches || [],
        createPlayer,
        updatePlayer,
        archivePlayer,
        deletePlayer,
        importPlayersCsv,
        createSession,
        updateSession,
        deleteSession,
        saveAttendanceBatch,
        saveTrainingLoadBatch,
        saveEvaluation,
        deleteEvaluation,
        saveMotorTestResult,
        togglePublishMotorTestResult,
        deleteMotorTestResult,
        saveLtadGoal,
        deleteLtadGoal,
        savePromotionReview,
        deletePromotionReview,
        registrations,
        pendingRegistrationsCount,
        createRegistration,
        updateRegistration,
        approveRegistration,
        rejectRegistration,
        requestRevisionRegistration,
        deleteRegistration,
        checkDuplicatePlayer,
        createTeam,
        updateTeam,
        deleteTeam,
        createMotorTest,
        updateMotorTest,
        deleteMotorTest,
        getPlayerAttendanceStats,
        getPlayerTrainingLoadStats,
        parentInviteCodes,
        parentLinkRequests,
        parentAuditLogs,
        childIdentityChangeRequests,
        pendingLinkRequestsCount,
        pendingIdentityRequestsCount,
        createParentInviteCode,
        submitParentLinkRequest,
        approveParentLinkRequest,
        rejectParentLinkRequest,
        linkParentDirect,
        unlinkParentDirect,
        parentUpdateChildBasicInfo,
        createChildIdentityChangeRequest,
        approveChildIdentityChangeRequest,
        rejectChildIdentityChangeRequest,
        registerParentUser,
        fetchParentAuditLogs,
        injectRegisteredPlayerAndUser,
        syncClientDataToServer,
        restoreAllData,
        getRecoverySnapshotInfo,
        restoreOfficial20Players,
        deleteTestPlayers,
        restoreBackup,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
