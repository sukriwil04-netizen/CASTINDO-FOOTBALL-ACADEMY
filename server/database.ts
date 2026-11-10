import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AcademyDatabase,
  AttendanceRecord,
  LtadGoal,
  MotorTest,
  MotorTestResult,
  Player,
  PlayerRegistration,
  PromotionReview,
  TechnicalTacticalEvaluation,
  TrainingLoadRecord,
  TrainingSession,
  User,
  Team,
  ParentInviteCode,
  ParentLinkRequest,
  ParentAuditLog,
  ChildIdentityChangeRequest,
  MatchRecord,
} from '../src/types/database.ts';
import {
  DEFAULT_USERS,
  DEFAULT_TEAMS,
  OFFICIAL_CFA_20_PLAYERS,
  OFFICIAL_CFA_20_REGISTRATIONS,
  OFFICIAL_CFA_PARENT_USERS,
  createEmptyDatabase,
} from '../src/utils/initialData.ts';
import { calculateAgeGroup } from '../src/utils/ageGroup.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'castindo_db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'castindo_db.backup.json');
const DB_BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'castindo_registered_history_snapshot.json');

// Ensure data and backup directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_BACKUPS_DIR)) {
  fs.mkdirSync(DB_BACKUPS_DIR, { recursive: true });
}

export class DatabaseStore {
  private static instance: DatabaseStore;
  private db: AcademyDatabase;

  private constructor() {
    this.db = this.load();
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private validateAndSanitizeDatabase(parsed: any): AcademyDatabase | null {
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.players)) parsed.players = [];
    if (!Array.isArray(parsed.playerRegistrations)) parsed.playerRegistrations = [];
    if (!Array.isArray(parsed.teams) || parsed.teams.length === 0) {
      parsed.teams = [...DEFAULT_TEAMS];
    } else {
      DEFAULT_TEAMS.forEach((dt) => {
        const existing = parsed.teams.find((t: any) => t.id === dt.id);
        if (!existing) {
          parsed.teams.push({ ...dt, active: true });
        } else if (existing.active === false) {
          existing.active = true;
        }
      });
    }
    if (!Array.isArray(parsed.trainingSessions)) parsed.trainingSessions = [];
    if (!Array.isArray(parsed.attendanceRecords)) parsed.attendanceRecords = [];
    if (!Array.isArray(parsed.trainingLoadRecords)) parsed.trainingLoadRecords = [];
    if (!Array.isArray(parsed.evaluations)) parsed.evaluations = [];
    if (!Array.isArray(parsed.motorTests)) parsed.motorTests = [];
    if (!Array.isArray(parsed.motorTestResults)) parsed.motorTestResults = [];
    if (!Array.isArray(parsed.ltadGoals)) parsed.ltadGoals = [];
    if (!Array.isArray(parsed.promotionReviews)) parsed.promotionReviews = [];
    if (!Array.isArray(parsed.parentInviteCodes)) parsed.parentInviteCodes = [];
    if (!Array.isArray(parsed.parentLinkRequests)) parsed.parentLinkRequests = [];
    if (!Array.isArray(parsed.parentAuditLogs)) parsed.parentAuditLogs = [];
    if (!Array.isArray(parsed.childIdentityChangeRequests)) parsed.childIdentityChangeRequests = [];
    if (!Array.isArray(parsed.matches)) parsed.matches = [];
    if (!parsed.meta) {
      parsed.meta = { lastUpdated: new Date().toISOString(), version: '1.0.0', adminSetupCompleted: true };
    }

    // Filter out obsolete legacy dummy coaches and mock accounts
    if (Array.isArray(parsed.users)) {
      parsed.users = parsed.users.filter((u: any) => {
        if (!u || !u.id) return false;
        if (u.id === 'usr-coach-1' || u.id === 'usr-coach-2') return false;
        if (typeof u.email === 'string') {
          const lower = u.email.trim().toLowerCase();
          if (lower.endsWith('@example.com') || lower.endsWith('@castindo.id')) return false;
        }
        if (typeof u.id === 'string' && u.id.startsWith('usr-parent-cfa-2026-')) return false;
        return true;
      });
    }

    // Ensure users array exists and always permanently preserves the master Administrator account
    if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
      parsed.users = [...DEFAULT_USERS.filter((u) => u.role === 'admin')];
    } else {
      // 1. Preserve Admin
      let adminUser = parsed.users.find(
        (u: User) =>
          u && (
            u.role === 'admin' ||
            (typeof u.email === 'string' && u.email.trim().toLowerCase() === 'sukriwil04@gmail.com') ||
            u.id === 'usr-1'
          )
      );
      if (adminUser) {
        adminUser.id = 'usr-1';
        adminUser.name = 'Mohammad Wildan Kemal Pasha';
        adminUser.email = 'sukriwil04@gmail.com';
        adminUser.role = 'admin';
        adminUser.status = 'approved';
        if (!adminUser.password) {
          adminUser.password = 'AdminCastindo2026!';
        }
        if (!adminUser.sessionToken) {
          adminUser.sessionToken = 'cfa_tok_usr-1_admin_2026';
        }
      } else {
        adminUser = {
          id: 'usr-1',
          name: 'Mohammad Wildan Kemal Pasha',
          email: 'sukriwil04@gmail.com',
          role: 'admin',
          status: 'approved',
          password: 'AdminCastindo2026!',
          assignedTeamId: 'team-b',
          sessionToken: 'cfa_tok_usr-1_admin_2026',
          avatarUrl: undefined,
          createdAt: '2026-08-01T08:00:00.000Z',
          approvedAt: '2026-08-01T08:00:00.000Z',
          approvedBy: 'Master Administrator',
        };
        parsed.users.unshift(adminUser);
      }

      // 2. Ensure all users have valid session tokens
      parsed.users.forEach((u: User) => {
        if (!u.sessionToken) {
          u.sessionToken = `cfa_tok_${u.id}_session`;
        }
        if (!u.status) {
          u.status = 'approved';
        }
      });
    }

    return parsed as AcademyDatabase;
  }

  private load(): AcademyDatabase {
    // 1. Try reading primary database file
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          const sanitized = this.validateAndSanitizeDatabase(parsed);
          if (sanitized) {
            // Keep automated backup in sync
            try {
              fs.writeFileSync(DB_BACKUP_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
            } catch {
              // ignore backup write failure on read
            }
            return sanitized;
          }
        }
      }
    } catch (err) {
      console.error('[DatabaseStore] Error reading primary castindo_db.json, attempting backup recovery:', err);
    }

    // 2. Try recovering from backup database file
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        const rawBackup = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
        if (rawBackup && rawBackup.trim()) {
          const parsedBackup = JSON.parse(rawBackup);
          const sanitizedBackup = this.validateAndSanitizeDatabase(parsedBackup);
          if (sanitizedBackup) {
            console.log('[DatabaseStore] Successfully recovered database from backup file.');
            this.save(sanitizedBackup);
            return sanitizedBackup;
          }
        }
      }
    } catch (backupErr) {
      console.error('[DatabaseStore] Backup recovery failed:', backupErr);
    }

    // 3. Fallback to clean base database
    const initialDb = createEmptyDatabase();
    this.save(initialDb);
    return initialDb;
  }

  private save(data: AcademyDatabase) {
    try {
      data.meta.lastUpdated = new Date().toISOString();
      const tmpFile = `${DB_FILE}.tmp`;
      const jsonStr = JSON.stringify(data, null, 2);

      // Write atomically to temporary file
      fs.writeFileSync(tmpFile, jsonStr, 'utf-8');

      // Update backup file before replacing primary file if primary currently has content
      if (fs.existsSync(DB_FILE)) {
        try {
          fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
        } catch {
          // ignore copy error
        }
      }

      // Atomic rename
      fs.renameSync(tmpFile, DB_FILE);

      // Automatically maintain recovery snapshot of registered data
      if (
        (Array.isArray(data.players) && data.players.length > 0) ||
        (Array.isArray(data.playerRegistrations) && data.playerRegistrations.length > 0)
      ) {
        try {
          fs.writeFileSync(SNAPSHOT_FILE, jsonStr, 'utf-8');
        } catch {
          // ignore snapshot write error
        }
      }

      // Rotate snapshot to data/backups/ (keeping last 15)
      try {
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const snapshotFile = path.join(DB_BACKUPS_DIR, `castindo_db_${dateStr}.json`);
        fs.writeFileSync(snapshotFile, jsonStr, 'utf-8');

        const existingBackups = fs
          .readdirSync(DB_BACKUPS_DIR)
          .filter((f) => f.startsWith('castindo_db_') && f.endsWith('.json'))
          .sort();
        if (existingBackups.length > 15) {
          const toRemove = existingBackups.slice(0, existingBackups.length - 15);
          for (const rmFile of toRemove) {
            try {
              fs.unlinkSync(path.join(DB_BACKUPS_DIR, rmFile));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore snapshot rotation error
      }
    } catch (err) {
      console.error('[DatabaseStore] Failed to write database file:', err);
    }
  }

  public saveDatabase() {
    this.save(this.db);
  }

  public getDatabase(): AcademyDatabase {
    return this.db;
  }

  /**
   * Safely merges client-cached data (from browser localStorage) into server persistent storage.
   * This recovers any players or parent registrations without overwriting existing data.
   */
  public mergeAndRecoverClientData(clientData: Partial<AcademyDatabase>): {
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredUsersCount: number;
  } {
    let restoredPlayersCount = 0;
    let restoredRegistrationsCount = 0;
    let restoredUsersCount = 0;

    // 1. Recover Players
    if (Array.isArray(clientData.players) && clientData.players.length > 0) {
      for (const p of clientData.players) {
        if (!p || !p.id || !p.fullName) continue;
        // Ignore legacy dummy sample players
        if (p.id.startsWith('CFA-2026-') && p.registrationId?.startsWith('reg-cfa-0')) continue;
        const exists = this.db.players.some(
          (existing) =>
            existing.id === p.id ||
            (existing.fullName.toLowerCase() === p.fullName.toLowerCase() &&
              existing.birthDate === p.birthDate)
        );
        if (!exists) {
          this.db.players.push(p);
          restoredPlayersCount++;
        }
      }
    }

    // 2. Recover Player Registrations
    if (Array.isArray(clientData.playerRegistrations) && clientData.playerRegistrations.length > 0) {
      for (const r of clientData.playerRegistrations) {
        if (!r || !r.id || !r.fullName) continue;
        // Ignore legacy dummy sample registrations
        if (r.id.startsWith('reg-cfa-0')) continue;
        const exists = (this.db.playerRegistrations || []).some(
          (existing) =>
            existing.id === r.id ||
            existing.registrationNumber === r.registrationNumber ||
            (existing.fullName.toLowerCase() === r.fullName.toLowerCase() &&
              existing.birthDate === r.birthDate)
        );
        if (!exists) {
          if (!Array.isArray(this.db.playerRegistrations)) {
            this.db.playerRegistrations = [];
          }
          this.db.playerRegistrations.push(r);
          restoredRegistrationsCount++;
        }
      }
    }

    // 3. Recover Parent and Coach Users
    if (Array.isArray(clientData.users) && clientData.users.length > 0) {
      for (const u of clientData.users) {
        if (!u || !u.id || !u.email || u.role === 'admin') continue;
        // Ignore legacy dummy sample accounts
        if (u.id === 'usr-coach-1' || u.id === 'usr-coach-2') continue;
        if (typeof u.email === 'string') {
          const lower = u.email.trim().toLowerCase();
          if (lower.endsWith('@example.com') || lower.endsWith('@castindo.id')) continue;
        }
        if (typeof u.id === 'string' && u.id.startsWith('usr-parent-cfa-2026-')) continue;
        const exists = this.db.users.some(
          (existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase()
        );
        if (!exists) {
          this.db.users.push(u);
          restoredUsersCount++;
        }
      }
    }

    if (restoredPlayersCount > 0 || restoredRegistrationsCount > 0 || restoredUsersCount > 0) {
      this.save(this.db);
      console.log(
        `[DatabaseStore] Restored from client cache: ${restoredPlayersCount} players, ${restoredRegistrationsCount} registrations, ${restoredUsersCount} users.`
      );
    }

    return {
      restoredPlayersCount,
      restoredRegistrationsCount,
      restoredUsersCount,
    };
  }

  public restoreFromBackup(
    backupData: any,
    mode: 'replace' | 'merge' = 'replace'
  ): {
    success: boolean;
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredSessionsCount: number;
    restoredUsersCount: number;
    database: AcademyDatabase;
  } {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Berkas cadangan tidak valid: data harus berformat JSON objek akademi.');
    }

    // Safety snapshot before restore
    try {
      if (fs.existsSync(DB_FILE)) {
        const restoreBackup = path.join(DATA_DIR, `castindo_db.before_restore_${Date.now()}.json`);
        fs.copyFileSync(DB_FILE, restoreBackup);
      }
    } catch {
      // ignore
    }

    if (mode === 'replace') {
      const sanitized = this.validateAndSanitizeDatabase(backupData);
      if (!sanitized) {
        throw new Error('Data cadangan gagal divalidasi sebagai struktur database CFA.');
      }
      this.db = sanitized;
      this.save(this.db);
      return {
        success: true,
        restoredPlayersCount: this.db.players.length,
        restoredRegistrationsCount: (this.db.playerRegistrations || []).length,
        restoredSessionsCount: (this.db.trainingSessions || []).length,
        restoredUsersCount: this.db.users.length,
        database: this.db,
      };
    } else {
      // Merge mode
      let restoredPlayersCount = 0;
      let restoredRegistrationsCount = 0;
      let restoredSessionsCount = 0;
      let restoredUsersCount = 0;

      if (Array.isArray(backupData.players)) {
        for (const p of backupData.players) {
          if (!p || !p.id || !p.fullName) continue;
          const exists = this.db.players.some((ex) => ex.id === p.id);
          if (!exists) {
            this.db.players.push(p);
            restoredPlayersCount++;
          }
        }
      }

      if (Array.isArray(backupData.playerRegistrations)) {
        for (const r of backupData.playerRegistrations) {
          if (!r || !r.id || !r.fullName) continue;
          const exists = (this.db.playerRegistrations || []).some((ex) => ex.id === r.id);
          if (!exists) {
            this.db.playerRegistrations.push(r);
            restoredRegistrationsCount++;
          }
        }
      }

      if (Array.isArray(backupData.trainingSessions)) {
        for (const s of backupData.trainingSessions) {
          if (!s || !s.id) continue;
          const exists = (this.db.trainingSessions || []).some((ex) => ex.id === s.id);
          if (!exists) {
            this.db.trainingSessions.push(s);
            restoredSessionsCount++;
          }
        }
      }

      if (Array.isArray(backupData.users)) {
        for (const u of backupData.users) {
          if (!u || !u.id || u.role === 'admin') continue;
          const exists = this.db.users.some(
            (ex) => ex.id === u.id || ex.email?.toLowerCase() === u.email?.toLowerCase()
          );
          if (!exists) {
            this.db.users.push(u);
            restoredUsersCount++;
          }
        }
      }

      this.save(this.db);
      return {
        success: true,
        restoredPlayersCount,
        restoredRegistrationsCount,
        restoredSessionsCount,
        restoredUsersCount,
        database: this.db,
      };
    }
  }

  public resetDatabase(): AcademyDatabase {
    // Save history snapshot before clearing if players or registrations exist
    if (
      (Array.isArray(this.db.players) && this.db.players.length > 0) ||
      (Array.isArray(this.db.playerRegistrations) && this.db.playerRegistrations.length > 0)
    ) {
      try {
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
      } catch {}
    }

    // Create safety snapshot before reset
    try {
      if (fs.existsSync(DB_FILE)) {
        const resetBackup = path.join(DATA_DIR, `castindo_db.before_reset_${Date.now()}.json`);
        fs.copyFileSync(DB_FILE, resetBackup);
      }
    } catch {
      // ignore
    }
    this.db = createEmptyDatabase();
    this.save(this.db);
    return this.db;
  }

  public getRecoverySnapshotInfo(): {
    hasSnapshot: boolean;
    playersCount: number;
    registrationsCount: number;
    usersCount: number;
    lastSaved: string | null;
    samplePlayerNames: string[];
  } {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      try {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const players = Array.isArray(parsed.players) ? parsed.players : [];
          const registrations = Array.isArray(parsed.playerRegistrations) ? parsed.playerRegistrations : [];
          const users = Array.isArray(parsed.users) ? parsed.users : [];
          return {
            hasSnapshot: players.length > 0 || registrations.length > 0,
            playersCount: players.length,
            registrationsCount: registrations.length,
            usersCount: users.length,
            lastSaved: parsed.meta?.lastUpdated || null,
            samplePlayerNames: players.slice(0, 3).map((p: any) => p.fullName || p.nickname || p.id),
          };
        }
      } catch {}
    }

    return {
      hasSnapshot: false,
      playersCount: 0,
      registrationsCount: 0,
      usersCount: 0,
      lastSaved: null,
      samplePlayerNames: [],
    };
  }

  public seedDemoData(): AcademyDatabase {
    return this.db;
  }

  public restoreAllData(): {
    success: boolean;
    restoredPlayersCount: number;
    restoredRegistrationsCount: number;
    restoredUsersCount: number;
    database: AcademyDatabase;
    message?: string;
  } {
    let archiveData: AcademyDatabase | null = null;
    if (fs.existsSync(SNAPSHOT_FILE)) {
      try {
        archiveData = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
      } catch (e) {}
    }

    if (!archiveData || (!Array.isArray(archiveData.players) && !Array.isArray(archiveData.playerRegistrations))) {
      return {
        success: false,
        restoredPlayersCount: 0,
        restoredRegistrationsCount: 0,
        restoredUsersCount: 0,
        database: this.db,
        message: 'Belum ada riwayat data pemain yang pernah tersimpan sebelumnya untuk dipulihkan.',
      };
    }

    // Merge users so no current user is lost, and all previous accounts who ever logged in / registered are restored
    const usersMap = new Map<string, User>();
    for (const u of archiveData.users || []) {
      if (u.id) usersMap.set(u.id, u);
    }
    for (const u of this.db.users || []) {
      if (u.id) usersMap.set(u.id, u);
    }

    // Ensure Master Admin identity is preserved
    const admin = usersMap.get('usr-1');
    if (admin) {
      admin.name = 'Mohammad Wildan Kemal Pasha';
      admin.email = 'sukriwil04@gmail.com';
      admin.role = 'admin';
      admin.status = 'approved';
      if (!admin.password) admin.password = 'AdminCastindo2026!';
      if (!admin.sessionToken) admin.sessionToken = 'cfa_tok_usr-1_admin_2026';
    }

    archiveData.users = Array.from(usersMap.values());
    archiveData.meta = {
      ...archiveData.meta,
      lastUpdated: new Date().toISOString(),
      adminSetupCompleted: true,
    };

    this.db = archiveData;
    this.save(this.db);

    return {
      success: true,
      restoredPlayersCount: this.db.players.length,
      restoredRegistrationsCount: (this.db.playerRegistrations || []).length,
      restoredUsersCount: this.db.users.length,
      database: this.db,
      message: `Berhasil memulihkan ${this.db.players.length} data pemain dan ${this.db.users.length} akun terdaftar.`,
    };
  }

  public restoreOfficial20Players(): AcademyDatabase {
    this.restoreAllData();
    return this.db;
  }

  public deleteTestPlayers(): { count: number; remainingPlayers: number } {
    const beforeCount = this.db.players.length;
    this.db.players = (this.db.players || []).filter(
      (p) => p.fullName !== 'Ahmad Rizky Pratama' && p.fullName !== 'Dimas Maulana'
    );
    this.db.playerRegistrations = (this.db.playerRegistrations || []).filter(
      (r) => r.fullName !== 'Ahmad Rizky Pratama' && r.fullName !== 'Dimas Maulana'
    );

    const removedCount = beforeCount - this.db.players.length;
    if (removedCount > 0) {
      this.save(this.db);
    }
    return { count: removedCount, remainingPlayers: this.db.players.length };
  }

  // --- Players ---
  public getPlayers(): Player[] {
    return this.db.players;
  }

  public createPlayer(
    playerInput: Omit<Player, 'id' | 'birthYear' | 'createdAt' | 'updatedAt'>
  ): Player {
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(playerInput.birthDate).getFullYear();
    
    // Auto generate Player ID: CFA-YYYY-XXX
    const existingIds = this.db.players
      .map((p) => p.id)
      .filter((id) => id.startsWith(`CFA-${currentYear}-`));
    
    let nextNum = 1;
    if (existingIds.length > 0) {
      const numbers = existingIds.map((id) => {
        const parts = id.split('-');
        return parseInt(parts[parts.length - 1], 10) || 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }

    const paddedNum = String(nextNum).padStart(3, '0');
    const newId = `CFA-${currentYear}-${paddedNum}`;

    let assignedTeamId = playerInput.teamId;
    if (!assignedTeamId || assignedTeamId === 'auto' || !this.db.teams.some((t) => t.id === assignedTeamId)) {
      const team = this.getOrCreateTeamForAthlete(playerInput.birthDate);
      assignedTeamId = team.id;
    }

    const now = new Date().toISOString();
    const newPlayer: Player = {
      ...playerInput,
      id: newId,
      teamId: assignedTeamId,
      birthYear,
      createdAt: now,
      updatedAt: now,
    };

    this.db.players.push(newPlayer);
    this.save(this.db);
    return newPlayer;
  }

  public updatePlayer(id: string, updates: Partial<Player>): Player | null {
    const index = this.db.players.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.db.players[index];
    let birthYear = existing.birthYear;
    if (updates.birthDate) {
      birthYear = new Date(updates.birthDate).getFullYear();
    }

    const updatedPlayer: Player = {
      ...existing,
      ...updates,
      photoUrl: updates.photoUrl === '' ? undefined : (updates.photoUrl !== undefined ? updates.photoUrl : existing.photoUrl),
      id: existing.id, // Immutable ID
      birthYear,
      updatedAt: new Date().toISOString(),
    };

    this.db.players[index] = updatedPlayer;
    this.save(this.db);
    return updatedPlayer;
  }

  public archivePlayer(id: string, archived: boolean): Player | null {
    return this.updatePlayer(id, {
      status: archived ? 'archived' : 'active',
    });
  }

  public deletePlayer(id: string): boolean {
    const initialLen = this.db.players.length;
    this.db.players = this.db.players.filter((p) => p.id !== id);
    if (this.db.players.length !== initialLen) {
      // Unlink from users
      this.db.users.forEach((u) => {
        if (Array.isArray(u.linkedPlayerIds)) {
          u.linkedPlayerIds = u.linkedPlayerIds.filter((pid) => pid !== id);
        }
      });
      // Unlink or clear approvedPlayerId from registrations
      (this.db.playerRegistrations || []).forEach((r) => {
        if (r.approvedPlayerId === id) {
          r.approvedPlayerId = undefined;
        }
      });
      // Cascade delete associated performance data
      this.db.attendanceRecords = (this.db.attendanceRecords || []).filter((a) => a.playerId !== id);
      this.db.trainingLoadRecords = (this.db.trainingLoadRecords || []).filter((l) => l.playerId !== id);
      this.db.evaluations = (this.db.evaluations || []).filter((e) => e.playerId !== id);
      this.db.motorTestResults = (this.db.motorTestResults || []).filter((m) => m.playerId !== id);
      this.db.ltadGoals = (this.db.ltadGoals || []).filter((g) => g.playerId !== id);
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Self-Service Player Registrations ---
  public getPlayerRegistrations(): PlayerRegistration[] {
    return this.db.playerRegistrations || [];
  }

  public getPlayerRegistrationById(id: string): PlayerRegistration | undefined {
    return (this.db.playerRegistrations || []).find(
      (r) => r.id === id || r.registrationNumber === id
    );
  }

  public getRegistrationByNumber(regNum: string): PlayerRegistration | undefined {
    return this.getPlayerRegistrationById(regNum);
  }

  public checkDuplicatePlayer(fullName: string, birthDate: string): {
    isDuplicate: boolean;
    matchedPlayer?: Player;
    message?: string;
  } {
    const cleanName = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
    const matched = this.db.players.find((p) => {
      const pClean = p.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
      return pClean === cleanName && p.birthDate === birthDate;
    });

    if (matched) {
      return {
        isDuplicate: true,
        matchedPlayer: matched,
        message: `Peringatan: Pemain "${matched.fullName}" (${matched.birthDate}) sudah terdaftar dalam database utama dengan ID ${matched.id}.`,
      };
    }
    return { isDuplicate: false };
  }

  public createPlayerRegistration(
    input: Omit<
      PlayerRegistration,
      'id' | 'registrationNumber' | 'birthYear' | 'createdAt' | 'updatedAt' | 'status'
    >
  ): PlayerRegistration {
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(input.birthDate).getFullYear();

    // Auto generate Registration Number: REG-YYYY-XXX
    const existingNums = (this.db.playerRegistrations || [])
      .map((r) => r.registrationNumber)
      .filter((num) => num && num.startsWith(`REG-${currentYear}-`));

    let nextNum = 1;
    if (existingNums.length > 0) {
      const parsedNums = existingNums.map((num) => {
        const parts = num.split('-');
        return parseInt(parts[parts.length - 1], 10) || 0;
      });
      nextNum = Math.max(...parsedNums) + 1;
    }

    const paddedNum = String(nextNum).padStart(3, '0');
    const regNumber = `REG-${currentYear}-${paddedNum}`;
    const id = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Pre-check duplicate against current active database players
    const duplicateCheck = this.checkDuplicatePlayer(input.fullName, input.birthDate);

    const newReg: PlayerRegistration = {
      ...input,
      id,
      registrationNumber: regNumber,
      birthYear,
      status: 'pending',
      duplicateWarning: duplicateCheck.isDuplicate
        ? {
            isDuplicate: true,
            matchedPlayerId: duplicateCheck.matchedPlayer?.id,
            matchedPlayerName: duplicateCheck.matchedPlayer?.fullName,
            message: duplicateCheck.message,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (!Array.isArray(this.db.playerRegistrations)) {
      this.db.playerRegistrations = [];
    }
    this.db.playerRegistrations.unshift(newReg);
    this.save(this.db);
    return newReg;
  }

  public createRegistration(
    input: Omit<
      PlayerRegistration,
      'id' | 'registrationNumber' | 'birthYear' | 'createdAt' | 'updatedAt' | 'status'
    >
  ): PlayerRegistration {
    return this.createPlayerRegistration(input);
  }

  public updatePlayerRegistration(
    id: string,
    updates: Partial<PlayerRegistration>
  ): PlayerRegistration | null {
    if (!Array.isArray(this.db.playerRegistrations)) {
      this.db.playerRegistrations = [];
      return null;
    }

    const index = this.db.playerRegistrations.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.db.playerRegistrations[index];
    let birthYear = existing.birthYear;
    if (updates.birthDate) {
      birthYear = new Date(updates.birthDate).getFullYear();
    }

    // Re-check duplicate if name or birthDate changed
    let duplicateWarning = existing.duplicateWarning;
    const checkName = updates.fullName || existing.fullName;
    const checkBirth = updates.birthDate || existing.birthDate;
    const duplicateCheck = this.checkDuplicatePlayer(checkName, checkBirth);
    if (duplicateCheck.isDuplicate) {
      duplicateWarning = {
        isDuplicate: true,
        matchedPlayerId: duplicateCheck.matchedPlayer?.id,
        matchedPlayerName: duplicateCheck.matchedPlayer?.fullName,
        message: duplicateCheck.message,
      };
    } else {
      duplicateWarning = undefined;
    }

    const updatedReg: PlayerRegistration = {
      ...existing,
      ...updates,
      id: existing.id,
      registrationNumber: existing.registrationNumber,
      birthYear,
      duplicateWarning,
      updatedAt: new Date().toISOString(),
    };

    this.db.playerRegistrations[index] = updatedReg;
    this.save(this.db);
    return updatedReg;
  }

  public approvePlayerRegistration(
    id: string,
    approvalData: {
      teamId?: string;
      adminNotes?: string;
      reviewerName?: string;
      overrideDuplicate?: boolean;
    }
  ): { registration: PlayerRegistration; player: Player } {
    const reg = this.getPlayerRegistrationById(id);
    if (!reg) {
      throw new Error('Pengajuan pendaftaran tidak ditemukan');
    }

    // Determine target team accurately based on age / birth year if not provided
    const birthYear = reg.birthYear || (reg.birthDate ? new Date(reg.birthDate).getFullYear() : 2016);
    let targetTeamId = approvalData.teamId || reg.assignedTeamId;
    if (!targetTeamId || !this.db.teams.some((t) => t.id === targetTeamId)) {
      const targetTeam = this.getOrCreateTeamForAthlete(reg.birthDate || birthYear);
      targetTeamId = targetTeam.id;
    }

    const verifiedAdminNotes =
      approvalData.adminNotes?.trim() ||
      'Terverifikasi memenuhi kriteria kelompok usia akademi CFA';
    const reviewer = approvalData.reviewerName?.trim() || 'Mohammad Wildan Kemal Pasha';

    // If already approved and player exists in players database, update notes and return
    if (reg.status === 'approved' && reg.approvedPlayerId) {
      const existingPlayer = this.db.players.find((p) => p.id === reg.approvedPlayerId);
      if (existingPlayer) {
        existingPlayer.status = 'active';
        existingPlayer.teamId = targetTeamId;
        existingPlayer.coachNotes = `Catatan Verifikasi: ${verifiedAdminNotes}`;
        reg.adminNotes = verifiedAdminNotes;
        reg.reviewerName = reviewer;
        reg.assignedTeamId = targetTeamId;
        this.save(this.db);
        return { registration: reg, player: existingPlayer };
      }
    }

    // Create verified player in main database
    const newPlayer = this.createPlayer({
      fullName: reg.fullName.trim(),
      nickname: reg.nickname?.trim() || reg.fullName.trim().split(' ')[0],
      birthDate: reg.birthDate,
      birthPlace: reg.birthPlace || '',
      gender: reg.gender || 'Laki-laki',
      photoUrl: reg.photoUrl || '',
      address: reg.address || '',
      school: reg.school || '',
      schoolGrade: reg.schoolGrade || '',
      joinDate: new Date().toISOString().split('T')[0],
      teamId: targetTeamId,
      primaryPosition: reg.primaryPosition || 'Gelandang',
      secondaryPosition: reg.secondaryPosition || '',
      dominantFoot: reg.dominantFoot || 'Kanan',
      playingExperience: reg.playingExperience || '',
      previousClub: reg.previousClub || '',
      additionalNotes: reg.additionalNotes || '',
      guardianName: reg.guardianName || '-',
      guardianContact: reg.guardianContact || '-',
      guardianRelation: reg.guardianRelation || 'Wali',
      status: 'active',
      coachNotes: `Catatan Verifikasi: ${verifiedAdminNotes}`,
      registrationId: reg.id,
    });

    const now = new Date().toISOString();
    reg.status = 'approved';
    reg.approvedPlayerId = newPlayer.id;
    reg.assignedTeamId = targetTeamId;
    reg.reviewerName = reviewer;
    reg.reviewedAt = now;
    reg.adminNotes = verifiedAdminNotes;
    reg.updatedAt = now;

    // Automatically connect verified player to parent account if registered by parent
    if (reg.parentId) {
      const parentUser = this.db.users.find((u) => u.id === reg.parentId);
      if (parentUser) {
        if (!Array.isArray(parentUser.linkedPlayerIds)) {
          parentUser.linkedPlayerIds = [];
        }
        if (!parentUser.linkedPlayerIds.includes(newPlayer.id)) {
          if (parentUser.linkedPlayerIds.length < 4) {
            parentUser.linkedPlayerIds.push(newPlayer.id);
          }
        }
        this.addParentAuditLog({
          parentId: parentUser.id,
          parentName: parentUser.name,
          playerId: newPlayer.id,
          playerName: newPlayer.fullName,
          action: 'LINK_APPROVED',
          fieldChanged: 'Verifikasi Calon Atlet Akademi',
          oldValue: 'Menunggu Verifikasi',
          newValue: `Player ID Resmi: ${newPlayer.id} (${newPlayer.fullName})`,
          notes: `Verifikasi pendaftaran disetujui oleh ${reviewer}. Profil atlet resmi terbit.`,
        });
      }
    } else if (reg.guardianContact || reg.guardianName) {
      const matchedParent = this.db.users.find(
        (u) =>
          u.role === 'parent' &&
          ((reg.guardianContact && u.phone === reg.guardianContact) ||
            (reg.guardianName && u.name.toLowerCase() === reg.guardianName.toLowerCase()))
      );
      if (matchedParent) {
        if (!Array.isArray(matchedParent.linkedPlayerIds)) {
          matchedParent.linkedPlayerIds = [];
        }
        if (!matchedParent.linkedPlayerIds.includes(newPlayer.id)) {
          if (matchedParent.linkedPlayerIds.length < 4) {
            matchedParent.linkedPlayerIds.push(newPlayer.id);
          }
        }
      }
    }

    this.save(this.db);
    return { registration: reg, player: newPlayer };
  }

  public rejectPlayerRegistration(
    id: string,
    reason: string,
    reviewerName: string
  ): PlayerRegistration {
    const reg = this.getPlayerRegistrationById(id);
    if (!reg) {
      throw new Error('Pengajuan pendaftaran tidak ditemukan');
    }

    const now = new Date().toISOString();
    reg.status = 'rejected';
    reg.adminNotes = reason;
    reg.reviewerName = reviewerName;
    reg.reviewedAt = now;
    reg.updatedAt = now;

    this.save(this.db);
    return reg;
  }

  public requestRevisionPlayerRegistration(
    id: string,
    notes: string,
    reviewerName: string
  ): PlayerRegistration {
    const reg = this.getPlayerRegistrationById(id);
    if (!reg) {
      throw new Error('Pengajuan pendaftaran tidak ditemukan');
    }

    const now = new Date().toISOString();
    reg.status = 'needs_revision';
    reg.adminNotes = notes;
    reg.reviewerName = reviewerName;
    reg.reviewedAt = now;
    reg.updatedAt = now;

    this.save(this.db);
    return reg;
  }

  public deletePlayerRegistration(id: string): boolean {
    if (!Array.isArray(this.db.playerRegistrations)) return false;
    const initialLen = this.db.playerRegistrations.length;
    this.db.playerRegistrations = this.db.playerRegistrations.filter((r) => r.id !== id);
    if (this.db.playerRegistrations.length !== initialLen) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Training Sessions ---
  public getSessions(): TrainingSession[] {
    return this.db.trainingSessions;
  }

  public createSession(
    sessionInput: Omit<TrainingSession, 'id' | 'createdAt'>
  ): TrainingSession {
    const dateFormatted = sessionInput.date.replace(/-/g, '');
    const prefix = `SES-${dateFormatted}-`;
    const countToday = this.db.trainingSessions.filter((s) =>
      s.id.startsWith(prefix)
    ).length;
    const padded = String(countToday + 1).padStart(2, '0');
    const newId = `${prefix}${padded}`;

    const newSession: TrainingSession = {
      ...sessionInput,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    this.db.trainingSessions.push(newSession);

    // Pre-populate attendance & training load placeholders for active players in this team
    const teamPlayers = this.db.players.filter(
      (p) => p.status === 'active' && (!sessionInput.teamId || sessionInput.teamId === 'all' || p.teamId === sessionInput.teamId)
    );
    const now = new Date().toISOString();
    const duration = sessionInput.actualDurationMinutes || sessionInput.plannedDurationMinutes || 75;

    teamPlayers.forEach((p) => {
      // Create initial attendance record
      if (!this.db.attendanceRecords.some((a) => a.sessionId === newId && a.playerId === p.id)) {
        this.db.attendanceRecords.push({
          id: `att-${newId}-${p.id}`,
          sessionId: newId,
          playerId: p.id,
          status: 'present',
          actualMinutes: duration,
          notes: '',
          recordedAt: now,
        });
      }

      // Create initial training load record
      if (!this.db.trainingLoadRecords.some((tl) => tl.sessionId === newId && tl.playerId === p.id)) {
        this.db.trainingLoadRecords.push({
          id: `tl-${newId}-${p.id}`,
          sessionId: newId,
          playerId: p.id,
          sessionDate: sessionInput.date,
          actualDurationMinutes: duration,
          rpe: null,
          trainingLoad: null,
          playerResponseNotes: '',
          recordedAt: now,
        });
      }
    });

    this.save(this.db);
    return newSession;
  }

  public updateSession(
    id: string,
    updates: Partial<TrainingSession>
  ): TrainingSession | null {
    const index = this.db.trainingSessions.findIndex((s) => s.id === id);
    if (index === -1) return null;

    this.db.trainingSessions[index] = {
      ...this.db.trainingSessions[index],
      ...updates,
      id: this.db.trainingSessions[index].id,
    };

    this.save(this.db);
    return this.db.trainingSessions[index];
  }

  public deleteSession(id: string): boolean {
    const prev = this.db.trainingSessions.length;
    this.db.trainingSessions = this.db.trainingSessions.filter((s) => s.id !== id);
    this.db.attendanceRecords = this.db.attendanceRecords.filter(
      (a) => a.sessionId !== id
    );
    this.db.trainingLoadRecords = this.db.trainingLoadRecords.filter(
      (tl) => tl.sessionId !== id
    );
    if (this.db.trainingSessions.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Attendance ---
  public getAttendance(): AttendanceRecord[] {
    return this.db.attendanceRecords;
  }

  public batchSaveAttendance(
    sessionId: string,
    records: Array<{
      playerId: string;
      status: AttendanceRecord['status'];
      actualMinutes: number;
      notes?: string;
    }>
  ): AttendanceRecord[] {
    const now = new Date().toISOString();
    const session = this.db.trainingSessions.find((s) => s.id === sessionId);
    const sessionDate = session ? session.date : new Date().toISOString().split('T')[0];

    // Remove existing records for this session ONLY for players present in this batch
    const incomingPlayerIds = new Set(records.map((r) => r.playerId));
    this.db.attendanceRecords = this.db.attendanceRecords.filter(
      (a) => a.sessionId !== sessionId || !incomingPlayerIds.has(a.playerId)
    );

    const created: AttendanceRecord[] = records.map((r) => {
      const isAbsentOrSick = r.status === 'absent' || r.status === 'sick' || r.status === 'excused';
      const cleanMinutes = isAbsentOrSick ? 0 : Math.max(0, Number(r.actualMinutes) || 0);

      return {
        id: `att-${sessionId}-${r.playerId}`,
        sessionId,
        playerId: r.playerId,
        status: r.status,
        actualMinutes: cleanMinutes,
        notes: (r.notes || '').trim(),
        recordedAt: now,
      };
    });

    this.db.attendanceRecords.push(...created);

    // Also auto-sync or keep training load records aligned with actualMinutes
    records.forEach((r) => {
      const isAbsentOrSick = r.status === 'absent' || r.status === 'sick' || r.status === 'excused';
      const newDur = isAbsentOrSick ? 0 : Math.max(0, Number(r.actualMinutes) || 0);

      const existingTlIndex = this.db.trainingLoadRecords.findIndex(
        (tl) => tl.sessionId === sessionId && tl.playerId === r.playerId
      );

      if (existingTlIndex >= 0) {
        const existing = this.db.trainingLoadRecords[existingTlIndex];
        const newLoad =
          existing.rpe !== null && newDur > 0 ? newDur * existing.rpe : null;

        this.db.trainingLoadRecords[existingTlIndex] = {
          ...existing,
          actualDurationMinutes: newDur,
          trainingLoad: newLoad,
        };
      } else if (session) {
        // Create initial load placeholder
        this.db.trainingLoadRecords.push({
          id: `tl-${sessionId}-${r.playerId}`,
          sessionId,
          playerId: r.playerId,
          sessionDate,
          actualDurationMinutes: newDur,
          rpe: null,
          trainingLoad: null,
          recordedAt: now,
        });
      }
    });

    this.save(this.db);
    return this.db.attendanceRecords.filter((a) => a.sessionId === sessionId);
  }

  // --- Training Load ---
  public getTrainingLoads(): TrainingLoadRecord[] {
    return this.db.trainingLoadRecords;
  }

  public batchSaveTrainingLoad(
    sessionId: string,
    records: Array<{
      playerId: string;
      actualDurationMinutes: number;
      rpe: number | null;
      playerResponseNotes?: string;
    }>
  ): TrainingLoadRecord[] {
    const session = this.db.trainingSessions.find((s) => s.id === sessionId);
    const sessionDate = session ? session.date : new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    records.forEach((r) => {
      const load =
        r.rpe !== null && r.rpe > 0 && r.actualDurationMinutes > 0
          ? r.actualDurationMinutes * r.rpe
          : null;

      const idx = this.db.trainingLoadRecords.findIndex(
        (tl) => tl.sessionId === sessionId && tl.playerId === r.playerId
      );

      if (idx >= 0) {
        this.db.trainingLoadRecords[idx] = {
          ...this.db.trainingLoadRecords[idx],
          actualDurationMinutes: r.actualDurationMinutes,
          rpe: r.rpe,
          trainingLoad: load,
          playerResponseNotes: r.playerResponseNotes,
          recordedAt: now,
        };
      } else {
        this.db.trainingLoadRecords.push({
          id: `tl-${sessionId}-${r.playerId}`,
          sessionId,
          playerId: r.playerId,
          sessionDate,
          actualDurationMinutes: r.actualDurationMinutes,
          rpe: r.rpe,
          trainingLoad: load,
          playerResponseNotes: r.playerResponseNotes,
          recordedAt: now,
        });
      }
    });

    this.save(this.db);
    return this.db.trainingLoadRecords.filter((tl) => tl.sessionId === sessionId);
  }

  // --- Technical & Tactical Evaluations ---
  public getEvaluations(): TechnicalTacticalEvaluation[] {
    return this.db.evaluations;
  }

  public saveEvaluation(
    evalInput: Omit<TechnicalTacticalEvaluation, 'id' | 'createdAt'>,
    id?: string
  ): TechnicalTacticalEvaluation {
    const now = new Date().toISOString();
    if (id) {
      const idx = this.db.evaluations.findIndex((e) => e.id === id);
      if (idx >= 0) {
        this.db.evaluations[idx] = {
          ...evalInput,
          id,
          createdAt: this.db.evaluations[idx].createdAt,
        };
        this.save(this.db);
        return this.db.evaluations[idx];
      }
    }

    const newEval: TechnicalTacticalEvaluation = {
      ...evalInput,
      id: `eval-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };
    this.db.evaluations.push(newEval);
    this.save(this.db);
    return newEval;
  }

  public deleteEvaluation(id: string): boolean {
    const prev = this.db.evaluations.length;
    this.db.evaluations = this.db.evaluations.filter((e) => e.id !== id);
    if (this.db.evaluations.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Motor Tests & Results ---
  public getMotorTests(): MotorTest[] {
    return this.db.motorTests;
  }

  public createMotorTest(testInput: Omit<MotorTest, 'id'>): MotorTest {
    const newTest: MotorTest = {
      ...testInput,
      id: `t-custom-${Date.now()}`,
    };
    this.db.motorTests.push(newTest);
    this.save(this.db);
    return newTest;
  }

  public updateMotorTest(id: string, updates: Partial<MotorTest>): MotorTest | null {
    const idx = this.db.motorTests.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.db.motorTests[idx] = {
      ...this.db.motorTests[idx],
      ...updates,
      id,
    };
    this.save(this.db);
    return this.db.motorTests[idx];
  }

  public deleteMotorTest(id: string): boolean {
    const prev = this.db.motorTests.length;
    this.db.motorTests = this.db.motorTests.filter((t) => t.id !== id);
    if (this.db.motorTests.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  public getMotorTestResults(): MotorTestResult[] {
    return this.db.motorTestResults;
  }

  public saveMotorTestResult(
    resultInput: Omit<MotorTestResult, 'id' | 'createdAt'>,
    id?: string
  ): MotorTestResult {
    const now = new Date().toISOString();
    if (id) {
      const idx = this.db.motorTestResults.findIndex((r) => r.id === id);
      if (idx >= 0) {
        this.db.motorTestResults[idx] = {
          ...resultInput,
          id,
          createdAt: this.db.motorTestResults[idx].createdAt,
        };
        this.save(this.db);
        return this.db.motorTestResults[idx];
      }
    }

    const newResult: MotorTestResult = {
      ...resultInput,
      id: `mtr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };
    this.db.motorTestResults.push(newResult);
    this.save(this.db);
    return newResult;
  }

  public deleteMotorTestResult(id: string): boolean {
    const prev = this.db.motorTestResults.length;
    this.db.motorTestResults = this.db.motorTestResults.filter((r) => r.id !== id);
    if (this.db.motorTestResults.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  public togglePublishMotorTestResult(id: string, published: boolean): MotorTestResult | null {
    const idx = this.db.motorTestResults.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.db.motorTestResults[idx].publishedToParents = published;
    this.save(this.db);
    return this.db.motorTestResults[idx];
  }

  public batchPublishMotorTestResults(ids: string[], published: boolean): number {
    let count = 0;
    this.db.motorTestResults.forEach((r) => {
      if (ids.includes(r.id)) {
        r.publishedToParents = published;
        count++;
      }
    });
    if (count > 0) this.save(this.db);
    return count;
  }

  // --- LTAD Goals ---
  public getLtadGoals(): LtadGoal[] {
    return this.db.ltadGoals;
  }

  public saveLtadGoal(
    goalInput: Omit<LtadGoal, 'id' | 'createdAt'>,
    id?: string
  ): LtadGoal {
    const now = new Date().toISOString();
    if (id) {
      const idx = this.db.ltadGoals.findIndex((g) => g.id === id);
      if (idx >= 0) {
        this.db.ltadGoals[idx] = {
          ...goalInput,
          id,
          createdAt: this.db.ltadGoals[idx].createdAt,
        };
        this.save(this.db);
        return this.db.ltadGoals[idx];
      }
    }

    const newGoal: LtadGoal = {
      ...goalInput,
      id: `ltad-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };
    this.db.ltadGoals.push(newGoal);
    this.save(this.db);
    return newGoal;
  }

  public deleteLtadGoal(id: string): boolean {
    const prev = this.db.ltadGoals.length;
    this.db.ltadGoals = this.db.ltadGoals.filter((g) => g.id !== id);
    if (this.db.ltadGoals.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Promotion Reviews ---
  public getPromotionReviews(): PromotionReview[] {
    return this.db.promotionReviews;
  }

  public savePromotionReview(
    reviewInput: Omit<PromotionReview, 'id' | 'createdAt'>,
    id?: string
  ): PromotionReview {
    const now = new Date().toISOString();
    if (id) {
      const idx = this.db.promotionReviews.findIndex((p) => p.id === id);
      if (idx >= 0) {
        this.db.promotionReviews[idx] = {
          ...reviewInput,
          id,
          createdAt: this.db.promotionReviews[idx].createdAt,
        };
        this.save(this.db);
        return this.db.promotionReviews[idx];
      }
    }

    const newReview: PromotionReview = {
      ...reviewInput,
      id: `prom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    };
    this.db.promotionReviews.push(newReview);
    this.save(this.db);
    return newReview;
  }

  public deletePromotionReview(id: string): boolean {
    const prev = this.db.promotionReviews.length;
    this.db.promotionReviews = this.db.promotionReviews.filter((p) => p.id !== id);
    if (this.db.promotionReviews.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  // --- Users & Teams ---
  public getUsers(): User[] {
    return this.db.users;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    // Protect official admin from unintended role or status downgrade
    if (id === 'usr-1' || this.db.users[idx].role === 'admin' || this.db.users[idx].email?.trim().toLowerCase() === 'sukriwil04@gmail.com') {
      if (updates.role && updates.role !== 'admin') {
        updates.role = 'admin';
      }
      if (updates.status && updates.status !== 'approved') {
        updates.status = 'approved';
      }
      if (!updates.password && this.db.users[idx].password) {
        updates.password = this.db.users[idx].password;
      }
    }

    this.db.users[idx] = {
      ...this.db.users[idx],
      ...updates,
      id,
    };
    this.save(this.db);
    return this.db.users[idx];
  }

  public createUser(userInput: Omit<User, 'id'>): User {
    const newId = `usr-${Date.now()}`;
    const newUser: User = {
      ...userInput,
      id: newId,
    };
    this.db.users.push(newUser);
    this.save(this.db);
    return newUser;
  }

  public deleteUser(id: string): boolean {
    if (id === 'usr-1') {
      throw new Error('Akun Administrator Resmi (sukriwil04@gmail.com) dilindungi dan tidak dapat dihapus.');
    }
    const target = this.db.users.find((u) => u.id === id);
    if (target && (target.role === 'admin' || target.email?.trim().toLowerCase() === 'sukriwil04@gmail.com')) {
      throw new Error('Akun Administrator Resmi dilindungi dan tidak dapat dihapus.');
    }
    const prev = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    if (this.db.users.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  public getTeams(): Team[] {
    return this.db.teams;
  }

  public updateTeam(id: string, updates: Partial<Team>): Team | null {
    const idx = this.db.teams.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.db.teams[idx] = {
      ...this.db.teams[idx],
      ...updates,
      id,
    };
    this.save(this.db);
    return this.db.teams[idx];
  }

  public createTeam(teamInput: Omit<Team, 'id'>): Team {
    const newId = `team-${Date.now()}`;
    const newTeam: Team = {
      ...teamInput,
      id: newId,
    };
    this.db.teams.push(newTeam);
    this.save(this.db);
    return newTeam;
  }

  public deleteTeam(id: string): boolean {
    const prev = this.db.teams.length;
    this.db.teams = this.db.teams.filter((t) => t.id !== id);
    if (this.db.teams.length !== prev) {
      this.save(this.db);
      return true;
    }
    return false;
  }

  public getOrCreateTeamForAthlete(birthDateOrYear: string | number): Team {
    const currentYear = new Date().getFullYear();
    let dateStr = '';
    if (typeof birthDateOrYear === 'number') {
      dateStr = `${birthDateOrYear}-06-01`;
    } else if (birthDateOrYear && typeof birthDateOrYear === 'string') {
      dateStr = birthDateOrYear.includes('-') ? birthDateOrYear : `${birthDateOrYear}-06-01`;
    } else {
      dateStr = `${currentYear - 8}-06-01`;
    }

    const ageCalc = calculateAgeGroup(dateStr);
    const targetTeamId = ageCalc?.recommendedTeamId || 'team-b';
    const targetTeamName = ageCalc?.recommendedTeamName || 'Castindo Tim B (U-8/U-9)';
    const targetFormat = (ageCalc?.recommendedFormat?.split(' ')[0] as any) || '7v7';
    const compAge = ageCalc?.competitionAge || 9;

    if (!Array.isArray(this.db.teams)) {
      this.db.teams = [];
    }

    let team = this.db.teams.find((t) => t.id === targetTeamId);
    if (!team) {
      const code = `TIM_${targetTeamId.replace('team-', '').toUpperCase().replace(/-/g, '_')}`;
      const birthStart = currentYear - compAge;
      const birthEnd = birthStart + 1;
      team = {
        id: targetTeamId,
        code,
        name: targetTeamName,
        ageGroup: `Kelahiran ${birthStart}–${birthEnd}`,
        format: targetFormat,
        weeklySessionsCount: 3,
        description: `Kelompok pembinaan ${targetTeamName} dengan format kompetisi ${targetFormat}.`,
        active: true,
      };
      this.db.teams.push(team);
      this.save(this.db);
    } else if (team.active === false) {
      team.active = true;
      this.save(this.db);
    }
    return team;
  }

  // ==========================================
  // --- PARENT PORTAL & MONITORING METHODS ---
  // ==========================================

  public getParentInviteCodes(): ParentInviteCode[] {
    return this.db.parentInviteCodes || [];
  }

  public createParentInviteCode(
    playerId: string,
    createdBy: string = 'Admin',
    relationship: string = 'Wali'
  ): ParentInviteCode {
    const player = this.db.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Pemain tidak ditemukan');

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cleanPlayerId = playerId.replace(/[^a-zA-Z0-9]/g, '');
    const code = `INV-${cleanPlayerId}-${randomSuffix}`;

    const newInvite: ParentInviteCode = {
      id: `inv-${Date.now()}-${randomSuffix.toLowerCase()}`,
      code,
      playerId,
      playerName: player.fullName,
      relationship,
      isUsed: false,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    if (!this.db.parentInviteCodes) this.db.parentInviteCodes = [];
    this.db.parentInviteCodes.push(newInvite);
    this.save(this.db);
    return newInvite;
  }

  public getParentLinkRequests(): ParentLinkRequest[] {
    return this.db.parentLinkRequests || [];
  }

  public createParentLinkRequest(input: {
    parentId: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    relationship: string;
    playerId: string;
    inviteCodeUsed?: string;
    notes?: string;
  }): ParentLinkRequest {
    const player = this.db.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error('Pemain tidak ditemukan');

    const id = `plr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Check if inviteCode is provided and valid for this player
    let autoApprove = false;
    let inviteObj: ParentInviteCode | undefined;
    if (input.inviteCodeUsed) {
      const cleanCode = input.inviteCodeUsed.trim().toUpperCase();
      inviteObj = (this.db.parentInviteCodes || []).find(
        (inv) => inv.code === cleanCode && inv.playerId === input.playerId && !inv.isUsed
      );
      if (inviteObj) {
        autoApprove = true;
        inviteObj.isUsed = true;
        inviteObj.usedByParentId = input.parentId;
        inviteObj.usedByParentName = input.parentName;
        inviteObj.usedAt = now;
      }
    }

    const newRequest: ParentLinkRequest = {
      id,
      parentId: input.parentId,
      parentName: input.parentName,
      parentEmail: input.parentEmail,
      parentPhone: input.parentPhone,
      relationship: input.relationship,
      playerId: input.playerId,
      playerName: player.fullName,
      inviteCodeUsed: input.inviteCodeUsed,
      status: autoApprove ? 'approved' : 'pending',
      notes: input.notes,
      createdAt: now,
      reviewedAt: autoApprove ? now : undefined,
      reviewedBy: autoApprove ? 'Sistem (Kode Undangan Valid)' : undefined,
    };

    if (!this.db.parentLinkRequests) this.db.parentLinkRequests = [];
    this.db.parentLinkRequests.push(newRequest);

    if (autoApprove) {
      // Connect parent user directly
      this.linkParentToPlayerInternal(input.parentId, input.playerId, 'Sistem (Kode Undangan)');
    }

    this.save(this.db);
    return newRequest;
  }

  private linkParentToPlayerInternal(parentId: string, playerId: string, linkedBy: string) {
    const parent = this.db.users.find((u) => u.id === parentId);
    const player = this.db.players.find((p) => p.id === playerId);
    if (!parent || !player) return;

    if (!parent.linkedPlayerIds) parent.linkedPlayerIds = [];
    if (!parent.linkedPlayerIds.includes(playerId)) {
      if (parent.linkedPlayerIds.length >= 4) {
        throw new Error(
          'Batas maksimal tercapai: 1 akun orang tua/wali hanya dapat mendaftarkan atau dihubungkan dengan maksimal 4 anak/pemain.'
        );
      }
      parent.linkedPlayerIds.push(playerId);
    }

    this.addParentAuditLog({
      parentId,
      parentName: parent.name,
      playerId,
      playerName: player.fullName,
      action: 'LINK_APPROVED',
      fieldChanged: 'Tautan Anak',
      oldValue: '-',
      newValue: `Terhubung dengan ${player.fullName} (${playerId})`,
      notes: `Disetujui oleh: ${linkedBy}`,
    });
  }

  public approveParentLinkRequest(requestId: string, adminName: string = 'Admin'): ParentLinkRequest | null {
    const req = (this.db.parentLinkRequests || []).find((r) => r.id === requestId);
    if (!req) return null;

    req.status = 'approved';
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = adminName;

    this.linkParentToPlayerInternal(req.parentId, req.playerId, adminName);
    this.save(this.db);
    return req;
  }

  public rejectParentLinkRequest(
    requestId: string,
    rejectionReason: string,
    adminName: string = 'Admin'
  ): ParentLinkRequest | null {
    const req = (this.db.parentLinkRequests || []).find((r) => r.id === requestId);
    if (!req) return null;

    req.status = 'rejected';
    req.rejectionReason = rejectionReason;
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = adminName;

    this.save(this.db);
    return req;
  }

  public linkParentToPlayer(parentId: string, playerId: string, adminName: string = 'Admin'): boolean {
    const parent = this.db.users.find((u) => u.id === parentId);
    const player = this.db.players.find((p) => p.id === playerId);
    if (!parent || !player) return false;

    this.linkParentToPlayerInternal(parentId, playerId, adminName);
    this.save(this.db);
    return true;
  }

  public unlinkParentFromPlayer(parentId: string, playerId: string, adminName: string = 'Admin'): boolean {
    const parent = this.db.users.find((u) => u.id === parentId);
    const player = this.db.players.find((p) => p.id === playerId);
    if (!parent || !player) return false;

    if (parent.linkedPlayerIds) {
      parent.linkedPlayerIds = parent.linkedPlayerIds.filter((id) => id !== playerId);
    }

    this.addParentAuditLog({
      parentId,
      parentName: parent.name,
      playerId,
      playerName: player.fullName,
      action: 'UPDATE_BASIC_INFO',
      fieldChanged: 'Tautan Anak',
      oldValue: `Terhubung dengan ${player.fullName}`,
      newValue: 'Tautan Diputus',
      notes: `Diputus oleh: ${adminName}`,
    });

    this.save(this.db);
    return true;
  }

  public parentUpdateChildBasicInfo(
    parentId: string,
    playerId: string,
    updates: {
      nickname?: string;
      address?: string;
      school?: string;
      schoolGrade?: string;
      photoUrl?: string;
      guardianContact?: string;
      guardianName?: string;
      guardianRelation?: string;
      additionalNotes?: string;
    }
  ): Player {
    const parent = this.db.users.find((u) => u.id === parentId);
    if (!parent) throw new Error('Akun orang tua tidak ditemukan');

    // Security check: Verify parent is actually linked to this child!
    // (Allow admins to bypass for management purposes)
    const isLinked = (parent.linkedPlayerIds || []).includes(playerId);
    if (parent.role === 'parent' && !isLinked) {
      throw new Error('Akses ditolak: Anda tidak memiliki otoritas atas data profil pemain ini.');
    }

    const player = this.db.players.find((p) => p.id === playerId);
    if (!player) throw new Error('Pemain tidak ditemukan');

    const now = new Date().toISOString();

    // Check each allowed field and record audit log
    const allowedFields: (keyof typeof updates)[] = [
      'nickname',
      'address',
      'school',
      'schoolGrade',
      'photoUrl',
      'guardianContact',
      'guardianName',
      'guardianRelation',
      'additionalNotes',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined && updates[field] !== (player as any)[field]) {
        const oldVal = String((player as any)[field] || '-');
        const newVal = String(updates[field] || '-');
        (player as any)[field] = updates[field];

        this.addParentAuditLog({
          parentId,
          parentName: parent.name,
          playerId,
          playerName: player.fullName,
          action: field === 'photoUrl' ? 'UPLOAD_PHOTO' : 'UPDATE_BASIC_INFO',
          fieldChanged: field,
          oldValue: oldVal.length > 60 ? oldVal.substring(0, 60) + '...' : oldVal,
          newValue: newVal.length > 60 ? newVal.substring(0, 60) + '...' : newVal,
          notes: `Diperbarui langsung oleh orang tua/wali`,
        });
      }
    });

    player.updatedAt = now;
    this.save(this.db);
    return player;
  }

  public getChildIdentityChangeRequests(): ChildIdentityChangeRequest[] {
    return this.db.childIdentityChangeRequests || [];
  }

  public createChildIdentityChangeRequest(input: {
    parentId: string;
    playerId: string;
    field: 'fullName' | 'birthDate' | 'birthPlace' | 'gender';
    proposedValue: string;
    reason: string;
  }): ChildIdentityChangeRequest {
    const parent = this.db.users.find((u) => u.id === input.parentId);
    if (!parent) throw new Error('Akun orang tua tidak ditemukan');

    const player = this.db.players.find((p) => p.id === input.playerId);
    if (!player) throw new Error('Pemain tidak ditemukan');

    const isLinked = (parent.linkedPlayerIds || []).includes(input.playerId);
    if (parent.role === 'parent' && !isLinked) {
      throw new Error('Akses ditolak: Anda tidak terhubung dengan pemain ini.');
    }

    const currentValue = String((player as any)[input.field] || '-');
    const newReq: ChildIdentityChangeRequest = {
      id: `icr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      parentId: input.parentId,
      parentName: parent.name,
      playerId: input.playerId,
      playerName: player.fullName,
      field: input.field,
      currentValue,
      proposedValue: input.proposedValue,
      reason: input.reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (!this.db.childIdentityChangeRequests) this.db.childIdentityChangeRequests = [];
    this.db.childIdentityChangeRequests.push(newReq);

    this.addParentAuditLog({
      parentId: input.parentId,
      parentName: parent.name,
      playerId: input.playerId,
      playerName: player.fullName,
      action: 'REQUEST_IDENTITY_CHANGE',
      fieldChanged: input.field,
      oldValue: currentValue,
      newValue: input.proposedValue,
      notes: `Alasan pengajuan: ${input.reason}`,
    });

    this.save(this.db);
    return newReq;
  }

  public approveChildIdentityChangeRequest(requestId: string, adminName: string = 'Admin'): ChildIdentityChangeRequest | null {
    const req = (this.db.childIdentityChangeRequests || []).find((r) => r.id === requestId);
    if (!req) return null;

    const player = this.db.players.find((p) => p.id === req.playerId);
    if (!player) throw new Error('Pemain tidak ditemukan');

    // Apply the identity field update to the player in database
    (player as any)[req.field] = req.proposedValue;
    if (req.field === 'birthDate') {
      player.birthYear = new Date(req.proposedValue).getFullYear();
    }
    player.updatedAt = new Date().toISOString();

    req.status = 'approved';
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = adminName;

    this.addParentAuditLog({
      parentId: req.parentId,
      parentName: req.parentName,
      playerId: req.playerId,
      playerName: player.fullName,
      action: 'APPROVE_IDENTITY_CHANGE',
      fieldChanged: req.field,
      oldValue: req.currentValue,
      newValue: req.proposedValue,
      notes: `Disetujui dan diperbarui resmi oleh ${adminName}`,
    });

    this.save(this.db);
    return req;
  }

  public rejectChildIdentityChangeRequest(
    requestId: string,
    adminNotes: string,
    adminName: string = 'Admin'
  ): ChildIdentityChangeRequest | null {
    const req = (this.db.childIdentityChangeRequests || []).find((r) => r.id === requestId);
    if (!req) return null;

    req.status = 'rejected';
    req.adminNotes = adminNotes;
    req.reviewedAt = new Date().toISOString();
    req.reviewedBy = adminName;

    this.save(this.db);
    return req;
  }

  public getParentAuditLogs(playerId?: string): ParentAuditLog[] {
    const logs = this.db.parentAuditLogs || [];
    if (!playerId) return logs.slice().reverse();
    return logs.filter((l) => l.playerId === playerId).slice().reverse();
  }

  public addParentAuditLog(entry: Omit<ParentAuditLog, 'id' | 'timestamp'>) {
    if (!this.db.parentAuditLogs) this.db.parentAuditLogs = [];
    const newLog: ParentAuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.parentAuditLogs.push(newLog);
  }

  public registerCoachUser(input: {
    name: string;
    email: string;
    password: string;
    role?: 'head_coach' | 'assistant_coach';
    assignedTeamId?: string;
    phone?: string;
    avatarUrl?: string;
  }): { user: User; token: string } {
    if (!input.name || !input.name.trim()) {
      throw new Error('Nama lengkap pelatih wajib diisi.');
    }
    if (!input.email || !input.email.trim()) {
      throw new Error('Alamat email pelatih wajib diisi.');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Kata sandi pelatih minimal 6 karakter.');
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const existing = this.db.users.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new Error(`Email ${input.email} sudah terdaftar. Silakan login ke akun Anda.`);
    }

    const userId = `usr-coach-${Date.now()}`;
    const token = `cfa_tok_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newCoach: User = {
      id: userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role === 'assistant_coach' ? 'assistant_coach' : 'head_coach',
      status: 'approved', // Langsung aktif tanpa verifikasi admin sesuai permintaan
      password: input.password,
      assignedTeamId: input.assignedTeamId || 'team-b',
      phone: input.phone?.trim() || '',
      sessionToken: token,
      avatarUrl: input.avatarUrl?.trim() || undefined,
      createdAt: now,
      approvedAt: now,
      approvedBy: 'Sistem Registrasi Mandiri Pelatih',
    };

    this.db.users.push(newCoach);
    this.save(this.db);
    return { user: this.sanitizeUser(newCoach), token };
  }

  public registerParentUser(input: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    relationship?: string;
    avatarUrl?: string;
    inviteCode?: string;
  }): { user: User; token: string; linkedPlayerId?: string } {
    // Check if email already used
    const existing = this.db.users.find(
      (u) => u.email.trim().toLowerCase() === input.email.trim().toLowerCase()
    );
    if (existing) {
      throw new Error(`Email ${input.email} sudah terdaftar. Silakan login.`);
    }

    const userId = `usr-parent-${Date.now()}`;
    const token = `cfa_tok_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: 'parent',
      status: 'approved', // Auto-approved so parents can immediately monitor registered athletes
      password: input.password || '123456',
      phone: input.phone?.trim() || '',
      relationship: input.relationship || 'Wali',
      avatarUrl: input.avatarUrl?.trim() || undefined,
      linkedPlayerIds: [],
      sessionToken: token,
      createdAt: now,
      approvedAt: now,
      approvedBy: 'Sistem Registrasi Mandiri CFA',
    };

    let linkedPlayerId: string | undefined;

    // If a valid invite code was provided at registration, automatically approve and link
    if (input.inviteCode) {
      const cleanCode = input.inviteCode.trim().toUpperCase();
      const invite = (this.db.parentInviteCodes || []).find(
        (inv) => inv.code === cleanCode && !inv.isUsed
      );
      if (invite) {
        invite.isUsed = true;
        invite.usedByParentId = userId;
        invite.usedByParentName = newUser.name;
        invite.usedAt = now;

        newUser.linkedPlayerIds = [invite.playerId];
        newUser.status = 'approved';
        newUser.approvedAt = now;
        newUser.approvedBy = 'Sistem (Kode Undangan Valid)';
        linkedPlayerId = invite.playerId;

        const player = this.db.players.find((p) => p.id === invite.playerId);
        if (player) {
          this.addParentAuditLog({
            parentId: userId,
            parentName: newUser.name,
            playerId: invite.playerId,
            playerName: player.fullName,
            action: 'LINK_APPROVED',
            fieldChanged: 'Pendaftaran Akun Wali',
            oldValue: '-',
            newValue: `Berhasil terhubung via kode undangan ${invite.code}`,
            notes: 'Pendaftaran mandiri wali murid dengan kode undangan valid',
          });
        }
      }
    }

    this.db.users.push(newUser);
    this.save(this.db);
    return { user: this.sanitizeUser(newUser), token, linkedPlayerId };
  }

  public registerParentWithAthlete(input: {
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
  }): {
    user: User;
    player: Player;
    players: Player[];
    registration: PlayerRegistration;
    registrations: PlayerRegistration[];
    token: string;
  } {
    if (!input.parent?.name || !input.parent?.email) {
      throw new Error('Nama dan email orang tua/wali wajib diisi.');
    }

    const athletesList = Array.isArray(input.athletes) && input.athletes.length > 0
      ? input.athletes
      : input.athlete
      ? [input.athlete]
      : [];

    if (athletesList.length === 0) {
      throw new Error('Minimal 1 data anak/atlet wajib diisi.');
    }

    if (athletesList.length > 4) {
      throw new Error('Batas maksimal tercapai: 1 akun orang tua/wali hanya dapat mendaftarkan maksimal 4 anak/pemain.');
    }

    athletesList.forEach((ath, idx) => {
      if (!ath.fullName || !ath.birthDate || !ath.primaryPosition) {
        throw new Error(`Data anak ke-${idx + 1} belum lengkap: nama lengkap, tanggal lahir, dan posisi utama wajib diisi.`);
      }
    });

    const cleanEmail = input.parent.email.trim().toLowerCase();
    const existing = this.db.users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(
        `Email ${input.parent.email} sudah terdaftar. Silakan login ke akun Anda untuk menambahkan anak/pemain (maksimal 4 anak).`
      );
    }

    const currentYear = new Date().getFullYear();
    const now = new Date().toISOString();
    const userId = `usr-parent-${Date.now()}`;
    const token = `cfa_tok_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const createdPlayers: Player[] = [];
    const createdRegistrations: PlayerRegistration[] = [];
    const linkedPlayerIds: string[] = [];

    // Find starting ID index
    const existingPlayerIds = this.db.players
      .map((p) => p.id)
      .filter((id) => id && id.startsWith(`CFA-${currentYear}-`));
    let nextNum = 1;
    if (existingPlayerIds.length > 0) {
      const numbers = existingPlayerIds.map((id) => {
        const parts = id.split('-');
        return parseInt(parts[parts.length - 1], 10) || 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }

    for (let i = 0; i < athletesList.length; i++) {
      const ath = athletesList[i];
      const birthDate = new Date(ath.birthDate);
      const birthYear = !isNaN(birthDate.getTime()) ? birthDate.getFullYear() : currentYear - 8;
      const targetTeam = this.getOrCreateTeamForAthlete(ath.birthDate || birthYear);
      const recommendedTeamId = targetTeam.id;

      const paddedNum = String(nextNum + i).padStart(3, '0');
      const playerId = `CFA-${currentYear}-${paddedNum}`;
      linkedPlayerIds.push(playerId);

      const newPlayer: Player = {
        id: playerId,
        fullName: ath.fullName.trim(),
        nickname: ath.nickname.trim() || ath.fullName.trim().split(' ')[0],
        photoUrl: ath.photoUrl || '',
        birthDate: ath.birthDate,
        birthPlace: ath.birthPlace || '',
        birthYear,
        gender: ath.gender || 'Laki-laki',
        address: ath.address || '',
        school: ath.school || '',
        schoolGrade: ath.schoolGrade || '',
        joinDate: now.split('T')[0],
        teamId: recommendedTeamId,
        primaryPosition: ath.primaryPosition,
        secondaryPosition: ath.secondaryPosition || '',
        dominantFoot: ath.dominantFoot || 'Kanan',
        playingExperience: ath.playingExperience || '',
        previousClub: ath.previousClub || '',
        additionalNotes: ath.additionalNotes || '',
        guardianName: input.parent.name.trim(),
        guardianContact: input.parent.phone?.trim() || input.parent.email.trim(),
        guardianRelation: input.parent.relationship || 'Wali',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const regId = `reg-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const regNumber = `REG-${currentYear}-${paddedNum}`;
      const registration: PlayerRegistration = {
        id: regId,
        registrationNumber: regNumber,
        fullName: newPlayer.fullName,
        nickname: newPlayer.nickname,
        birthPlace: newPlayer.birthPlace || '',
        birthDate: newPlayer.birthDate,
        birthYear,
        gender: newPlayer.gender || 'Laki-laki',
        photoUrl: newPlayer.photoUrl,
        address: newPlayer.address || '',
        school: newPlayer.school || '',
        schoolGrade: newPlayer.schoolGrade || '',
        primaryPosition: newPlayer.primaryPosition,
        secondaryPosition: newPlayer.secondaryPosition,
        dominantFoot: newPlayer.dominantFoot,
        playingExperience: newPlayer.playingExperience || '',
        previousClub: newPlayer.previousClub || '',
        additionalNotes: newPlayer.additionalNotes,
        parentId: userId,
        guardianName: input.parent.name.trim(),
        guardianContact: input.parent.phone?.trim() || input.parent.email.trim(),
        guardianRelation: input.parent.relationship || 'Wali',
        status: 'approved',
        assignedTeamId: recommendedTeamId,
        approvedPlayerId: playerId,
        reviewerName: 'Sistem Registrasi Terpadu CFA',
        reviewedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      newPlayer.registrationId = regId;

      createdPlayers.push(newPlayer);
      createdRegistrations.push(registration);
    }

    const newUser: User = {
      id: userId,
      name: input.parent.name.trim(),
      email: cleanEmail,
      role: 'parent',
      status: 'approved',
      password: input.parent.password || 'WaliCastindo2026!',
      phone: input.parent.phone || '',
      relationship: input.parent.relationship || 'Wali',
      avatarUrl: input.parent.avatarUrl?.trim() || undefined,
      linkedPlayerIds,
      sessionToken: token,
      createdAt: now,
      approvedAt: now,
      approvedBy: 'Sistem Registrasi Terpadu CFA',
    };

    this.db.players.push(...createdPlayers);
    this.db.playerRegistrations.push(...createdRegistrations);
    this.db.users.push(newUser);

    createdPlayers.forEach((p) => {
      this.addParentAuditLog({
        parentId: userId,
        parentName: newUser.name,
        playerId: p.id,
        playerName: p.fullName,
        action: 'LINK_APPROVED',
        fieldChanged: 'Registrasi Akun Wali & Atlet',
        oldValue: '-',
        newValue: `ID ${p.id} (${p.fullName}) - ${p.primaryPosition}`,
        notes: `Pendaftaran mandiri akun wali terpadu (anak ke-${linkedPlayerIds.indexOf(p.id) + 1} dari ${linkedPlayerIds.length})`,
      });
    });

    this.save(this.db);
    return {
      user: this.sanitizeUser(newUser),
      player: createdPlayers[0],
      players: createdPlayers,
      registration: createdRegistrations[0],
      registrations: createdRegistrations,
      token,
    };
  }

  public addAthleteForParent(
    parentId: string,
    athleteInput: {
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
    }
  ): { player: Player; user: User } {
    const parent = this.db.users.find((u) => u.id === parentId);
    if (!parent) {
      throw new Error('Akun orang tua tidak ditemukan.');
    }

    const currentYear = new Date().getFullYear();
    const birthDate = new Date(athleteInput.birthDate);
    const birthYear = !isNaN(birthDate.getTime()) ? birthDate.getFullYear() : currentYear - 8;
    const targetTeam = this.getOrCreateTeamForAthlete(athleteInput.birthDate || birthYear);
    const recommendedTeamId = targetTeam.id;

    const existingPlayerIds = this.db.players
      .map((p) => p.id)
      .filter((id) => id && id.startsWith(`CFA-${currentYear}-`));
    let nextNum = 1;
    if (existingPlayerIds.length > 0) {
      const numbers = existingPlayerIds.map((id) => {
        const parts = id.split('-');
        return parseInt(parts[parts.length - 1], 10) || 0;
      });
      nextNum = Math.max(...numbers) + 1;
    }
    const paddedNum = String(nextNum).padStart(3, '0');
    const playerId = `CFA-${currentYear}-${paddedNum}`;

    const now = new Date().toISOString();
    const newPlayer: Player = {
      id: playerId,
      fullName: athleteInput.fullName.trim(),
      nickname: athleteInput.nickname.trim() || athleteInput.fullName.trim().split(' ')[0],
      photoUrl: athleteInput.photoUrl || '',
      birthDate: athleteInput.birthDate,
      birthPlace: athleteInput.birthPlace || '',
      birthYear,
      gender: athleteInput.gender || 'Laki-laki',
      address: athleteInput.address || '',
      school: athleteInput.school || '',
      schoolGrade: athleteInput.schoolGrade || '',
      joinDate: now.split('T')[0],
      teamId: recommendedTeamId,
      primaryPosition: athleteInput.primaryPosition,
      secondaryPosition: athleteInput.secondaryPosition || '',
      dominantFoot: athleteInput.dominantFoot || 'Kanan',
      playingExperience: athleteInput.playingExperience || '',
      previousClub: athleteInput.previousClub || '',
      additionalNotes: athleteInput.additionalNotes || '',
      guardianName: parent.name,
      guardianContact: parent.phone || parent.email,
      guardianRelation: parent.relationship || 'Wali',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    if (!Array.isArray(parent.linkedPlayerIds)) {
      parent.linkedPlayerIds = [];
    }
    if (parent.linkedPlayerIds.length >= 4) {
      throw new Error('Batas maksimal tercapai: 1 akun orang tua/wali hanya dapat mendaftarkan maksimal 4 anak/pemain.');
    }
    parent.linkedPlayerIds.push(playerId);

    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const regNumber = `REG-${currentYear}-${paddedNum}`;
    const registration: PlayerRegistration = {
      id: regId,
      registrationNumber: regNumber,
      fullName: newPlayer.fullName,
      nickname: newPlayer.nickname,
      birthPlace: newPlayer.birthPlace || '',
      birthDate: newPlayer.birthDate,
      birthYear,
      gender: newPlayer.gender || 'Laki-laki',
      photoUrl: newPlayer.photoUrl,
      address: newPlayer.address || '',
      school: newPlayer.school || '',
      schoolGrade: newPlayer.schoolGrade || '',
      primaryPosition: newPlayer.primaryPosition,
      secondaryPosition: newPlayer.secondaryPosition,
      dominantFoot: newPlayer.dominantFoot,
      playingExperience: newPlayer.playingExperience || '',
      previousClub: newPlayer.previousClub || '',
      additionalNotes: newPlayer.additionalNotes,
      parentId: parent.id,
      guardianName: parent.name,
      guardianContact: parent.phone || parent.email,
      guardianRelation: parent.relationship || 'Wali',
      status: 'approved',
      assignedTeamId: recommendedTeamId,
      approvedPlayerId: playerId,
      reviewerName: 'Sistem Registrasi Terpadu CFA',
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    newPlayer.registrationId = regId;

    this.db.players.push(newPlayer);
    if (!Array.isArray(this.db.playerRegistrations)) {
      this.db.playerRegistrations = [];
    }
    this.db.playerRegistrations.push(registration);

    parent.status = 'approved';
    parent.approvedAt = now;
    parent.approvedBy = parent.approvedBy || 'Sistem Registrasi Terpadu CFA';

    this.addParentAuditLog({
      parentId: parent.id,
      parentName: parent.name,
      playerId,
      playerName: newPlayer.fullName,
      action: 'DIRECT_LINK',
      fieldChanged: 'Tambah Atlet Baru',
      oldValue: '-',
      newValue: `ID ${playerId} (${newPlayer.fullName})`,
      notes: 'Penambahan atlet baru oleh wali murid yang telah login',
    });

    this.save(this.db);
    return { player: newPlayer, user: this.sanitizeUser(parent) };
  }

  // --- Auth & Security Methods ---

  public sanitizeUser(u: User): User {
    const copy = { ...u };
    delete copy.password;
    return copy;
  }

  public getUserByToken(token: string): User | null {
    if (!token) return null;
    const cleanToken = token.trim();
    const user = this.db.users.find((u) => u.sessionToken === cleanToken);
    return user || null;
  }

  public getUserById(id: string): User | null {
    if (!id) return null;
    return this.db.users.find((u) => u.id === id) || null;
  }

  public isAdminSetupCompleted(): boolean {
    const hasAdmin = this.db.users.some(
      (u) => u.role === 'admin' && u.status === 'approved' && Boolean(u.password)
    );
    return hasAdmin && Boolean(this.db.meta?.adminSetupCompleted);
  }

  public setupInitialAdmin(input: {
    name: string;
    email: string;
    password?: string;
    setupKey: string;
  }): { user: User; token: string } {
    const masterKey = process.env.ADMIN_SETUP_KEY || 'CASTINDO-ADMIN-MASTER-2026';
    if (input.setupKey.trim() !== masterKey) {
      throw new Error('Kunci otorisasi setup administrator tidak valid.');
    }

    if (this.isAdminSetupCompleted()) {
      throw new Error('Setup administrator telah selesai dikonfigurasi sebelumnya.');
    }

    const cleanEmail = input.email.trim().toLowerCase();
    let admin = this.db.users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    const now = new Date().toISOString();
    const token = `cfa_tok_usr-1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (admin) {
      admin.name = input.name || admin.name;
      admin.role = 'admin';
      admin.status = 'approved';
      admin.password = input.password || admin.password || 'AdminCastindo2026!';
      admin.sessionToken = token;
      admin.approvedAt = now;
      admin.approvedBy = 'Setup Master Initializer';
    } else {
      admin = {
        id: `usr-admin-${Date.now()}`,
        name: input.name,
        email: input.email,
        role: 'admin',
        status: 'approved',
        password: input.password || 'AdminCastindo2026!',
        assignedTeamId: 'team-b',
        sessionToken: token,
        createdAt: now,
        approvedAt: now,
        approvedBy: 'Setup Master Initializer',
        avatarUrl: undefined,
      };
      this.db.users.push(admin);
    }

    this.db.meta.adminSetupCompleted = true;
    this.save(this.db);

    return { user: this.sanitizeUser(admin), token };
  }

  public recoverOfficialAdmin(): User {
    const officialEmail = 'sukriwil04@gmail.com';
    let admin = this.db.users.find(
      (u) =>
        u &&
        (u.id === 'usr-1' ||
          (typeof u.email === 'string' && u.email.trim().toLowerCase() === officialEmail))
    );

    const now = new Date().toISOString();
    const token = `cfa_tok_usr-1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (admin) {
      admin.id = 'usr-1';
      admin.name = 'Mohammad Wildan Kemal Pasha';
      admin.email = officialEmail;
      admin.role = 'admin';
      admin.status = 'approved';
      admin.password = 'AdminCastindo2026!';
      admin.assignedTeamId = admin.assignedTeamId || 'team-b';
      admin.sessionToken = admin.sessionToken || token;
      admin.approvedAt = admin.approvedAt || now;
      admin.approvedBy = 'Sistem Pemulihan Administrator CFA';
    } else {
      admin = {
        id: 'usr-1',
        name: 'Mohammad Wildan Kemal Pasha',
        email: officialEmail,
        role: 'admin',
        status: 'approved',
        password: 'AdminCastindo2026!',
        assignedTeamId: 'team-b',
        sessionToken: token,
        createdAt: '2026-08-01T08:00:00.000Z',
        approvedAt: now,
        approvedBy: 'Sistem Pemulihan Administrator CFA',
        avatarUrl: undefined,
      };
      this.db.users.unshift(admin);
    }

    this.db.meta.adminSetupCompleted = true;
    this.save(this.db);
    return admin;
  }

  public loginUser(
    email: string,
    password?: string
  ): { user: User; token: string } {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Email atau nomor kontak wajib diisi.');
    }

    let user = this.db.users.find(
      (u) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === cleanEmail
    );

    // Self-healing: if the requested email is the official admin email and user is not yet present
    if (!user && (cleanEmail === 'sukriwil04@gmail.com' || cleanEmail === 'admin@castindo.ac.id')) {
      user = this.recoverOfficialAdmin();
    }

    if (!user) {
      throw new Error('Akun dengan email tersebut tidak ditemukan.');
    }

    if (user.password) {
      if (!password) {
        throw new Error('Silakan masukkan kata sandi Anda.');
      }
      if (user.password !== password) {
        throw new Error('Kata sandi salah. Silakan coba lagi.');
      }
    }

    const token = `cfa_tok_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    user.sessionToken = token;
    this.save(this.db);

    return { user: this.sanitizeUser(user), token };
  }

  public approveParentAccount(userId: string, adminName: string = 'Admin'): User | null {
    const user = this.db.users.find((u) => u.id === userId && u.role === 'parent');
    if (!user) return null;

    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = adminName;
    user.rejectionReason = undefined;

    this.addParentAuditLog({
      parentId: user.id,
      parentName: user.name,
      playerId: user.linkedPlayerIds?.[0] || '-',
      playerName: '-',
      action: 'APPROVE_PARENT_ACCOUNT',
      fieldChanged: 'Status Akun Wali',
      oldValue: 'pending',
      newValue: 'approved',
      notes: `Akun disetujui resmi oleh ${adminName}`,
    });

    this.save(this.db);
    return this.sanitizeUser(user);
  }

  public rejectParentAccount(
    userId: string,
    reason: string,
    adminName: string = 'Admin'
  ): User | null {
    const user = this.db.users.find((u) => u.id === userId && u.role === 'parent');
    if (!user) return null;

    user.status = 'rejected';
    user.rejectionReason = reason;

    this.addParentAuditLog({
      parentId: user.id,
      parentName: user.name,
      playerId: '-',
      playerName: '-',
      action: 'REJECT_PARENT_ACCOUNT',
      fieldChanged: 'Status Akun Wali',
      oldValue: user.status || 'pending',
      newValue: 'rejected',
      notes: `Alasan penolakan: ${reason} (oleh ${adminName})`,
    });

    this.save(this.db);
    return this.sanitizeUser(user);
  }

  // --- Scoped Access Filtering for Database and Players ---

  public getScopedPlayers(user: User): Player[] {
    if (user.role === 'admin' || user.role === 'head_coach' || user.role === 'assistant_coach') {
      return (this.db.players || []).filter(Boolean);
    }
    if (user.role === 'parent') {
      const linked = user.linkedPlayerIds || [];
      return (this.db.players || []).filter((p) => p && linked.includes(p.id));
    }
    return [];
  }

  public getScopedDatabase(user: User): AcademyDatabase {
    // Staff roles: full database with passwords sanitized
    if (user.role === 'admin' || user.role === 'head_coach' || user.role === 'assistant_coach') {
      return {
        ...this.db,
        users: (this.db.users || []).filter(Boolean).map((u) => this.sanitizeUser(u)),
      };
    }

    // Parent role: strictly scoped to own child and own account
    const linked = user.linkedPlayerIds || [];

    return {
      users: [this.sanitizeUser(user)],
      teams: this.db.teams || [],
      players: (this.db.players || []).filter((p) => p && linked.includes(p.id)),
      playerRegistrations: (this.db.playerRegistrations || []).filter(
        (r) =>
          r &&
          ((user.phone && r.guardianContact === user.phone) ||
            r.guardianName === user.name ||
            r.parentId === user.id ||
            linked.includes(r.approvedPlayerId || ''))
      ),
      trainingSessions: this.db.trainingSessions || [],
      attendanceRecords: (this.db.attendanceRecords || []).filter((a) => a && linked.includes(a.playerId)),
      trainingLoadRecords: (this.db.trainingLoadRecords || []).filter((t) => t && linked.includes(t.playerId)),
      evaluations: (this.db.evaluations || []).filter(
        (e) => e && linked.includes(e.playerId) && e.publishedToParents !== false
      ),
      motorTests: this.db.motorTests || [],
      motorTestResults: (this.db.motorTestResults || []).filter(
        (m) => m && linked.includes(m.playerId) && m.publishedToParents !== false
      ),
      ltadGoals: (this.db.ltadGoals || []).filter(
        (g) => g && linked.includes(g.playerId) && g.publishedToParents !== false
      ),
      promotionReviews: [], // Never expose coach promotion evaluations to parents
      parentInviteCodes: (this.db.parentInviteCodes || []).filter((i) =>
        i && linked.includes(i.playerId)
      ),
      parentLinkRequests: (this.db.parentLinkRequests || []).filter(
        (r) => r && r.parentId === user.id
      ),
      parentAuditLogs: (this.db.parentAuditLogs || []).filter(
        (l) => l && l.parentId === user.id
      ),
      childIdentityChangeRequests: (this.db.childIdentityChangeRequests || []).filter(
        (c) => c && c.parentId === user.id
      ),
      matches: this.db.matches || [],
      meta: this.db.meta,
    };
  }

  public getMatches(): MatchRecord[] {
    return this.db.matches || [];
  }
}


