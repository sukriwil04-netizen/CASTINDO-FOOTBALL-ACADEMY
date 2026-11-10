export type UserRole = 'admin' | 'head_coach' | 'assistant_coach' | 'parent';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  assignedTeamId?: string;
  phone?: string;
  password?: string;
  linkedPlayerIds?: string[]; // IDs of children this parent is linked to
  relationship?: string; // 'Ayah' | 'Ibu' | 'Wali'
  status?: UserStatus; // For parent accounts: 'pending' (waiting for admin verification), 'approved', 'rejected'
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  sessionToken?: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  code: string; // 'TIM_B', 'TIM_A', etc.
  name: string;
  ageGroup: string; // 'U-8 / U-9 (Lahir 2016-2017)'
  format: string; // '7v7'
  weeklySessionsCount: number; // 3
  description: string;
  active: boolean;
}

export type DominantFoot = 'Kanan' | 'Kiri' | 'Keduanya';

export type PlayerStatus = 'active' | 'archived';

export interface Player {
  id: string; // 'CFA-2026-001'
  fullName: string;
  nickname: string;
  photoUrl?: string;
  birthDate: string; // 'YYYY-MM-DD'
  birthPlace?: string; // Tempat lahir
  birthYear: number; // auto computed e.g. 2016
  gender?: 'Laki-laki' | 'Perempuan';
  address?: string; // Alamat domisili
  school?: string; // Sekolah
  schoolGrade?: string; // Kelas
  joinDate: string; // 'YYYY-MM-DD'
  teamId: string;
  jerseyNumber?: number; // Nomor punggung atlet akademi
  primaryPosition: string; // 'Kiper', 'Bek Tengah', 'Bek Sayap Kanan', 'Bek Sayap Kiri', 'Gelandang', 'Penyerang Sayap', 'Penyerang Tengah'
  secondaryPosition?: string;
  dominantFoot: DominantFoot;
  playingExperience?: string; // Lama pengalaman bermain sepak bola
  previousClub?: string; // Klub atau akademi sebelumnya
  additionalNotes?: string; // Keterangan tambahan
  guardianName: string;
  guardianContact: string; // phone/WA (restricted access)
  guardianRelation: string; // 'Ayah' | 'Ibu' | 'Wali'
  status: PlayerStatus;
  coachNotes?: string;
  coachNotesForParent?: string; // Catatan pelatih untuk orang tua
  parentRecommendations?: string; // Rekomendasi/latihan mandiri untuk orang tua
  individualTarget?: string;
  registrationId?: string; // Link to self-service registration
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export type TrainingFocus =
  | 'Koordinasi & Keterampilan Gerak'
  | 'Dribbling'
  | 'Passing & Kontrol Bola'
  | 'Finishing'
  | 'Situasi 1v1'
  | 'Small-Sided Games (SSG)'
  | 'Pemahaman Taktik'
  | 'Permainan 7v7'
  | 'Transisi Menyerang & Bertahan'
  | 'Pemulihan & Intensitas Rendah';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface TrainingSession {
  id: string; // 'SES-20261012-01'
  date: string; // 'YYYY-MM-DD'
  time: string; // '16:00 - 17:30'
  teamId: string;
  coachName: string;
  focus: TrainingFocus;
  objective: string;
  drillDescription: string;
  plannedDurationMinutes: number; // e.g. 75
  actualDurationMinutes: number;
  equipment: string; // 'Bola (15), Marker (30)'
  evaluationNotes?: string;
  status: SessionStatus;
  createdAt: string;
  isDemo?: boolean;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'sick' | 'absent';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  playerId: string;
  status: AttendanceStatus;
  actualMinutes: number;
  notes?: string;
  recordedAt: string;
}

export interface TrainingLoadRecord {
  id: string;
  sessionId: string;
  playerId: string;
  sessionDate: string;
  actualDurationMinutes: number;
  rpe: number | null; // Scale 1 to 10 (Foster / Borg Session-RPE), null if not filled
  trainingLoad: number | null; // actualDurationMinutes * rpe (AU), null if rpe is null
  playerResponseNotes?: string;
  recordedAt: string;
}

export type ScaleScore = 1 | 2 | 3 | 4 | null; // 1-4 scale, null = belum dinilai

export interface TechnicalTacticalEvaluation {
  id: string;
  playerId: string;
  date: string;
  context: 'Latihan' | 'Pertandingan 7v7' | 'Internal Game';
  evaluatorName: string;
  // Technical scores
  dribblingScore: ScaleScore;
  passingScore: ScaleScore;
  ballControlScore: ScaleScore;
  firstTouchScore: ScaleScore;
  finishingScore: ScaleScore;
  ballShieldingScore: ScaleScore;
  oneVsOneScore: ScaleScore;
  // Tactical scores
  bodyOrientationScore: ScaleScore;
  supportAfterPassScore: ScaleScore;
  spaceUtilizationScore: ScaleScore;
  decisionMakingScore: ScaleScore;
  attackingPositionScore: ScaleScore;
  defendingPositionScore: ScaleScore;
  transitionScore: ScaleScore;
  understanding7v7Score: ScaleScore;

  observedEvidence: string;
  strengths: string;
  improvementFocus: string;
  publishedToParents?: boolean; // Apakah dipublikasikan untuk dilihat orang tua
  createdAt: string;
}

export type MotorTestCategory =
  | 'Koordinasi'
  | 'Keseimbangan'
  | 'Keterampilan Gerak Dasar'
  | 'Perubahan Arah (Agility)'
  | 'Sprint Jarak Pendek'
  | 'Keterampilan Bola'
  | 'Tes Kustom';

export interface MotorTest {
  id: string;
  name: string;
  category: MotorTestCategory;
  objective: string;
  protocol: string;
  unit: string; // 'detik', 'cm', 'repetisi', 'skor (1-10)'
  equipment: string; // 'Bola & Marker', 'Marker & Stopwatch'
  higherIsBetter: boolean;
}

export interface MotorTestResult {
  id: string;
  playerId: string;
  testId: string;
  date: string;
  numericValue: number;
  unit: string;
  executionCondition: string; // 'Lapangan rumput kering', 'Suhu 28C'
  notes?: string;
  testerName: string;
  publishedToParents?: boolean;
  createdAt: string;
}

export type LtadDomain =
  | 'Motorik'
  | 'Teknik'
  | 'Taktik'
  | 'Fisik'
  | 'Pemahaman Permainan'
  | 'Sosial & Perilaku Belajar';

export type LtadStatus =
  | 'Belum Mulai'
  | 'Berjalan'
  | 'Berkembang'
  | 'Tercapai'
  | 'Perlu Ditinjau';

export interface LtadGoal {
  id: string;
  playerId: string;
  setDate: string;
  reviewDate: string;
  domain: LtadDomain;
  baseline: string;
  target: string;
  indicator: string;
  supportingDrills: string;
  status: LtadStatus;
  evidenceNotes?: string;
  nextGoal?: string;
  publishedToParents?: boolean;
  createdAt: string;
}

export type PromotionRecommendation =
  | 'Belum Ditinjau'
  | 'Perlu Target Perkembangan Lanjutan'
  | 'Siap Mengikuti Sesi Observasi Tim A'
  | 'Direkomendasikan untuk Dibahas dengan Staf'
  | 'Ditinjau Ulang Periode Berikutnya';

export interface PromotionReview {
  id: string;
  playerId: string;
  reviewDate: string;
  coachesInvolved: string[]; // ['Coach Rian', 'Coach Doni']
  // Evaluation aspects (1-4 scale)
  techUnderPressure: number; // 1-4
  tacticalPrinciplesTimA: number; // 1-4
  decisionMaking: number; // 1-4
  motorDemands: number; // 1-4
  performanceConsistency: number; // 1-4
  learningAttitude: number; // 1-4
  adaptabilityToIntensity: number; // 1-4

  observedEvidence: string;
  playerStrengths: string;
  developmentNeeds: string;
  recommendation: PromotionRecommendation;
  followUpPlan: string;
  nextReviewDate?: string;
  createdAt: string;
}

export type RegistrationStatus = 'pending' | 'needs_revision' | 'approved' | 'rejected';

export interface PlayerRegistration {
  id: string; // 'reg-xxx'
  registrationNumber: string; // e.g. 'REG-2026-001'
  fullName: string;
  nickname: string;
  birthPlace: string;
  birthDate: string; // 'YYYY-MM-DD'
  birthYear: number;
  gender: 'Laki-laki' | 'Perempuan';
  photoUrl?: string;
  address: string;
  school: string;
  schoolGrade: string;

  // Informasi Sepak Bola
  primaryPosition: string;
  secondaryPosition?: string;
  dominantFoot: DominantFoot;
  playingExperience: string;
  previousClub?: string;

  // Parent / Guardian Account Link
  parentId?: string; // Linked parent user ID
  guardianName?: string;
  guardianContact?: string; // Phone / WhatsApp
  guardianRelation?: string; // 'Ayah' | 'Ibu' | 'Wali'
  ageGroupCategory?: string; // e.g. 'U-9' (auto computed)
  additionalNotes?: string;

  // Status & Alur Verifikasi
  status: RegistrationStatus;
  adminNotes?: string;
  reviewerName?: string;
  reviewedAt?: string;
  assignedTeamId?: string;
  approvedPlayerId?: string; // Created CFA ID e.g. 'CFA-2026-001'

  // Indikator Data Ganda
  duplicateWarning?: {
    isDuplicate: boolean;
    matchedPlayerId?: string;
    matchedPlayerName?: string;
    message?: string;
  };

  createdAt: string;
  updatedAt: string;
}

// --- Parent Portal & Performance Monitoring Types ---

export interface ParentInviteCode {
  id: string; // 'inv-xxx'
  code: string; // e.g. 'INV-CFA-2026-001'
  playerId: string;
  playerName: string;
  relationship?: string; // 'Ayah' | 'Ibu' | 'Wali'
  isUsed: boolean;
  usedByParentId?: string;
  usedByParentName?: string;
  usedAt?: string;
  createdBy: string;
  createdAt: string;
}

export type ParentLinkStatus = 'pending' | 'approved' | 'rejected';

export interface ParentLinkRequest {
  id: string; // 'plr-xxx'
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  relationship: string; // 'Ayah' | 'Ibu' | 'Wali'
  playerId: string;
  playerName: string;
  inviteCodeUsed?: string;
  status: ParentLinkStatus;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ParentAuditLog {
  id: string;
  parentId: string;
  parentName: string;
  playerId: string;
  playerName: string;
  action:
    | 'UPDATE_BASIC_INFO'
    | 'UPLOAD_PHOTO'
    | 'REQUEST_IDENTITY_CHANGE'
    | 'APPROVE_IDENTITY_CHANGE'
    | 'LINK_APPROVED'
    | 'DIRECT_LINK'
    | 'APPROVE_PARENT_ACCOUNT'
    | 'REJECT_PARENT_ACCOUNT';
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  notes?: string;
}

export type IdentityChangeStatus = 'pending' | 'approved' | 'rejected';

export interface ChildIdentityChangeRequest {
  id: string;
  parentId: string;
  parentName: string;
  playerId: string;
  playerName: string;
  field: 'fullName' | 'birthDate' | 'birthPlace' | 'gender';
  currentValue: string;
  proposedValue: string;
  reason: string;
  status: IdentityChangeStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface MatchRecord {
  id: string; // e.g. 'MATCH-2026-001'
  date: string; // 'YYYY-MM-DD'
  time: string; // '08:30 WIB'
  teamId: string; // 'team-a' | 'team-b'
  opponentName: string; // e.g. 'Bintang Muda FC U-9'
  venue: string; // 'Lapangan Mini CFA Surabaya'
  format: string; // '7v7'
  competitionName: string; // e.g. 'Laga Persahabatan (Friendly Match)'
  homeScore: number;
  awayScore: number;
  status: 'completed' | 'scheduled';
  scorers?: string[];
  teamStats?: {
    shotsOnTarget: number;
    possession: number; // percentage e.g. 58
    corners: number;
    saves: number;
  };
  coachNotes?: string;
  mvpPlayerId?: string;
  mvpPlayerName?: string;
  createdAt: string;
}

export interface AcademyDatabase {
  users: User[];
  teams: Team[];
  players: Player[];
  playerRegistrations: PlayerRegistration[];
  trainingSessions: TrainingSession[];
  attendanceRecords: AttendanceRecord[];
  trainingLoadRecords: TrainingLoadRecord[];
  evaluations: TechnicalTacticalEvaluation[];
  motorTests: MotorTest[];
  motorTestResults: MotorTestResult[];
  ltadGoals: LtadGoal[];
  promotionReviews: PromotionReview[];
  matches?: MatchRecord[];
  parentInviteCodes?: ParentInviteCode[];
  parentLinkRequests?: ParentLinkRequest[];
  parentAuditLogs?: ParentAuditLog[];
  childIdentityChangeRequests?: ChildIdentityChangeRequest[];
  meta: {
    lastUpdated: string;
    version: string;
    adminSetupCompleted?: boolean;
  };
}


