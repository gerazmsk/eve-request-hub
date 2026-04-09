import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ProviderProfile, ServiceRequest, MessageThread, Message, ProviderEvent } from '@/types';
import { seedUsers, seedProfiles, seedRequests, seedThreads } from '@/data/mockData';

interface AppState {
  users: User[];
  profiles: ProviderProfile[];
  requests: ServiceRequest[];
  threads: MessageThread[];
  providerEvents: ProviderEvent[];
  currentUser: User | null;
  selectedRole: UserRole | null;
}

interface AppContextType extends AppState {
  setSelectedRole: (role: UserRole) => void;
  signUp: (user: Omit<User, 'id'>) => User;
  logIn: (email: string, password: string) => User | null;
  logOut: () => void;
  getProfile: (profileId: string) => ProviderProfile | undefined;
  getProfileByUserId: (userId: string) => ProviderProfile | undefined;
  getProfilesByCategory: (category: string) => (ProviderProfile & { user: User })[];
  getUserById: (id: string) => User | undefined;
  createRequest: (req: Omit<ServiceRequest, 'id' | 'createdAt'>) => ServiceRequest;
  updateRequestStatus: (reqId: string, status: ServiceRequest['status']) => void;
  getClientRequests: (clientId: string) => ServiceRequest[];
  getProviderRequests: (providerId: string) => ServiceRequest[];
  getRequestById: (id: string) => ServiceRequest | undefined;
  getOrCreateThread: (clientId: string, providerId: string) => MessageThread;
  sendMessage: (threadId: string, senderId: string, text: string) => void;
  getUserThreads: (userId: string) => MessageThread[];
  updateProfile: (profile: ProviderProfile) => void;
  addProviderEvent: (event: Omit<ProviderEvent, 'id'>) => void;
  updateProviderEvent: (event: ProviderEvent) => void;
  deleteProviderEvent: (eventId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'eve-app-state';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.users?.length) return parsed;
    }
  } catch {}
  return {
    users: seedUsers,
    profiles: seedProfiles,
    requests: seedRequests,
    threads: seedThreads,
    providerEvents: [],
    currentUser: null,
    selectedRole: null,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setSelectedRole = useCallback((role: UserRole) => {
    setState(s => ({ ...s, selectedRole: role }));
  }, []);

  const signUp = useCallback((userData: Omit<User, 'id'>): User => {
    const user: User = { ...userData, id: `user-${Date.now()}` };
    let profileId: string | undefined;
    if (user.role === 'provider') {
      const profile: ProviderProfile = {
        id: `profile-${Date.now()}`,
        userId: user.id,
        category: 'photographer',
        title: 'Service Provider',
        location: '',
        about: '',
        priceLabel: '',
        rating: 0,
        reviewCount: 0,
        tags: [],
        gallery: [],
        coverImage: '',
        profileImage: '',
      };
      profileId = profile.id;
      user.profileId = profileId;
      setState(s => ({
        ...s,
        users: [...s.users, user],
        profiles: [...s.profiles, profile],
        currentUser: user,
        selectedRole: null,
      }));
    } else {
      setState(s => ({
        ...s,
        users: [...s.users, user],
        currentUser: user,
        selectedRole: null,
      }));
    }
    return user;
  }, []);

  const logIn = useCallback((email: string, password: string): User | null => {
    const found = state.users.find(u => u.email === email && u.password === password);
    if (found) {
      setState(s => ({ ...s, currentUser: found, selectedRole: null }));
      return found;
    }
    return null;
  }, [state.users]);

  const logOut = useCallback(() => {
    setState(s => ({ ...s, currentUser: null, selectedRole: null }));
  }, []);

  const getProfile = useCallback((profileId: string) => {
    return state.profiles.find(p => p.id === profileId);
  }, [state.profiles]);

  const getProfileByUserId = useCallback((userId: string) => {
    return state.profiles.find(p => p.userId === userId);
  }, [state.profiles]);

  const getProfilesByCategory = useCallback((category: string) => {
    return state.profiles
      .filter(p => p.category === category)
      .map(p => ({ ...p, user: state.users.find(u => u.id === p.userId)! }));
  }, [state.profiles, state.users]);

  const getUserById = useCallback((id: string) => {
    return state.users.find(u => u.id === id);
  }, [state.users]);

  const createRequest = useCallback((req: Omit<ServiceRequest, 'id' | 'createdAt'>): ServiceRequest => {
    const newReq: ServiceRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setState(s => ({ ...s, requests: [...s.requests, newReq] }));
    return newReq;
  }, []);

  const updateRequestStatus = useCallback((reqId: string, status: ServiceRequest['status']) => {
    setState(s => ({
      ...s,
      requests: s.requests.map(r => r.id === reqId ? { ...r, status } : r),
    }));
  }, []);

  const getClientRequests = useCallback((clientId: string) => {
    return state.requests.filter(r => r.clientId === clientId);
  }, [state.requests]);

  const getProviderRequests = useCallback((providerId: string) => {
    return state.requests.filter(r => r.providerId === providerId);
  }, [state.requests]);

  const getRequestById = useCallback((id: string) => {
    return state.requests.find(r => r.id === id);
  }, [state.requests]);

  const getOrCreateThread = useCallback((clientId: string, providerId: string): MessageThread => {
    const existing = state.threads.find(t => t.clientId === clientId && t.providerId === providerId);
    if (existing) return existing;
    const thread: MessageThread = {
      id: `thread-${Date.now()}`,
      clientId,
      providerId,
      messages: [],
    };
    setState(s => ({ ...s, threads: [...s.threads, thread] }));
    return thread;
  }, [state.threads]);

  const sendMessage = useCallback((threadId: string, senderId: string, text: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      text,
      timestamp: new Date().toISOString(),
    };
    setState(s => ({
      ...s,
      threads: s.threads.map(t =>
        t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t
      ),
    }));
  }, []);

  const getUserThreads = useCallback((userId: string) => {
    return state.threads.filter(t => t.clientId === userId || t.providerId === userId);
  }, [state.threads]);

  const updateProfile = useCallback((profile: ProviderProfile) => {
    setState(s => ({
      ...s,
      profiles: s.profiles.map(p => p.id === profile.id ? profile : p),
    }));
  }, []);

  const addProviderEvent = useCallback((event: Omit<ProviderEvent, 'id'>) => {
    const newEvent: ProviderEvent = { ...event, id: `pe-${Date.now()}` };
    setState(s => ({ ...s, providerEvents: [...s.providerEvents, newEvent] }));
  }, []);

  const updateProviderEvent = useCallback((event: ProviderEvent) => {
    setState(s => ({
      ...s,
      providerEvents: s.providerEvents.map(e => e.id === event.id ? event : e),
    }));
  }, []);

  const deleteProviderEvent = useCallback((eventId: string) => {
    setState(s => ({
      ...s,
      providerEvents: s.providerEvents.filter(e => e.id !== eventId),
    }));
  }, []);

  const value: AppContextType = {
    ...state,
    setSelectedRole,
    signUp,
    logIn,
    logOut,
    getProfile,
    getProfileByUserId,
    getProfilesByCategory,
    getUserById,
    createRequest,
    updateRequestStatus,
    getClientRequests,
    getProviderRequests,
    getRequestById,
    getOrCreateThread,
    sendMessage,
    getUserThreads,
    updateProfile,
    addProviderEvent,
    updateProviderEvent,
    deleteProviderEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
