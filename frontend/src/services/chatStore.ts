export const SESSIONS_KEY = 'egf_sessions';
export const chatKey = (sid: string) => `egf_chat_${sid}`;
export const syncChannelName = (sid: string) => `egf_chat_sync_${sid}`;

export interface SessionMeta {
  id: string;
  name?: string;
  startedAt: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export const getSessions = (): SessionMeta[] => {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); }
  catch { return []; }
};

export const upsertSession = (id: string, patch: Partial<Omit<SessionMeta, 'id'>>) => {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...patch };
  } else {
    sessions.unshift({
      id,
      startedAt: new Date().toISOString(),
      lastMessage: '',
      lastAt: new Date().toISOString(),
      unread: 0,
      ...patch,
    });
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSessionMsgs = (sid: string): any[] => {
  try { return JSON.parse(localStorage.getItem(chatKey(sid)) || '[]'); }
  catch { return []; }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveSessionMsgs = (sid: string, msgs: any[]) => {
  try { localStorage.setItem(chatKey(sid), JSON.stringify(msgs)); }
  catch { /* storage full */ }
};
