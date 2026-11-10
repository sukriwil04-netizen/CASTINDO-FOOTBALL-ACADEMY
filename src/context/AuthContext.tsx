import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, Player, PlayerRegistration } from '../types/database.ts';
import { DEFAULT_USERS } from '../utils/initialData.ts';
import { api, AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_USER_OBJECT_KEY } from '../services/api.ts';
import { safeStorage } from '../utils/safeStorage.ts';

interface AuthContextType {
  currentUser: User | null;
  usersList: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isHeadCoach: boolean;
  isAssistantCoach: boolean;
  isCoach: boolean;
  isParent: boolean;
  isPendingVerification: boolean;
  linkedPlayerIds: string[];
  canManagePlayers: boolean;
  canManageSessions: boolean;
  canViewGuardianContact: boolean;
  canManageSystem: boolean;
  canFinalizePromotion: boolean;
  // Auth operations
  login: (email: string, password?: string) => Promise<User>;
  loginParent: (email: string, password?: string) => Promise<User>;
  registerParentWithAthlete: (data: {
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
  }, options?: { autoLogin?: boolean }) => Promise<{
    user: User;
    player: Player;
    players?: Player[];
    registration: PlayerRegistration;
    registrations?: PlayerRegistration[];
    token: string;
  }>;
  registerCoach: (data: {
    name: string;
    email: string;
    password: string;
    role?: 'head_coach' | 'assistant_coach';
    assignedTeamId?: string;
    phone?: string;
    avatarUrl?: string;
  }) => Promise<{ user: User; token: string }>;
  activateUserSession: (user: User, token?: string) => void;
  addAthleteForParent: (athleteData: {
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
  }) => Promise<{ player: Player; user: User }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // Dev & testing switches
  loginAs: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  updateCurrentUser: (updates: Partial<User>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
  createUser: (userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<boolean>;
  reloadUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_USERS_KEY = 'cfa_users_list_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = safeStorage.getItem(LOCAL_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize admin name in cache if outdated
          parsed.forEach((u: User) => {
            if (
              u.role === 'admin' ||
              u.id === 'usr-1' ||
              u.email?.trim().toLowerCase() === 'sukriwil04@gmail.com'
            ) {
              u.name = 'Mohammad Wildan Kemal Pasha';
              u.status = 'approved';
            }
          });
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_USERS;
  });

  // Strict initial check: restore user and normalize official admin name & verified status
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;

    // 1. First priority: restore complete cached user object
    const savedUserStr = safeStorage.getItem(AUTH_USER_OBJECT_KEY);
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
          if (
            parsed.role === 'admin' ||
            parsed.id === 'usr-1' ||
            parsed.email?.trim().toLowerCase() === 'sukriwil04@gmail.com'
          ) {
            parsed.name = 'Mohammad Wildan Kemal Pasha';
            parsed.status = 'approved';
          }
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    const savedId = safeStorage.getItem(AUTH_USER_KEY);
    const savedToken = safeStorage.getItem(AUTH_TOKEN_KEY);
    if (!savedId && !savedToken) {
      return null;
    }

    // 2. If admin token or admin ID is saved, restore official Administrator state immediately
    if (savedId === 'usr-1' || savedToken?.includes('admin') || savedToken?.includes('usr-1')) {
      const adminInList = usersList.find((u) => u.id === 'usr-1' || u.role === 'admin');
      const adminUser: User = {
        ...(adminInList || DEFAULT_USERS[0]),
        id: 'usr-1',
        name: 'Mohammad Wildan Kemal Pasha',
        email: 'sukriwil04@gmail.com',
        role: 'admin',
        status: 'approved',
        sessionToken: savedToken || adminInList?.sessionToken || 'cfa_tok_usr-1_admin_2026',
      };
      return adminUser;
    }

    if (savedId) {
      const found = usersList.find((u) => u.id === savedId);
      if (found) {
        return found;
      }
    }
    return null;
  });

  // Verify and refresh active session with server on initial mount
  useEffect(() => {
    const savedToken = safeStorage.getItem(AUTH_TOKEN_KEY);
    const savedId = safeStorage.getItem(AUTH_USER_KEY);
    if (savedToken || savedId) {
      api
        .getMe()
        .then(({ user }) => {
          if (user) {
            setCurrentUser(user);
            safeStorage.setItem(AUTH_USER_KEY, user.id);
            safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(user));
            if (user.sessionToken) {
              safeStorage.setItem(AUTH_TOKEN_KEY, user.sessionToken);
            }
          }
        })
        .catch((err) => {
          console.warn('Session verification notice:', err);
          // Only clear storage if server explicitly reports 401 unauthorized AND there is no valid user object
          if (err?.status === 401 && !safeStorage.getItem(AUTH_USER_OBJECT_KEY)) {
            safeStorage.removeItem(AUTH_USER_KEY);
            safeStorage.removeItem(AUTH_TOKEN_KEY);
            safeStorage.removeItem(AUTH_USER_OBJECT_KEY);
            setCurrentUser(null);
          }
        });
    }
  }, []);

  // Sync usersList and currentUser from persistent server database
  useEffect(() => {
    api
      .getDatabase()
      .then((db) => {
        if (db.users && db.users.length > 0) {
          db.users.forEach((u: User) => {
            if (
              u.role === 'admin' ||
              u.id === 'usr-1' ||
              u.email?.trim().toLowerCase() === 'sukriwil04@gmail.com'
            ) {
              u.name = 'Mohammad Wildan Kemal Pasha';
              u.status = 'approved';
            }
          });
          setUsersList(db.users);
          safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(db.users));
          setCurrentUser((curr) => {
            if (!curr) return null;
            const updated = db.users.find((u) => u.id === curr.id);
            if (updated) {
              if (
                updated.role === 'admin' ||
                updated.id === 'usr-1' ||
                updated.email?.trim().toLowerCase() === 'sukriwil04@gmail.com'
              ) {
                return {
                  ...updated,
                  name: 'Mohammad Wildan Kemal Pasha',
                  role: 'admin',
                  status: 'approved',
                };
              }
              return updated;
            }
            return curr;
          });
        }
      })
      .catch((err) => {
        console.warn('Initial server users sync note:', err);
      });
  }, [currentUser?.id]);

  // Synchronize localStorage with currentUser
  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem(AUTH_USER_KEY, currentUser.id);
      safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(currentUser));
      const token = currentUser.sessionToken || safeStorage.getItem(AUTH_TOKEN_KEY) || `cfa_tok_${currentUser.id}_session`;
      safeStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }, [currentUser]);

  const refreshUser = async () => {
    try {
      const db = await api.getDatabase();
      if (db.users && db.users.length > 0) {
        setUsersList(db.users);
        safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(db.users));
        if (currentUser) {
          const fresh = db.users.find((u) => u.id === currentUser.id);
          if (fresh) setCurrentUser(fresh);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const login = async (email: string, password?: string): Promise<User> => {
    const res = await api.login(email, password);
    const token = res.token || res.user.sessionToken || `cfa_tok_${res.user.id}_session`;
    const userWithToken = { ...res.user, sessionToken: token };
    safeStorage.setItem(AUTH_TOKEN_KEY, token);
    safeStorage.setItem(AUTH_USER_KEY, userWithToken.id);
    safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(userWithToken));
    setCurrentUser(userWithToken);
    setUsersList((prev) => {
      const idx = prev.findIndex((u) => u.id === userWithToken.id);
      let updatedList: User[];
      if (idx >= 0) {
        updatedList = [...prev];
        updatedList[idx] = userWithToken;
      } else {
        updatedList = [...prev, userWithToken];
      }
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
    return userWithToken;
  };

  const loginParent = async (email: string, password?: string): Promise<User> => {
    return login(email, password);
  };

  const registerParentWithAthlete = async (data: {
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
  }, options?: { autoLogin?: boolean }) => {
    const res = await api.registerParentWithAthlete(data);
    const token = res.token || res.user.sessionToken || `cfa_tok_${res.user.id}_session`;
    const userWithToken = { ...res.user, sessionToken: token };
    setUsersList((prev) => {
      const updatedList = [...prev.filter((u) => u.id !== userWithToken.id), userWithToken];
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
    if (options?.autoLogin !== false) {
      safeStorage.setItem(AUTH_TOKEN_KEY, token);
      safeStorage.setItem(AUTH_USER_KEY, userWithToken.id);
      safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(userWithToken));
      setCurrentUser(userWithToken);
    }
    return { ...res, user: userWithToken };
  };

  const registerCoach = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'head_coach' | 'assistant_coach';
    assignedTeamId?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    const res = await api.registerCoach(data);
    const token = res.token || res.user.sessionToken || `cfa_tok_${res.user.id}_session`;
    const userWithToken = { ...res.user, sessionToken: token };
    safeStorage.setItem(AUTH_TOKEN_KEY, token);
    safeStorage.setItem(AUTH_USER_KEY, userWithToken.id);
    safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(userWithToken));
    setCurrentUser(userWithToken);
    setUsersList((prev) => {
      const updatedList = [...prev.filter((u) => u.id !== userWithToken.id), userWithToken];
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
    return { ...res, user: userWithToken };
  };

  const activateUserSession = (user: User, token?: string) => {
    const sessionToken = token || user.sessionToken || `cfa_tok_${user.id}_session`;
    const userWithToken = { ...user, sessionToken };
    safeStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
    safeStorage.setItem(AUTH_USER_KEY, user.id);
    safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(userWithToken));
    setCurrentUser(userWithToken);
    setUsersList((prev) => {
      const updatedList = [...prev.filter((u) => u.id !== user.id), userWithToken];
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const addAthleteForParent = async (athleteData: {
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
  }) => {
    const res = await api.addAthleteForParent(athleteData);
    setCurrentUser(res.user);
    safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(res.user));
    setUsersList((prev) => {
      const updatedList = prev.map((u) => (u.id === res.user.id ? res.user : u));
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
      return updatedList;
    });
    return res;
  };

  const logout = () => {
    setCurrentUser(null);
    safeStorage.removeItem(AUTH_USER_KEY);
    safeStorage.removeItem(AUTH_TOKEN_KEY);
    safeStorage.removeItem(AUTH_USER_OBJECT_KEY);
  };

  const loginAs = (userId: string) => {
    const found = usersList.find((u) => u.id === userId);
    if (found) {
      const sessionToken = found.sessionToken || `cfa_tok_${found.id}_session`;
      const userWithToken = { ...found, sessionToken };
      setCurrentUser(userWithToken);
      safeStorage.setItem(AUTH_USER_KEY, found.id);
      safeStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
      safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(userWithToken));
    }
  };

  const switchRole = (role: UserRole) => {
    const found = usersList.find((u) => u.role === role);
    if (found) {
      loginAs(found.id);
    } else if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      safeStorage.setItem(AUTH_USER_OBJECT_KEY, JSON.stringify(updated));
      setUsersList((prev) => {
        const updatedList = prev.map((u) => (u.id === currentUser.id ? updated : u));
        safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedList));
        return updatedList;
      });
      api.updateUser(currentUser.id, { role }).catch(console.error);
    }
  };

  const updateCurrentUser = async (updates: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('No active user');
    return updateUser(currentUser.id, updates);
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    let resultUser: User;
    try {
      resultUser = await api.updateUser(id, updates);
    } catch {
      const existing = usersList.find((u) => u.id === id);
      if (!existing) throw new Error('User not found');
      resultUser = { ...existing, ...updates };
    }

    setUsersList((prev) => {
      const next = prev.map((u) => (u.id === id ? resultUser : u));
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      return next;
    });

    if (currentUser && currentUser.id === id) {
      setCurrentUser(resultUser);
    }

    return resultUser;
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    const created = await api.createUser(userData);
    setUsersList((prev) => {
      const next = [...prev, created];
      safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      return next;
    });
    return created;
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    const ok = await api.deleteUser(id);
    if (ok) {
      setUsersList((prev) => {
        const next = prev.filter((u) => u.id !== id);
        safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
        return next;
      });
      if (currentUser?.id === id) {
        logout();
      }
    }
    return ok;
  };

  const reloadUsers = async (): Promise<User[]> => {
    try {
      const users = await api.getUsers();
      if (Array.isArray(users) && users.length > 0) {
        setUsersList(users);
        safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
        return users;
      }
    } catch (e) {
      // ignore
    }
    return usersList;
  };

  const isAuthenticated = Boolean(currentUser);
  const role = currentUser?.role;
  const isAdmin = role === 'admin';
  const isHeadCoach = role === 'head_coach';
  const isAssistantCoach = role === 'assistant_coach';
  const isCoach = isHeadCoach || isAssistantCoach;
  const isParent = role === 'parent';
  const isPendingVerification = isParent && currentUser?.status === 'pending';
  const linkedPlayerIds = currentUser?.linkedPlayerIds || [];

  const canManagePlayers = !isParent && isAuthenticated;
  const canManageSessions = !isParent && isAuthenticated;
  const canViewGuardianContact = !isParent && isAuthenticated;
  const canManageSystem = isAdmin && isAuthenticated;
  const canFinalizePromotion = !isParent && isAuthenticated;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        isAuthenticated,
        isAdmin,
        isHeadCoach,
        isAssistantCoach,
        isCoach,
        isParent,
        isPendingVerification,
        linkedPlayerIds,
        canManagePlayers,
        canManageSessions,
        canViewGuardianContact,
        canManageSystem,
        canFinalizePromotion,
        login,
        loginParent,
        registerParentWithAthlete,
        registerCoach,
        activateUserSession,
        addAthleteForParent,
        logout,
        refreshUser,
        loginAs,
        switchRole,
        updateCurrentUser,
        updateUser,
        createUser,
        deleteUser,
        reloadUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
