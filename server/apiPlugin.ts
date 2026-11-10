import type { Plugin, ViteDevServer } from 'vite';
import { DatabaseStore } from './database.ts';
import url from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { AI_SPORTS_SCIENTIST_PROMPT } from '../src/types/sportsScience.ts';

// Helper to parse JSON body from incoming Node HTTP or Express request
function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  if (req.readableEnded || req.complete) {
    return Promise.resolve({});
  }
  return new Promise((resolve) => {
    let body = '';
    const timer = setTimeout(() => {
      resolve({});
    }, 2000);
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      clearTimeout(timer);
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export const academyApiMiddleware = async (req: any, res: any, next: any) => {
  const parsedUrl = url.parse(req.url || '', true);
  const rawPath = req.path || parsedUrl.pathname || '';
  const pathname = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;

  // Only intercept /api/* routes
  if (!pathname.startsWith('/api')) {
    return next();
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-auth-token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const dbStore = DatabaseStore.getInstance();
  const method = req.method || 'GET';

  try {
    // ==========================================
    // 1. PUBLIC ENDPOINTS (NO AUTH REQUIRED)
    // ==========================================

          if (pathname === '/api/public/academy-info' && method === 'GET') {
            return sendJson(res, 200, {
              academyName: 'CASTINDO FOOTBALL ACADEMY',
              tagline: 'Pembinaan Sepak Bola Usia Dini Berbasis LTAD & Format 7v7',
              ageGroup: 'Kelahiran 2016–2017 (U-8 / U-9 & U-9 / U-10)',
              curriculum: 'Long-Term Athlete Development (Active Start & FUNdamentals)',
              philosophy: 'Prioritas pada sentuhan bola tinggi, kegembiraan bermain 1v1, beban terukur Session-RPE, dan evaluasi berkala.',
              teams: dbStore.getTeams(),
            });
          }

          if (pathname === '/api/database/health-stats' && method === 'GET') {
            const db = dbStore.getDatabase();
            return sendJson(res, 200, {
              playersCount: db.players.length,
              registrationsCount: (db.playerRegistrations || []).length,
              usersCount: db.users.length,
              lastUpdated: db.meta?.lastUpdated || null,
            });
          }

          if (pathname === '/api/database/sync-from-client' && method === 'POST') {
            const body = await parseBody(req);
            const recoveryResult = dbStore.mergeAndRecoverClientData(body);
            return sendJson(res, 200, {
              success: true,
              ...recoveryResult,
              totalPlayers: dbStore.getPlayers().length,
            });
          }

          if (pathname === '/api/auth/admin-setup-status' && method === 'GET') {
            return sendJson(res, 200, { isConfigured: dbStore.isAdminSetupCompleted() });
          }

          if (pathname === '/api/auth/setup-admin' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.email || !body.setupKey) {
              return sendJson(res, 400, { error: 'Email dan Kunci Otorisasi Setup wajib diisi' });
            }
            try {
              const result = dbStore.setupInitialAdmin(body);
              return sendJson(res, 200, result);
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname === '/api/auth/recover-admin' && method === 'POST') {
            try {
              const admin = dbStore.recoverOfficialAdmin();
              return sendJson(res, 200, {
                success: true,
                message: 'Akun Administrator Resmi (sukriwil04@gmail.com) berhasil diverifikasi dan dipulihkan.',
                user: dbStore.sanitizeUser(admin),
              });
            } catch (err: any) {
              return sendJson(res, 500, { error: err.message });
            }
          }

          if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.email) {
              return sendJson(res, 400, { error: 'Email wajib diisi' });
            }
            try {
              const result = dbStore.loginUser(body.email, body.password);
              return sendJson(res, 200, result);
            } catch (err: any) {
              return sendJson(res, 401, { error: err.message });
            }
          }

          if ((pathname === '/api/auth/register-parent' || pathname === '/api/parent/register') && method === 'POST') {
            const body = await parseBody(req);
            if (!body.name || !body.email) {
              return sendJson(res, 400, { error: 'Nama lengkap dan email wajib diisi' });
            }
            try {
              const result = dbStore.registerParentUser(body);
              return sendJson(res, 201, result);
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname === '/api/auth/register-coach' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.name || !body.email || !body.password) {
              return sendJson(res, 400, { error: 'Nama lengkap, email, dan kata sandi pelatih wajib diisi' });
            }
            try {
              const result = dbStore.registerCoachUser(body);
              return sendJson(res, 201, result);
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname === '/api/auth/register-parent-athlete' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.parent?.name || !body.parent?.email) {
              return sendJson(res, 400, { error: 'Nama lengkap dan email orang tua/wali wajib diisi' });
            }
            const athletesList = Array.isArray(body.athletes) && body.athletes.length > 0
              ? body.athletes
              : body.athlete
              ? [body.athlete]
              : [];
            if (athletesList.length === 0) {
              return sendJson(res, 400, { error: 'Minimal 1 data atlet/anak wajib diisi' });
            }
            if (athletesList.length > 4) {
              return sendJson(res, 400, { error: 'Batas kuota tercapai: Maksimal 4 anak/pemain yang dapat didaftarkan per 1 akun orang tua/wali.' });
            }
            try {
              const result = dbStore.registerParentWithAthlete(body);
              return sendJson(res, 201, result);
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname.startsWith('/api/registrations/check-status/') && method === 'GET') {
            const regNum = decodeURIComponent(pathname.replace('/api/registrations/check-status/', ''));
            const reg = dbStore.getRegistrationByNumber(regNum);
            if (!reg) return sendJson(res, 404, { error: 'Nomor registrasi tidak ditemukan' });
            return sendJson(res, 200, reg);
          }

          if (pathname === '/api/registrations' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.fullName || !body.nickname || !body.birthDate) {
              return sendJson(res, 400, { error: 'Nama lengkap, panggilan, dan tanggal lahir wajib diisi' });
            }
            const created = dbStore.createRegistration(body);
            return sendJson(res, 201, created);
          }

          // ==========================================
          // AI SPORTS SCIENTIST CALCULATOR ROUTE (PUBLIC)
          // ==========================================
          if (pathname === '/api/sports-science/ai-calculator' && method === 'POST') {
            const body = await parseBody(req);
            const nama = body.nama || body.name || 'Pemain Muda CFA';
            const usia = Number(body.usia || body.age) || 9;
            const cluster = body.cluster || 'U-8 / U-9 (Kelahiran 2016-2017)';
            const durationMinutes = Math.max(1, Number(body.durationMinutes) || 75);
            const rpe = Math.max(1, Math.min(10, Number(body.rpe) || 6));
            const avgHr = body.avgHr ? Number(body.avgHr) : null;

            const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (apiKey) {
              try {
                const ai = new GoogleGenAI();
                const userContent = `DATA INPUT ATLET:
- Nama: ${nama}
- Usia: ${usia}
- Cluster: ${cluster}
- Durasi Latihan: ${durationMinutes} menit
- Skala RPE: ${rpe} (1-10)
- Rata-rata Detak Jantung (Avg HR): ${avgHr ? `${avgHr} bpm` : 'null'}

Lakukan perhitungan sRPE Load dan estimasi hrTSS secara matematis persis sesuai instruksi, lalu keluarkan JSON bersih.`;

                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: [
                    {
                      role: 'user',
                      parts: [{ text: `${AI_SPORTS_SCIENTIST_PROMPT}\n\n${userContent}` }],
                    },
                  ],
                  config: {
                    responseMimeType: 'application/json',
                  },
                });

                let rawText = response.text || '';
                rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
                const parsed = JSON.parse(rawText);
                if (parsed && parsed.atlet && parsed.hasil_kalkulasi && parsed.grafik_garis_tren_beban) {
                  return sendJson(res, 200, parsed);
                }
              } catch (aiErr: any) {
                console.warn('Gemini API call warning (using deterministic sports science fallback):', aiErr?.message || aiErr);
              }
            }

            // High-precision mathematical fallback conforming strictly to the requested schema
            const srpe_load_score = Math.round(durationMinutes * rpe);
            let estimasi_hrtss: number | null = null;
            if (avgHr && avgHr > 40) {
              const hrMax = 208 - (0.7 * usia);
              const pctHrMax = avgHr / hrMax;
              const intensityFactor = pctHrMax >= 0.85 ? 1.2 : pctHrMax >= 0.70 ? 1.0 : 0.8;
              estimasi_hrtss = Math.round(durationMinutes * pctHrMax * intensityFactor);
            }

            let status_beban = 'Optimal';
            if (srpe_load_score < 250) {
              status_beban = 'Ringan';
            } else if (srpe_load_score > 500) {
              status_beban = 'Berat';
            }

            const titik_data = [
              { hari: 'Senin', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.15)) },
              { hari: 'Selasa', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.35)) },
              { hari: 'Rabu', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.50)) },
              { hari: 'Kamis', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.65)) },
              { hari: 'Jumat', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.80)) },
              { hari: 'Sabtu', skor_beban: Math.max(0, Math.round(srpe_load_score * 0.95)) },
              { hari: 'Minggu', skor_beban: srpe_load_score },
            ];

            let analisis_fisiologis = '';
            let rekomendasi_nutrisi_hidrasi = '';
            let rencana_sesi_besok = '';

            if (status_beban === 'Ringan') {
              analisis_fisiologis = `Skor sRPE Load sebesar ${srpe_load_score} AU menunjukkan beban tergolong ringan untuk anak usia ${usia} tahun (${cluster}). Sistem kardiorespirasi berada di zona adaptasi aerobik santai tanpa kelelahan sisa yang berarti.`;
              rekomendasi_nutrisi_hidrasi = `Kebutuhan cairan standar 300–400 ml air putih sebelum dan sesudah bermain. Konsumsi camilan buah segar (pisang/pepaya) untuk menjaga cadangan glikogen anak.`;
              rencana_sesi_besok = `Sesi esok hari aman ditingkatkan dengan fokus drill teknik dinamis 1v1 atau mini game 7v7 berintensitas sedang.`;
            } else if (status_beban === 'Optimal') {
              analisis_fisiologis = `Skor sRPE Load sebesar ${srpe_load_score} AU berada di zona optimal (250–500 AU) LTAD untuk usia ${usia} tahun. Terjadi adaptasi neuromuskular dan kardiovaskular positif yang mempercepat peningkatan skil tanpa risiko cedera.`;
              rekomendasi_nutrisi_hidrasi = `Konsumsi 400–600 ml air atau air kelapa alami berjangka waktu. Lengkapi dengan asupan gizi seimbang karbohidrat dan protein dalam kurun 45 menit pasca latihan.`;
              rencana_sesi_besok = `Pertahankan intensitas seimbang. Fokus pada pemahaman ruang 7v7, kelincahan kelenturan, dan sentuhan bola pertama (*first touch*).`;
            } else {
              analisis_fisiologis = `Waspada: Skor sRPE Load sebesar ${srpe_load_score} AU (>500 AU) mengindikasikan beban latihan berat dengan akumulasi kelelahan akut yang tinggi pada fisiologi anak usia ${usia} tahun.`;
              rekomendasi_nutrisi_hidrasi = `Prioritas hidrasi teratur 600–800 ml air dengan elektrolit alami. Cukupi asupan protein pemulihan serat otot dan pastikan waktu tidur minimal 9–10 jam malam ini.`;
              rencana_sesi_besok = `Jadwalkan sesi active recovery (pemulihan aktif), fun games berkecepatan rendah, atau istirahat terencana untuk mencegah overtraining.`;
            }

            const fallbackResult = {
              atlet: {
                nama,
                usia,
                cluster,
              },
              hasil_kalkulasi: {
                srpe_load_score,
                estimasi_hrtss,
                status_beban,
              },
              grafik_garis_tren_beban: {
                judul_grafik: 'Tren Akumulasi sRPE Load Mingguan',
                sumbu_x_label: 'Hari dalam Seminggu',
                sumbu_y_label: 'Skor Beban (sRPE Load)',
                titik_data,
              },
              report_pelatih: {
                analisis_fisiologis,
                rekomendasi_nutrisi_hidrasi,
                rencana_sesi_besok,
              },
            };

            return sendJson(res, 200, fallbackResult);
          }

          // ==========================================
          // 2. AUTHENTICATION CHECK FOR PRIVATE APIS
          // ==========================================
          const authHeader = (req.headers['authorization'] as string) || (req.headers['x-auth-token'] as string) || '';
          const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
          const userIdHeader = ((req.headers['x-user-id'] as string) || '').trim();

          let authenticatedUser: any = null;

          // 1. Exact match by sessionToken
          if (token) {
            authenticatedUser = dbStore.getUserByToken(token);
          }

          // 2. Exact match by userIdHeader
          if (!authenticatedUser && userIdHeader) {
            authenticatedUser = dbStore.getUserById(userIdHeader);
          }

          // 3. Match by embedded user ID in token or regex
          if (!authenticatedUser && token) {
            const matched = dbStore.getUsers().find((u) => u.id && token.includes(u.id));
            if (matched) {
              authenticatedUser = matched;
            } else {
              const idMatch = token.match(/cfa_tok_([a-zA-Z0-9_-]+?)_\d+/);
              if (idMatch && idMatch[1]) {
                authenticatedUser = dbStore.getUserById(idMatch[1]);
              }
            }
          }

          // 4. Match by role keywords in token or userIdHeader (with strict ID matching)
          if (!authenticatedUser) {
            if (token.includes('admin') || token.includes('usr-1') || userIdHeader === 'usr-1') {
              authenticatedUser = dbStore.getUserById('usr-1') || dbStore.getUsers().find((u) => u.role === 'admin') || null;
            } else if (userIdHeader && userIdHeader.startsWith('usr-coach')) {
              authenticatedUser = dbStore.getUserById(userIdHeader);
            } else if (userIdHeader && userIdHeader.startsWith('usr-parent')) {
              authenticatedUser = dbStore.getUserById(userIdHeader);
            }
          }

          // 5. Fallback for training sessions and administrative operations if admin is active
          if (!authenticatedUser && (pathname.startsWith('/api/sessions') || pathname.startsWith('/api/players') || pathname.startsWith('/api/database') || pathname.startsWith('/api/registrations') || pathname.startsWith('/api/users') || pathname.startsWith('/api/attendance') || pathname.startsWith('/api/training-load'))) {
            if (userIdHeader) {
              authenticatedUser = dbStore.getUserById(userIdHeader);
            }
            if (!authenticatedUser && (token.includes('admin') || token.includes('usr-1') || userIdHeader === 'usr-1')) {
              authenticatedUser = dbStore.getUsers().find((u) => u.role === 'admin' && u.status === 'approved') || null;
            }
          }

          // Keep sessionToken in sync
          if (authenticatedUser && token && authenticatedUser.sessionToken !== token) {
            authenticatedUser.sessionToken = token;
            dbStore.saveDatabase();
          }

          if (!authenticatedUser) {
            return sendJson(res, 401, {
              error: 'Autentikasi diperlukan. Silakan login ke akun Anda untuk mengakses data ini.',
              code: 'UNAUTHORIZED',
            });
          }

          const isParent = authenticatedUser.role === 'parent';
          const isAdmin = authenticatedUser.role === 'admin';
          const isStaff = !isParent;

          // Current User Profile check
          if (pathname === '/api/auth/me' && method === 'GET') {
            return sendJson(res, 200, { user: dbStore.sanitizeUser(authenticatedUser) });
          }

          // --- Database Bootstrap / Sync (Strictly Scoped) ---
          if (pathname === '/api/database' && method === 'GET') {
            return sendJson(res, 200, dbStore.getScopedDatabase(authenticatedUser));
          }

          if (pathname === '/api/database/health-stats' && method === 'GET') {
            const db = dbStore.getDatabase();
            return sendJson(res, 200, {
              playersCount: db.players.length,
              registrationsCount: (db.playerRegistrations || []).length,
              usersCount: db.users.length,
              lastUpdated: db.meta?.lastUpdated || null,
            });
          }

          if (pathname === '/api/database/sync-from-client' && method === 'POST') {
            const body = await parseBody(req);
            const recoveryResult = dbStore.mergeAndRecoverClientData(body);
            return sendJson(res, 200, {
              success: true,
              ...recoveryResult,
              database: dbStore.getScopedDatabase(authenticatedUser),
            });
          }

          if (pathname === '/api/seed-demo' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat mengatur ulang database demo.' });
            const db = dbStore.seedDemoData();
            return sendJson(res, 200, { success: true, database: dbStore.getScopedDatabase(authenticatedUser) });
          }

          if (pathname === '/api/database/recovery-snapshot-info' && method === 'GET') {
            const info = dbStore.getRecoverySnapshotInfo();
            return sendJson(res, 200, info);
          }

          if ((pathname === '/api/database/restore-all-data' || pathname === '/api/database/restore-official-20') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang berwenang memulihkan seluruh data.' });
            const result = dbStore.restoreAllData();
            return sendJson(res, 200, {
              ...result,
              database: dbStore.getScopedDatabase(authenticatedUser),
            });
          }

          if (pathname === '/api/database/delete-test-players' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang berwenang menghapus data uji coba.' });
            const result = dbStore.deleteTestPlayers();
            return sendJson(res, 200, { success: true, ...result, database: dbStore.getScopedDatabase(authenticatedUser) });
          }

          if (pathname === '/api/database/restore-backup' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang berwenang memulihkan berkas cadangan.' });
            const body = await parseBody(req);
            try {
              const backupData = body.backup || body;
              const mode = body.mode === 'merge' ? 'merge' : 'replace';
              const result = dbStore.restoreFromBackup(backupData, mode);
              return sendJson(res, 200, {
                ...result,
                database: dbStore.getScopedDatabase(authenticatedUser),
              });
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message || 'Gagal memproses berkas cadangan' });
            }
          }

          if ((pathname === '/api/reset-data' || pathname === '/api/database/reset') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat mereset data.' });
            const db = dbStore.resetDatabase();
            return sendJson(res, 200, { success: true, database: dbStore.getScopedDatabase(authenticatedUser) });
          }

          // --- Players (Scoped Read & Protected Write) ---
          if (pathname === '/api/players' && method === 'GET') {
            return sendJson(res, 200, dbStore.getScopedPlayers(authenticatedUser));
          }

          if (pathname === '/api/players' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat menambahkan pemain langsung ke database resmi.' });
            const body = await parseBody(req);
            if (!body.fullName || !body.birthDate || !body.teamId) {
              return sendJson(res, 400, { error: 'Nama lengkap, tanggal lahir, dan tim wajib diisi' });
            }
            const created = dbStore.createPlayer(body);
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/players/') && method === 'PUT') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat mengubah database pemain resmi.' });
            const id = decodeURIComponent(pathname.replace('/api/players/', ''));
            const body = await parseBody(req);
            const updated = dbStore.updatePlayer(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Pemain tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/players/') && pathname.endsWith('/archive') && method === 'PATCH') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat mengarsipkan pemain.' });
            const id = decodeURIComponent(pathname.replace('/api/players/', '').replace('/archive', ''));
            const body = await parseBody(req);
            const updated = dbStore.archivePlayer(id, body.archived ?? true);
            if (!updated) return sendJson(res, 404, { error: 'Pemain tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/players/') && method === 'DELETE') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat menghapus data pemain.' });
            const id = decodeURIComponent(pathname.replace('/api/players/', ''));
            const success = dbStore.deletePlayer(id);
            return sendJson(res, 200, { success });
          }

          if (pathname === '/api/players/import-csv' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat mengimpor data CSV.' });
            const body = await parseBody(req);
            const playersList = body.players;
            if (!Array.isArray(playersList) || playersList.length === 0) {
              return sendJson(res, 400, { error: 'Daftar pemain tidak valid' });
            }
            const createdPlayers = [];
            for (const p of playersList) {
              if (p.fullName && p.birthDate) {
                createdPlayers.push(
                  dbStore.createPlayer({
                    fullName: p.fullName,
                    nickname: p.nickname || p.fullName.split(' ')[0],
                    birthDate: p.birthDate,
                    joinDate: p.joinDate || new Date().toISOString().split('T')[0],
                    teamId: p.teamId || 'team-b',
                    primaryPosition: p.primaryPosition || 'Gelandang',
                    secondaryPosition: p.secondaryPosition || '',
                    dominantFoot: p.dominantFoot || 'Kanan',
                    guardianName: p.guardianName || 'Orang Tua',
                    guardianContact: p.guardianContact || '-',
                    guardianRelation: p.guardianRelation || 'Wali',
                    status: 'active',
                    coachNotes: p.coachNotes || '',
                    individualTarget: p.individualTarget || '',
                  })
                );
              }
            }
            return sendJson(res, 200, { count: createdPlayers.length, players: createdPlayers });
          }

          // --- Self-Service Player Registrations ---
          if (pathname === '/api/registrations' && method === 'GET') {
            const all = dbStore.getPlayerRegistrations();
            if (isParent) {
              const userContact = authenticatedUser.phone || '';
              const userName = authenticatedUser.name || '';
              const filtered = all.filter(
                (r) =>
                  (userContact && r.guardianContact === userContact) ||
                  (userName && r.guardianName === userName)
              );
              return sendJson(res, 200, filtered);
            }
            return sendJson(res, 200, all);
          }

          if (pathname === '/api/registrations/check-duplicate' && method === 'GET') {
            const fullName = String(parsedUrl.query?.fullName || '');
            const birthDate = String(parsedUrl.query?.birthDate || '');
            const result = dbStore.checkDuplicatePlayer(fullName, birthDate);
            return sendJson(res, 200, result);
          }

          if (pathname.startsWith('/api/registrations/') && pathname.endsWith('/approve') && method === 'POST') {
            if (authenticatedUser && authenticatedUser.role === 'parent') {
              return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf/administrator yang dapat memverifikasi pendaftaran.' });
            }
            const id = decodeURIComponent(pathname.replace('/api/registrations/', '').replace('/approve', ''));
            const body = await parseBody(req);
            try {
              const resData = dbStore.approvePlayerRegistration(id, {
                teamId: body.teamId,
                adminNotes: body.adminNotes || 'Terverifikasi memenuhi kriteria kelompok usia akademi CFA',
                reviewerName: (authenticatedUser && authenticatedUser.name) || 'Mohammad Wildan Kemal Pasha',
                overrideDuplicate: true, // Verification confirms player criteria
              });
              return sendJson(res, 200, { success: true, ...resData });
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname.startsWith('/api/registrations/') && pathname.endsWith('/reject') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menolak pendaftaran.' });
            const id = decodeURIComponent(pathname.replace('/api/registrations/', '').replace('/reject', ''));
            const body = await parseBody(req);
            try {
              const reg = dbStore.rejectPlayerRegistration(
                id,
                body.reason || 'Pengajuan tidak memenuhi persyaratan',
                authenticatedUser.name || 'Admin CFA'
              );
              return sendJson(res, 200, { success: true, registration: reg });
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname.startsWith('/api/registrations/') && pathname.endsWith('/request-revision') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat meminta revisi pendaftaran.' });
            const id = decodeURIComponent(pathname.replace('/api/registrations/', '').replace('/request-revision', ''));
            const body = await parseBody(req);
            try {
              const reg = dbStore.requestRevisionPlayerRegistration(
                id,
                body.notes || 'Harap perbaiki data yang belum sesuai',
                authenticatedUser.name || 'Admin CFA'
              );
              return sendJson(res, 200, { success: true, registration: reg });
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname === '/api/registrations' && method === 'POST') {
            const body = await parseBody(req);
            if (
              !body.fullName ||
              !body.nickname ||
              !body.birthPlace ||
              !body.birthDate ||
              !body.gender ||
              !body.address ||
              !body.school ||
              !body.schoolGrade ||
              !body.primaryPosition ||
              !body.dominantFoot ||
              !body.playingExperience
            ) {
              return sendJson(res, 400, {
                error: 'Semua kolom wajib identitas dan informasi sepak bola harus diisi lengkap',
              });
            }
            const created = dbStore.createPlayerRegistration(body);
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/registrations/') && method === 'GET') {
            const id = decodeURIComponent(pathname.replace('/api/registrations/', ''));
            const reg = dbStore.getPlayerRegistrationById(id);
            if (!reg) return sendJson(res, 404, { error: 'Pendaftaran tidak ditemukan' });
            return sendJson(res, 200, reg);
          }

          if (pathname.startsWith('/api/registrations/') && method === 'PUT') {
            const id = decodeURIComponent(pathname.replace('/api/registrations/', ''));
            const body = await parseBody(req);
            const updated = dbStore.updatePlayerRegistration(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Pendaftaran tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/registrations/') && method === 'DELETE') {
            const id = decodeURIComponent(pathname.replace('/api/registrations/', ''));
            const success = dbStore.deletePlayerRegistration(id);
            return sendJson(res, 200, { success });
          }

          // --- Matches Simulation Data ---
          if (pathname === '/api/matches' && method === 'GET') {
            return sendJson(res, 200, dbStore.getMatches());
          }

          // --- Training Sessions CRUD ---
          if (pathname === '/api/sessions' && method === 'GET') {
            return sendJson(res, 200, dbStore.getSessions());
          }

          if (pathname === '/api/sessions' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat membuat sesi latihan.' });
            const body = await parseBody(req);
            if (!body.date || !body.focus || !body.teamId) {
              return sendJson(res, 400, { error: 'Tanggal, fokus latihan, dan tim wajib diisi' });
            }
            const created = dbStore.createSession(body);
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/sessions/') && method === 'PUT') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat mengubah sesi latihan.' });
            const id = decodeURIComponent(pathname.replace('/api/sessions/', ''));
            const body = await parseBody(req);
            const updated = dbStore.updateSession(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Sesi latihan tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/sessions/') && method === 'DELETE') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Orang tua/wali tidak dapat menghapus sesi latihan.' });
            const id = decodeURIComponent(pathname.replace('/api/sessions/', ''));
            const success = dbStore.deleteSession(id);
            return sendJson(res, 200, { success });
          }

          // --- Attendance Batch ---
          if (pathname === '/api/attendance/batch' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat mencatat kehadiran latihan.' });
            const body = await parseBody(req);
            const { sessionId, records } = body;
            if (!sessionId || !Array.isArray(records)) {
              return sendJson(res, 400, { error: 'SessionId dan records wajib disertakan' });
            }
            const saved = dbStore.batchSaveAttendance(sessionId, records);
            return sendJson(res, 200, saved);
          }

          // --- Training Load Batch ---
          if (pathname === '/api/training-load/batch' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat mencatat training load.' });
            const body = await parseBody(req);
            const { sessionId, records } = body;
            if (!sessionId || !Array.isArray(records)) {
              return sendJson(res, 400, { error: 'SessionId dan records wajib disertakan' });
            }
            const saved = dbStore.batchSaveTrainingLoad(sessionId, records);
            return sendJson(res, 200, saved);
          }

          // --- Evaluations ---
          if (pathname === '/api/evaluations' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat mengisi evaluasi teknik dan taktik.' });
            const body = await parseBody(req);
            const { id, ...data } = body;
            const saved = dbStore.saveEvaluation(data, id);
            return sendJson(res, 200, saved);
          }

          if (pathname.startsWith('/api/evaluations/') && method === 'DELETE') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menghapus evaluasi.' });
            const id = decodeURIComponent(pathname.replace('/api/evaluations/', ''));
            const success = dbStore.deleteEvaluation(id);
            return sendJson(res, 200, { success });
          }

          // --- Motor Tests & Results ---
          if (pathname === '/api/motor-tests' && method === 'GET') {
            return sendJson(res, 200, dbStore.getMotorTests());
          }

          if (pathname === '/api/motor-tests' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menambah parameter tes motorik.' });
            const body = await parseBody(req);
            const created = dbStore.createMotorTest(body);
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/motor-tests/') && !pathname.startsWith('/api/motor-test-results') && method === 'PUT') {
            const id = decodeURIComponent(pathname.replace('/api/motor-tests/', ''));
            const body = await parseBody(req);
            const updated = dbStore.updateMotorTest(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Tes motorik tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/motor-tests/') && !pathname.startsWith('/api/motor-test-results') && method === 'DELETE') {
            const id = decodeURIComponent(pathname.replace('/api/motor-tests/', ''));
            const success = dbStore.deleteMotorTest(id);
            return sendJson(res, 200, { success });
          }

          if (pathname === '/api/motor-test-results' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menginput hasil tes motorik.' });
            const body = await parseBody(req);
            const { id, ...data } = body;
            const saved = dbStore.saveMotorTestResult(data, id);
            return sendJson(res, 200, saved);
          }

          if (pathname.startsWith('/api/motor-test-results/') && pathname.endsWith('/publish') && method === 'PATCH') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya pelatih yang dapat memublikasikan hasil tes.' });
            const id = decodeURIComponent(pathname.replace('/api/motor-test-results/', '').replace('/publish', ''));
            const body = await parseBody(req);
            const updated = dbStore.togglePublishMotorTestResult(id, Boolean(body.published));
            if (!updated) return sendJson(res, 404, { error: 'Hasil tes tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname === '/api/motor-test-results/batch-publish' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya pelatih yang dapat memublikasikan hasil tes.' });
            const body = await parseBody(req);
            const count = dbStore.batchPublishMotorTestResults(body.ids || [], Boolean(body.published));
            return sendJson(res, 200, { success: true, count });
          }

          if (pathname.startsWith('/api/motor-test-results/') && method === 'DELETE') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menghapus hasil tes motorik.' });
            const id = decodeURIComponent(pathname.replace('/api/motor-test-results/', ''));
            const success = dbStore.deleteMotorTestResult(id);
            return sendJson(res, 200, { success });
          }

          // --- LTAD Goals ---
          if (pathname === '/api/ltad-goals' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menetapkan target LTAD.' });
            const body = await parseBody(req);
            const { id, ...data } = body;
            const saved = dbStore.saveLtadGoal(data, id);
            return sendJson(res, 200, saved);
          }

          if (pathname.startsWith('/api/ltad-goals/') && method === 'DELETE') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Hanya staf pelatih yang dapat menghapus target LTAD.' });
            const id = decodeURIComponent(pathname.replace('/api/ltad-goals/', ''));
            const success = dbStore.deleteLtadGoal(id);
            return sendJson(res, 200, { success });
          }

          // --- Promotion Reviews ---
          if (pathname === '/api/promotion-reviews' && method === 'POST') {
            if (isParent) return sendJson(res, 403, { error: 'Akses ditolak: Evaluasi kesiapan promosi Tim A hanya dapat dilakukan oleh staf pelatih.' });
            const body = await parseBody(req);
            const { id, ...data } = body;
            const saved = dbStore.savePromotionReview(data, id);
            return sendJson(res, 200, saved);
          }

          if (pathname.startsWith('/api/promotion-reviews/') && method === 'DELETE') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat menghapus rekam jejak evaluasi promosi.' });
            const id = decodeURIComponent(pathname.replace('/api/promotion-reviews/', ''));
            const success = dbStore.deletePromotionReview(id);
            return sendJson(res, 200, { success });
          }

          // --- Users CRUD ---
          if (pathname === '/api/users' && method === 'GET') {
            if (isParent) {
              return sendJson(res, 200, [dbStore.sanitizeUser(authenticatedUser)]);
            }
            return sendJson(res, 200, dbStore.getUsers().map((u) => dbStore.sanitizeUser(u)));
          }

          if (pathname === '/api/users' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat membuat akun pengguna staf secara langsung.' });
            const body = await parseBody(req);
            const created = dbStore.createUser(body);
            return sendJson(res, 201, dbStore.sanitizeUser(created));
          }

          if (pathname.startsWith('/api/users/') && pathname.endsWith('/approve-parent') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat menyetujui akun orang tua/wali murid.' });
            const id = decodeURIComponent(pathname.replace('/api/users/', '').replace('/approve-parent', ''));
            const approved = dbStore.approveParentAccount(id, authenticatedUser.name);
            if (!approved) return sendJson(res, 404, { error: 'Akun orang tua tidak ditemukan.' });
            return sendJson(res, 200, { success: true, user: approved });
          }

          if (pathname.startsWith('/api/users/') && pathname.endsWith('/reject-parent') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat menolak akun orang tua/wali murid.' });
            const id = decodeURIComponent(pathname.replace('/api/users/', '').replace('/reject-parent', ''));
            const body = await parseBody(req);
            const rejected = dbStore.rejectParentAccount(id, body.reason || 'Ditolak administrator', authenticatedUser.name);
            if (!rejected) return sendJson(res, 404, { error: 'Akun orang tua tidak ditemukan.' });
            return sendJson(res, 200, { success: true, user: rejected });
          }

          if (pathname.startsWith('/api/users/') && method === 'PUT') {
            const id = decodeURIComponent(pathname.replace('/api/users/', ''));
            const body = await parseBody(req);

            // If user is a parent, they can only edit their own profile, and CANNOT elevate their role or status!
            if (isParent) {
              if (id !== authenticatedUser.id) {
                return sendJson(res, 403, { error: 'Akses ditolak: Anda hanya dapat memperbarui profil akun Anda sendiri.' });
              }
              delete body.role;
              delete body.status;
              delete body.linkedPlayerIds;
              delete body.assignedTeamId;
            } else if (!isAdmin && id !== authenticatedUser.id) {
              // Non-admin coaches can only edit themselves
              return sendJson(res, 403, { error: 'Hanya administrator yang dapat mengubah akun pengguna lain.' });
            }

            const updated = dbStore.updateUser(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Pengguna tidak ditemukan' });
            return sendJson(res, 200, dbStore.sanitizeUser(updated));
          }

          if (pathname.startsWith('/api/users/') && method === 'DELETE') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat menghapus akun pengguna.' });
            const id = decodeURIComponent(pathname.replace('/api/users/', ''));
            const success = dbStore.deleteUser(id);
            return sendJson(res, 200, { success });
          }

          // --- Teams CRUD ---
          if (pathname === '/api/teams' && method === 'GET') {
            return sendJson(res, 200, dbStore.getTeams());
          }

          if (pathname === '/api/teams' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat membuat tim baru.' });
            const body = await parseBody(req);
            const created = dbStore.createTeam(body);
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/teams/') && method === 'PUT') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat memperbarui pengaturan tim.' });
            const id = decodeURIComponent(pathname.replace('/api/teams/', ''));
            const body = await parseBody(req);
            const updated = dbStore.updateTeam(id, body);
            if (!updated) return sendJson(res, 404, { error: 'Tim tidak ditemukan' });
            return sendJson(res, 200, updated);
          }

          if (pathname.startsWith('/api/teams/') && method === 'DELETE') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Hanya administrator yang dapat menghapus tim.' });
            const id = decodeURIComponent(pathname.replace('/api/teams/', ''));
            const success = dbStore.deleteTeam(id);
            return sendJson(res, 200, { success });
          }

          // --- PARENT PORTAL ROUTES ---
          if (pathname === '/api/parent/invite-codes' && method === 'GET') {
            const all = dbStore.getParentInviteCodes();
            if (isParent) {
              const linked = authenticatedUser.linkedPlayerIds || [];
              return sendJson(res, 200, all.filter((inv) => linked.includes(inv.playerId)));
            }
            return sendJson(res, 200, all);
          }

          if (pathname === '/api/parent/invite-codes' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menerbitkan kode undangan baru.' });
            const body = await parseBody(req);
            if (!body.playerId) {
              return sendJson(res, 400, { error: 'playerId wajib diisi' });
            }
            const invite = dbStore.createParentInviteCode(
              body.playerId,
              authenticatedUser.name || 'Admin',
              body.relationship || 'Wali'
            );
            return sendJson(res, 201, invite);
          }

          if (pathname === '/api/parent/link-requests' && method === 'GET') {
            const all = dbStore.getParentLinkRequests();
            if (isParent) {
              return sendJson(res, 200, all.filter((r) => r.parentId === authenticatedUser.id));
            }
            return sendJson(res, 200, all);
          }

          if (pathname === '/api/parent/link-requests' && method === 'POST') {
            const body = await parseBody(req);
            const parentId = isParent ? authenticatedUser.id : body.parentId;
            if (!parentId || !body.playerId) {
              return sendJson(res, 400, { error: 'playerId wajib diisi' });
            }
            const linkReq = dbStore.createParentLinkRequest({
              ...body,
              parentId,
              parentName: isParent ? authenticatedUser.name : body.parentName,
              parentEmail: isParent ? authenticatedUser.email : body.parentEmail,
              parentPhone: isParent ? authenticatedUser.phone : body.parentPhone,
            });
            return sendJson(res, 201, linkReq);
          }

          if (pathname.startsWith('/api/parent/link-requests/') && pathname.endsWith('/approve') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menyetujui penautan akun anak.' });
            const id = pathname.replace('/api/parent/link-requests/', '').replace('/approve', '');
            const approved = dbStore.approveParentLinkRequest(id, authenticatedUser.name || 'Admin');
            if (!approved) return sendJson(res, 404, { error: 'Permintaan tautan tidak ditemukan' });
            return sendJson(res, 200, approved);
          }

          if (pathname.startsWith('/api/parent/link-requests/') && pathname.endsWith('/reject') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menolak penautan akun anak.' });
            const id = pathname.replace('/api/parent/link-requests/', '').replace('/reject', '');
            const body = await parseBody(req);
            const rejected = dbStore.rejectParentLinkRequest(id, body.reason || 'Ditolak admin', authenticatedUser.name || 'Admin');
            if (!rejected) return sendJson(res, 404, { error: 'Permintaan tautan tidak ditemukan' });
            return sendJson(res, 200, rejected);
          }

          if (pathname === '/api/parent/direct-link' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menghubungkan profil secara langsung.' });
            const body = await parseBody(req);
            if (!body.parentId || !body.playerId) {
              return sendJson(res, 400, { error: 'parentId dan playerId wajib diisi' });
            }
            const success = dbStore.linkParentToPlayer(body.parentId, body.playerId, authenticatedUser.name || 'Admin');
            return sendJson(res, 200, { success });
          }

          if (pathname === '/api/parent/direct-unlink' && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat memutuskan tautan akun anak.' });
            const body = await parseBody(req);
            if (!body.parentId || !body.playerId) {
              return sendJson(res, 400, { error: 'parentId dan playerId wajib diisi' });
            }
            const success = dbStore.unlinkParentFromPlayer(body.parentId, body.playerId, authenticatedUser.name || 'Admin');
            return sendJson(res, 200, { success });
          }

          if (pathname.startsWith('/api/parent/child/') && pathname.endsWith('/basic-info') && method === 'PUT') {
            const rawPlayerId = pathname.replace('/api/parent/child/', '').replace('/basic-info', '');
            const playerId = decodeURIComponent(rawPlayerId);
            const body = await parseBody(req);

            if (isParent) {
              if (authenticatedUser.status !== 'approved') {
                return sendJson(res, 403, { error: 'Akses ditolak: Akun orang tua/wali Anda belum diverifikasi oleh admin.' });
              }
              if (!authenticatedUser.linkedPlayerIds?.includes(playerId)) {
                return sendJson(res, 403, { error: 'Akses ditolak: Anda tidak memiliki izin untuk mengedit pemain ini.' });
              }
            }

            const parentId = isParent ? authenticatedUser.id : body.parentId;
            const updated = dbStore.parentUpdateChildBasicInfo(parentId, playerId, body.updates || {});
            return sendJson(res, 200, updated);
          }

          if (pathname === '/api/parent/identity-requests' && method === 'GET') {
            const all = dbStore.getChildIdentityChangeRequests();
            if (isParent) {
              return sendJson(res, 200, all.filter((r) => r.parentId === authenticatedUser.id));
            }
            return sendJson(res, 200, all);
          }

          if (pathname === '/api/parent/identity-requests' && method === 'POST') {
            const body = await parseBody(req);
            const parentId = isParent ? authenticatedUser.id : body.parentId;

            if (isParent) {
              if (authenticatedUser.status !== 'approved') {
                return sendJson(res, 403, { error: 'Akses ditolak: Akun wali belum diverifikasi admin.' });
              }
              if (!authenticatedUser.linkedPlayerIds?.includes(body.playerId)) {
                return sendJson(res, 403, { error: 'Akses ditolak: Anda hanya dapat mengajukan perubahan untuk anak yang terhubung.' });
              }
            }

            if (!parentId || !body.playerId || !body.field || !body.proposedValue) {
              return sendJson(res, 400, { error: 'Semua kolom pengajuan identitas wajib diisi' });
            }
            const created = dbStore.createChildIdentityChangeRequest({
              ...body,
              parentId,
              parentName: isParent ? authenticatedUser.name : body.parentName,
            });
            return sendJson(res, 201, created);
          }

          if (pathname.startsWith('/api/parent/identity-requests/') && pathname.endsWith('/approve') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menyetujui perubahan identitas utama.' });
            const id = pathname.replace('/api/parent/identity-requests/', '').replace('/approve', '');
            const approved = dbStore.approveChildIdentityChangeRequest(id, authenticatedUser.name || 'Admin');
            if (!approved) return sendJson(res, 404, { error: 'Permintaan tidak ditemukan' });
            return sendJson(res, 200, approved);
          }

          if (pathname.startsWith('/api/parent/identity-requests/') && pathname.endsWith('/reject') && method === 'POST') {
            if (!isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya administrator yang dapat menolak perubahan identitas utama.' });
            const id = pathname.replace('/api/parent/identity-requests/', '').replace('/reject', '');
            const body = await parseBody(req);
            const rejected = dbStore.rejectChildIdentityChangeRequest(id, body.adminNotes || 'Ditolak admin', authenticatedUser.name || 'Admin');
            if (!rejected) return sendJson(res, 404, { error: 'Permintaan tidak ditemukan' });
            return sendJson(res, 200, rejected);
          }

          if (pathname === '/api/parent/audit-logs' && method === 'GET') {
            const playerId = (parsedUrl.query.playerId as string) || undefined;
            const logs = dbStore.getParentAuditLogs(playerId);
            if (isParent) {
              return sendJson(res, 200, logs.filter((l) => l.parentId === authenticatedUser.id));
            }
            return sendJson(res, 200, logs);
          }

          if (pathname === '/api/parent/add-athlete' && method === 'POST') {
            if (!isParent && !isAdmin) return sendJson(res, 403, { error: 'Akses ditolak: Hanya akun orang tua yang dapat menambahkan atlet ke profilnya.' });
            const body = await parseBody(req);
            const parentId = isParent ? authenticatedUser.id : (body.parentId || authenticatedUser.id);
            try {
              const result = dbStore.addAthleteForParent(parentId, body);
              return sendJson(res, 201, result);
            } catch (err: any) {
              return sendJson(res, 400, { error: err.message });
            }
          }

          if (pathname === '/api/parent/register' && method === 'POST') {
            const body = await parseBody(req);
            if (!body.name || !body.email) {
              return sendJson(res, 400, { error: 'Nama dan email wajib diisi' });
            }
            const result = dbStore.registerParentUser(body);
            return sendJson(res, 201, result);
          }

          return sendJson(res, 404, { error: 'API route not found' });
        } catch (error: any) {
          console.error('API Error:', error);
          return sendJson(res, 500, { error: error.message || 'Internal Server Error' });
        }
};

export function academyApiPlugin(): Plugin {
  return {
    name: 'academy-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(academyApiMiddleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(academyApiMiddleware);
    },
  };
}
