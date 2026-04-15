// Storage em memória para MVP — persiste enquanto o servidor estiver rodando.
// Para produção, substituir por Vercel KV, Supabase ou similar.

const store = {
  users: [],
  invites: [],
};

export const db = {
  // USERS
  async getUsers() {
    return store.users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async getUserById(id) {
    return store.users.find(u => u.id === id) || null;
  },

  async upsertUser(data) {
    const idx = store.users.findIndex(u => u.id === data.id);
    if (idx >= 0) {
      store.users[idx] = { ...store.users[idx], ...data, updatedAt: new Date().toISOString() };
      return store.users[idx];
    }
    const user = {
      id: data.id,
      name: data.name || "Usuário",
      email: data.email || "",
      plan: data.plan || "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalSessions: 1,
      totalTimeSeconds: 0,
      diagnosticsRun: 0,
      city: data.city || "",
      url: data.url || "",
      inviteToken: data.inviteToken || null,
      source: data.source || "direct",
      ...data,
    };
    store.users.push(user);
    return user;
  },

  async trackEvent(userId, event) {
    const user = store.users.find(u => u.id === userId);
    if (!user) return;
    user.lastActiveAt = new Date().toISOString();
    if (event.type === "session_time") user.totalTimeSeconds = (user.totalTimeSeconds || 0) + (event.seconds || 0);
    if (event.type === "diagnostic_complete") user.diagnosticsRun = (user.diagnosticsRun || 0) + 1;
    if (event.type === "session_start") user.totalSessions = (user.totalSessions || 0) + 1;
  },

  // INVITES
  async createInvite(createdBy, note) {
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const invite = {
      token,
      createdBy: createdBy || "admin",
      note: note || "",
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null,
      active: true,
    };
    store.invites.push(invite);
    return invite;
  },

  async getInvites() {
    return store.invites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async useInvite(token, userId) {
    const inv = store.invites.find(i => i.token === token);
    if (!inv || !inv.active) return false;
    inv.usedBy = userId;
    inv.usedAt = new Date().toISOString();
    inv.active = false;
    return true;
  },

  async validateInvite(token) {
    const inv = store.invites.find(i => i.token === token);
    return inv && inv.active;
  },
};
