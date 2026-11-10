import {
  AcademyDatabase,
  AttendanceRecord,
  LtadGoal,
  MotorTestResult,
  Player,
  PromotionReview,
  TechnicalTacticalEvaluation,
  TrainingLoadRecord,
  TrainingSession,
  User,
  Team,
  MotorTest,
  PlayerRegistration,
  ParentInviteCode,
  ParentLinkRequest,
  ParentAuditLog,
  ChildIdentityChangeRequest,
} from '../types/database.ts';
import { AiSportsScientistResult } from '../types/sportsScience.ts';
import { safeStorage } from '../utils/safeStorage.ts';

export const LOCAL_STORAGE_KEY = 'cfa_database_cache';

export function clearDatabaseCache(): void {
  safeStorage.removeItem(LOCAL_STORAGE_KEY);
  safeStorage.removeItem('cfa_player_registrations');
  safeStorage.removeItem('cfa_player_registration_draft');
}

export function safeSetDatabaseCache(data: any, forceClear = false): void {
  try {
    safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Unable to persist database to cache (quota or disabled):', err);
  }
}

export const AUTH_TOKEN_KEY = 'cfa_auth_token_v1';
export const AUTH_USER_KEY = 'cfa_current_user_id';
export const AUTH_USER_OBJECT_KEY = 'cfa_current_user_object';

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    let token = safeStorage.getItem(AUTH_TOKEN_KEY);
    let userId = safeStorage.getItem(AUTH_USER_KEY);

    // Fallback: recover from cached user object if token or userId is missing/falsy
    if (!token || !userId || token === 'undefined' || token === 'null' || userId === 'undefined' || userId === 'null') {
      try {
        const savedUserStr = safeStorage.getItem(AUTH_USER_OBJECT_KEY);
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && typeof parsed === 'object') {
            if ((!userId || userId === 'undefined' || userId === 'null') && parsed.id) {
              userId = String(parsed.id);
              safeStorage.setItem(AUTH_USER_KEY, userId);
            }
            if ((!token || token === 'undefined' || token === 'null') && parsed.sessionToken) {
              token = String(parsed.sessionToken);
              safeStorage.setItem(AUTH_TOKEN_KEY, token);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Deterministic fallback if userId is known but token wasn't cached
    if ((!token || token === 'undefined' || token === 'null') && userId && userId !== 'undefined' && userId !== 'null') {
      token = `cfa_tok_${userId}_session`;
      safeStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    if (token && token !== 'undefined' && token !== 'null') {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    if (userId && userId !== 'undefined' && userId !== 'null') {
      headers['x-user-id'] = userId.trim();
    }
  }
  return headers;
}

export async function parseApiResponse<T = any>(
  res: Response,
  defaultErrorMsg = 'Terjadi kesalahan pada komunikasi server'
): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      const message = err.error || err.message || `${defaultErrorMsg} (Kode: ${res.status})`;
      const errorObj = new Error(message);
      (errorObj as any).status = res.status;
      (errorObj as any).code = err.code || (res.status === 401 ? 'UNAUTHORIZED' : undefined);
      throw errorObj;
    }
    const textSnippet = await res.text().catch(() => '');
    console.error(`[API HTTP ${res.status}] Expected JSON, received ${contentType}:`, textSnippet.slice(0, 200));
    throw new Error(
      `Layanan backend mengembalikan status ${res.status} (${res.statusText || 'Error non-JSON'}). Silakan coba sesaat lagi.`
    );
  }

  if (!isJson) {
    const textSnippet = await res.text().catch(() => '');
    console.error(`[API Non-JSON Response] Content-Type: ${contentType}`, textSnippet.slice(0, 200));
    throw new Error(
      'Server tidak mengembalikan respons data JSON yang valid. Pastikan rute API backend terhubung.'
    );
  }

  try {
    return (await res.json()) as T;
  } catch (err: any) {
    throw new Error(`Gagal memproses data JSON dari server: ${err.message}`);
  }
}

export const api = {
  // --- Public & Auth Methods ---
  async getPublicAcademyInfo() {
    const res = await fetch('/api/public/academy-info');
    if (!res.ok) throw new Error('Gagal memuat informasi akademi.');
    return res.json();
  },

  async getAdminSetupStatus(): Promise<{ isConfigured: boolean }> {
    const res = await fetch('/api/auth/admin-setup-status');
    if (!res.ok) return { isConfigured: true };
    return res.json();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse<{ user: User }>(res, 'Gagal memverifikasi status autentikasi');
  },

  async setupInitialAdmin(data: {
    name: string;
    email: string;
    password?: string;
    setupKey: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/setup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse<{ user: User; token: string }>(
      res,
      'Gagal mengatur akun administrator pertama.'
    );
    safeStorage.setItem(AUTH_TOKEN_KEY, result.token);
    safeStorage.setItem(AUTH_USER_KEY, result.user.id);
    return result;
  },

  async recoverOfficialAdmin(): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/auth/recover-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return parseApiResponse<{ success: boolean; message: string; user: User }>(
      res,
      'Gagal memulihkan akun administrator resmi'
    );
  },

  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const result = await parseApiResponse<{ user: User; token: string }>(
      res,
      'Login gagal. Periksa email dan kata sandi Anda.'
    );
    safeStorage.setItem(AUTH_TOKEN_KEY, result.token);
    safeStorage.setItem(AUTH_USER_KEY, result.user.id);
    return result;
  },

  async registerParentAccount(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    relationship?: string;
    inviteCode?: string;
    avatarUrl?: string;
  }): Promise<{ user: User; token: string; linkedPlayerId?: string }> {
    const res = await fetch('/api/auth/register-parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse<{ user: User; token: string; linkedPlayerId?: string }>(
      res,
      'Gagal mendaftar akun orang tua/wali.'
    );
    safeStorage.setItem(AUTH_TOKEN_KEY, result.token);
    safeStorage.setItem(AUTH_USER_KEY, result.user.id);
    return result;
  },

  async registerCoach(data: {
    name: string;
    email: string;
    password: string;
    role?: 'head_coach' | 'assistant_coach';
    assignedTeamId?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse<{ user: User; token: string }>(
      res,
      'Gagal mendaftarkan akun pelatih.'
    );
    safeStorage.setItem(AUTH_TOKEN_KEY, result.token);
    safeStorage.setItem(AUTH_USER_KEY, result.user.id);
    return result;
  },

  async registerParentWithAthlete(data: {
    parent: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      relationship?: string;
      avatarUrl?: string;
    };
    athlete?: {
      fullName: string;
      nickname: string;
      birthDate: string;
      birthPlace?: string;
      gender?: 'Laki-laki' | 'Perempuan';
      photoUrl?: string;
      address?: string;
      school?: string;
      schoolGrade?: string;
      primaryPosition: string;
      secondaryPosition?: string;
      dominantFoot?: any;
      playingExperience?: string;
      previousClub?: string;
      additionalNotes?: string;
    };
    athletes?: Array<{
      fullName: string;
      nickname: string;
      birthDate: string;
      birthPlace?: string;
      gender?: 'Laki-laki' | 'Perempuan';
      photoUrl?: string;
      address?: string;
      school?: string;
      schoolGrade?: string;
      primaryPosition: string;
      secondaryPosition?: string;
      dominantFoot?: any;
      playingExperience?: string;
      previousClub?: string;
      additionalNotes?: string;
    }>;
  }): Promise<{
    user: User;
    player: Player;
    players?: Player[];
    registration: PlayerRegistration;
    registrations?: PlayerRegistration[];
    token: string;
  }> {
    const res = await fetch('/api/auth/register-parent-athlete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse<{
      user: User;
      player: Player;
      players?: Player[];
      registration: PlayerRegistration;
      registrations?: PlayerRegistration[];
      token: string;
    }>(res, 'Gagal mendaftarkan akun wali murid dan data atlet.');
    safeStorage.setItem(AUTH_TOKEN_KEY, result.token);
    safeStorage.setItem(AUTH_USER_KEY, result.user.id);
    return result;
  },

  async addAthleteForParent(data: {
    fullName: string;
    nickname: string;
    birthDate: string;
    birthPlace?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    photoUrl?: string;
    address?: string;
    school?: string;
    schoolGrade?: string;
    primaryPosition: string;
    secondaryPosition?: string;
    dominantFoot?: any;
    playingExperience?: string;
    previousClub?: string;
    additionalNotes?: string;
  }): Promise<{ player: Player; user: User }> {
    const res = await fetch('/api/parent/add-athlete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return parseApiResponse<{ player: Player; user: User }>(res, 'Gagal menambahkan atlet baru.');
  },

  async approveParentAccount(userId: string): Promise<User> {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/approve-parent`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menyetujui akun orang tua.');
    }
    const data = await res.json();
    return data.user;
  },

  async rejectParentAccount(userId: string, reason: string): Promise<User> {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/reject-parent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menolak akun orang tua.');
    }
    const data = await res.json();
    return data.user;
  },

  async getDatabase(): Promise<AcademyDatabase> {
    try {
      const res = await fetch('/api/database', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        safeSetDatabaseCache(data);
        return data;
      }
    } catch (e) {
      console.warn('API fetch failed, falling back to cached local storage', e);
    }

    const cached = safeStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    throw new Error('Gagal memuat basis data akademi dari server.');
  },

  async syncClientDataToServer(clientData: Partial<AcademyDatabase>): Promise<{
    success: boolean;
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredUsersCount: number;
    database: AcademyDatabase;
  }> {
    const res = await fetch('/api/database/sync-from-client', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(clientData),
    });
    if (!res.ok) throw new Error('Gagal menyinkronkan data cache lokal ke server.');
    const result = await res.json();
    if (result.database) {
      safeSetDatabaseCache(result.database);
    }
    return result;
  },

  async getDatabaseHealthStats(): Promise<{
    playersCount: number;
    registrationsCount: number;
    usersCount: number;
    lastUpdated: string | null;
  }> {
    const res = await fetch('/api/database/health-stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memeriksa status basis data.');
    return res.json();
  },

  async seedDemo(): Promise<AcademyDatabase> {
    const res = await fetch('/api/seed-demo', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat data demo.');
    const result = await res.json();
    safeSetDatabaseCache(result.database);
    return result.database;
  },

  async getRecoverySnapshotInfo(): Promise<{
    hasSnapshot: boolean;
    playersCount: number;
    registrationsCount: number;
    usersCount: number;
    lastSaved: string | null;
    samplePlayerNames: string[];
  }> {
    try {
      const res = await fetch('/api/database/recovery-snapshot-info', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return {
          hasSnapshot: false,
          playersCount: 0,
          registrationsCount: 0,
          usersCount: 0,
          lastSaved: null,
          samplePlayerNames: [],
        };
      }
      return await res.json();
    } catch {
      return {
        hasSnapshot: false,
        playersCount: 0,
        registrationsCount: 0,
        usersCount: 0,
        lastSaved: null,
        samplePlayerNames: [],
      };
    }
  },

  async restoreAllData(): Promise<{
    success: boolean;
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredUsersCount: number;
    database: AcademyDatabase;
    message?: string;
  }> {
    const res = await fetch('/api/database/restore-all-data', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memulihkan seluruh data akademi.');
    const result = await res.json();
    if (result.database) {
      safeSetDatabaseCache(result.database);
    }
    return result;
  },

  async restoreOfficial20Players(): Promise<AcademyDatabase> {
    const res = await this.restoreAllData();
    return res.database;
  },

  async deleteTestPlayers(): Promise<{ count: number; remainingPlayers: number; database: AcademyDatabase }> {
    const res = await fetch('/api/database/delete-test-players', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal membersihkan data uji coba.');
    const result = await res.json();
    if (result.database) {
      safeSetDatabaseCache(result.database);
    }
    return result;
  },

  async restoreBackup(
    backupData: any,
    mode: 'replace' | 'merge' = 'replace'
  ): Promise<{
    success: boolean;
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredSessionsCount: number;
    restoredUsersCount: number;
    database: AcademyDatabase;
  }> {
    const res = await fetch('/api/database/restore-backup', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ backup: backupData, mode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memulihkan berkas cadangan.');
    }
    const result = await res.json();
    if (result.database) {
      safeSetDatabaseCache(result.database, true);
    }
    return result;
  },

  async resetData(): Promise<AcademyDatabase> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal mereset data.');
    const result = await res.json();
    clearDatabaseCache();
    safeSetDatabaseCache(result.database, true);
    return result.database;
  },

  // --- Players ---
  async createPlayer(playerData: Partial<Player>): Promise<Player> {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(playerData),
    });
    return parseApiResponse<Player>(res, 'Gagal menambahkan pemain');
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<Player>(res, 'Gagal memperbarui data pemain');
  },

  async archivePlayer(id: string, archived: boolean): Promise<Player> {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ archived }),
    });
    return parseApiResponse<Player>(res, 'Gagal mengubah status arsip pemain');
  },

  async deletePlayer(id: string): Promise<boolean> {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus data pemain dari server');
    }
    try {
      const cachedStr = safeStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed.players)) {
          parsed.players = parsed.players.filter((p: any) => p && p.id !== id);
          safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore
    }
    return true;
  },

  async importPlayersCsv(players: Partial<Player>[]): Promise<{ count: number; players: Player[] }> {
    const res = await fetch('/api/players/import-csv', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ players }),
    });
    return parseApiResponse<{ count: number; players: Player[] }>(res, 'Gagal mengimpor daftar pemain');
  },

  // --- Sessions ---
  async getSessions(): Promise<TrainingSession[]> {
    const res = await fetch('/api/sessions', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse<TrainingSession[]>(res, 'Gagal memuat daftar sesi latihan');
  },

  async createSession(sessionData: Partial<TrainingSession>): Promise<TrainingSession> {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionData),
    });
    return parseApiResponse<TrainingSession>(res, 'Gagal membuat sesi latihan');
  },

  async updateSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession> {
    const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<TrainingSession>(res, 'Gagal memperbarui sesi latihan');
  },

  async deleteSession(id: string): Promise<boolean> {
    const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Attendance ---
  async batchSaveAttendance(
    sessionId: string,
    records: Array<{
      playerId: string;
      status: AttendanceRecord['status'];
      actualMinutes: number;
      notes?: string;
    }>
  ): Promise<AttendanceRecord[]> {
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, records }),
    });
    return parseApiResponse<AttendanceRecord[]>(res, 'Gagal menyimpan kehadiran');
  },

  // --- Training Load ---
  async batchSaveTrainingLoad(
    sessionId: string,
    records: Array<{
      playerId: string;
      actualDurationMinutes: number;
      rpe: number | null;
      playerResponseNotes?: string;
    }>
  ): Promise<TrainingLoadRecord[]> {
    const res = await fetch('/api/training-load/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, records }),
    });
    return parseApiResponse<TrainingLoadRecord[]>(res, 'Gagal menyimpan beban latihan');
  },

  // --- Evaluations ---
  async saveEvaluation(
    data: Partial<TechnicalTacticalEvaluation>,
    id?: string
  ): Promise<TechnicalTacticalEvaluation> {
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, id }),
    });
    return parseApiResponse<TechnicalTacticalEvaluation>(res, 'Gagal menyimpan evaluasi teknik & taktik');
  },

  async deleteEvaluation(id: string): Promise<boolean> {
    const res = await fetch(`/api/evaluations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Motor Tests ---
  async saveMotorTestResult(
    data: Partial<MotorTestResult>,
    id?: string
  ): Promise<MotorTestResult> {
    const res = await fetch('/api/motor-test-results', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, id }),
    });
    if (!res.ok) throw new Error('Gagal menyimpan hasil tes fisik/motorik');
    return res.json();
  },

  async togglePublishMotorTestResult(id: string, published: boolean): Promise<MotorTestResult> {
    const res = await fetch(`/api/motor-test-results/${encodeURIComponent(id)}/publish`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ published }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui status publikasi hasil tes');
    return res.json();
  },

  async batchPublishMotorTestResults(ids: string[], published: boolean): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/motor-test-results/batch-publish', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids, published }),
    });
    if (!res.ok) throw new Error('Gagal memublikasikan kumpulan hasil tes');
    return res.json();
  },

  async deleteMotorTestResult(id: string): Promise<boolean> {
    const res = await fetch(`/api/motor-test-results/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- LTAD Goals ---
  async saveLtadGoal(data: Partial<LtadGoal>, id?: string): Promise<LtadGoal> {
    const res = await fetch('/api/ltad-goals', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, id }),
    });
    return parseApiResponse<LtadGoal>(res, 'Gagal menyimpan target LTAD');
  },

  async deleteLtadGoal(id: string): Promise<boolean> {
    const res = await fetch(`/api/ltad-goals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Promotion Reviews ---
  async savePromotionReview(
    data: Partial<PromotionReview>,
    id?: string
  ): Promise<PromotionReview> {
    const res = await fetch('/api/promotion-reviews', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...data, id }),
    });
    return parseApiResponse<PromotionReview>(res, 'Gagal menyimpan evaluasi promosi');
  },

  async deletePromotionReview(id: string): Promise<boolean> {
    const res = await fetch(`/api/promotion-reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Users & Coaches ---
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse<User[]>(res, 'Gagal mengambil daftar akun pengguna');
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<User>(res, 'Gagal memperbarui profil pengguna');
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return parseApiResponse<User>(res, 'Gagal menambahkan pengguna/pelatih');
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Teams ---
  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    const res = await fetch(`/api/teams/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<Team>(res, 'Gagal memperbarui data tim');
  },

  async createTeam(teamData: Partial<Team>): Promise<Team> {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData),
    });
    return parseApiResponse<Team>(res, 'Gagal menambahkan tim');
  },

  async deleteTeam(id: string): Promise<boolean> {
    const res = await fetch(`/api/teams/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Motor Tests ---
  async createMotorTest(testData: Partial<MotorTest>): Promise<MotorTest> {
    const res = await fetch('/api/motor-tests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testData),
    });
    return parseApiResponse<MotorTest>(res, 'Gagal menambahkan tes motorik');
  },

  async updateMotorTest(id: string, updates: Partial<MotorTest>): Promise<MotorTest> {
    const res = await fetch(`/api/motor-tests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<MotorTest>(res, 'Gagal memperbarui tes motorik');
  },

  async deleteMotorTest(id: string): Promise<boolean> {
    const res = await fetch(`/api/motor-tests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- Self-Service Player Registrations ---
  async getRegistrations(): Promise<PlayerRegistration[]> {
    const res = await fetch('/api/registrations', {
      headers: getAuthHeaders(),
    });
    return parseApiResponse<PlayerRegistration[]>(res, 'Gagal mengambil data pendaftaran');
  },

  async getRegistrationById(id: string): Promise<PlayerRegistration> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Pendaftaran tidak ditemukan');
    return res.json();
  },

  async checkDuplicatePlayer(fullName: string, birthDate: string): Promise<{ isDuplicate: boolean; matchedPlayer?: Player; message?: string }> {
    const params = new URLSearchParams({ fullName, birthDate });
    const res = await fetch(`/api/registrations/check-duplicate?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memeriksa data ganda');
    return res.json();
  },

  async createRegistration(data: Partial<PlayerRegistration>): Promise<PlayerRegistration> {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return parseApiResponse<PlayerRegistration>(res, 'Gagal mengirim formulir pendaftaran');
  },

  async updateRegistration(id: string, updates: Partial<PlayerRegistration>): Promise<PlayerRegistration> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return parseApiResponse<PlayerRegistration>(res, 'Gagal memperbarui formulir pendaftaran');
  },

  async approveRegistration(
    id: string,
    options: { teamId: string; adminNotes?: string; reviewerName: string; overrideDuplicate?: boolean }
  ): Promise<{ success: boolean; registration: PlayerRegistration; player: Player }> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });
    return parseApiResponse<{ success: boolean; registration: PlayerRegistration; player: Player }>(
      res,
      'Gagal menyetujui pendaftaran'
    );
  },

  async rejectRegistration(
    id: string,
    options: { reason: string; reviewerName: string }
  ): Promise<{ success: boolean; registration: PlayerRegistration }> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });
    return parseApiResponse<{ success: boolean; registration: PlayerRegistration }>(
      res,
      'Gagal menolak pendaftaran'
    );
  },

  async requestRevisionRegistration(
    id: string,
    options: { notes: string; reviewerName: string }
  ): Promise<{ success: boolean; registration: PlayerRegistration }> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}/request-revision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal meminta perbaikan pendaftaran');
    }
    return res.json();
  },

  async deleteRegistration(id: string): Promise<boolean> {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // --- PARENT PORTAL METHODS ---
  async getParentInviteCodes(): Promise<ParentInviteCode[]> {
    const res = await fetch('/api/parent/invite-codes', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createParentInviteCode(playerId: string, createdBy: string = 'Admin', relationship: string = 'Wali'): Promise<ParentInviteCode> {
    const res = await fetch('/api/parent/invite-codes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ playerId, createdBy, relationship }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal membuat kode undangan');
    }
    return res.json();
  },

  async getParentLinkRequests(): Promise<ParentLinkRequest[]> {
    const res = await fetch('/api/parent/link-requests', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createParentLinkRequest(data: {
    parentId: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    relationship: string;
    playerId: string;
    inviteCodeUsed?: string;
    notes?: string;
  }): Promise<ParentLinkRequest> {
    const res = await fetch('/api/parent/link-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengirim permintaan tautan');
    }
    return res.json();
  },

  async approveParentLinkRequest(id: string, adminName: string = 'Admin'): Promise<ParentLinkRequest> {
    const res = await fetch(`/api/parent/link-requests/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menyetujui permintaan tautan');
    }
    return res.json();
  },

  async rejectParentLinkRequest(id: string, reason: string, adminName: string = 'Admin'): Promise<ParentLinkRequest> {
    const res = await fetch(`/api/parent/link-requests/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, adminName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menolak permintaan tautan');
    }
    return res.json();
  },

  async linkParentToPlayer(parentId: string, playerId: string, adminName: string = 'Admin'): Promise<boolean> {
    const res = await fetch('/api/parent/direct-link', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parentId, playerId, adminName }),
    });
    return res.ok;
  },

  async unlinkParentFromPlayer(parentId: string, playerId: string, adminName: string = 'Admin'): Promise<boolean> {
    const res = await fetch('/api/parent/direct-unlink', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parentId, playerId, adminName }),
    });
    return res.ok;
  },

  async parentUpdateChildBasicInfo(parentId: string, playerId: string, updates: any): Promise<Player> {
    const res = await fetch(`/api/parent/child/${encodeURIComponent(playerId)}/basic-info`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ parentId, updates }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui data anak');
    }
    return res.json();
  },

  async getChildIdentityChangeRequests(): Promise<ChildIdentityChangeRequest[]> {
    const res = await fetch('/api/parent/identity-requests', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createChildIdentityChangeRequest(data: {
    parentId: string;
    playerId: string;
    field: string;
    proposedValue: string;
    reason: string;
  }): Promise<ChildIdentityChangeRequest> {
    const res = await fetch('/api/parent/identity-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengajukan perubahan identitas');
    }
    return res.json();
  },

  async approveChildIdentityChangeRequest(id: string, adminName: string = 'Admin'): Promise<ChildIdentityChangeRequest> {
    const res = await fetch(`/api/parent/identity-requests/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menyetujui pengajuan');
    }
    return res.json();
  },

  async rejectChildIdentityChangeRequest(id: string, adminNotes: string, adminName: string = 'Admin'): Promise<ChildIdentityChangeRequest> {
    const res = await fetch(`/api/parent/identity-requests/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminNotes, adminName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menolak pengajuan');
    }
    return res.json();
  },

  async getParentAuditLogs(playerId?: string): Promise<ParentAuditLog[]> {
    const url = playerId ? `/api/parent/audit-logs?playerId=${encodeURIComponent(playerId)}` : '/api/parent/audit-logs';
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async registerParent(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    relationship?: string;
    inviteCode?: string;
    avatarUrl?: string;
  }): Promise<{ user: User; linkedPlayerId?: string }> {
    const res = await fetch('/api/parent/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mendaftar akun orang tua');
    }
    return res.json();
  },

  async calculateAiSportsScientist(input: {
    nama: string;
    usia: number;
    cluster: string;
    durationMinutes: number;
    rpe: number;
    avgHr?: number | null;
  }): Promise<AiSportsScientistResult> {
    const res = await fetch('/api/sports-science/ai-calculator', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghitung laporan AI Sports Scientist');
    }
    return res.json();
  },
};

