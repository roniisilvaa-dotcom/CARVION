(function () {
  const KEY = 'carvion.admin.v1';
  const CURRENT_SESSION = 'carvion.currentSessionId';
  const RESET_KEY = 'carvion.admin.reset.version';
  const RESET_VERSION = '2026-04-30-demo-values-v1';
  const SESSION_TTL = 1000 * 60 * 45;

  const permissionsByRole = {
    administrador: ['*'],
    financeiro: ['dashboard:view', 'orders:view', 'reports:view', 'export:data', 'finance:view'],
    comercial: ['dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:emit'],
    produção: ['dashboard:view', 'orders:view', 'production:view', 'stock:view'],
    estoque: ['dashboard:view', 'stock:view', 'production:view'],
    operador: ['dashboard:view', 'orders:view', 'production:view'],
    visualização: ['dashboard:view', 'orders:view', 'reports:view'],
  };

  const sanitize = (value) => String(value ?? '').replace(/[<>]/g, '').trim();
  const now = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const device = () => `${navigator.platform || 'Web'} · ${navigator.userAgent.split(') ')[0].replace('(', '')}`;
  const fakeIp = () => `10.0.${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 200) + 20}`;

  const seed = () => ({
    users: [
      {
        id: 'usr-admin',
        name: 'Roni Silva',
        email: 'admin@carvion.com',
        login: 'admin',
        phone: '(67) 99999-0000',
        position: 'Administrador',
        role: 'administrador',
        status: 'ativo',
        password: 'Admin@123',
        createdAt: now(),
        lastAccess: null,
        notes: 'Usuário administrador inicial.',
        permissions: permissionsByRole.administrador,
        deletedAt: null,
      },    ],
    sessions: [],
    orders: [],
    logs: [],
    preferences: {},
  });

  const ensureDemoReset = () => {
    if (localStorage.getItem(RESET_KEY) === RESET_VERSION) return;
    localStorage.removeItem(KEY);
    localStorage.removeItem(CURRENT_SESSION);
    localStorage.removeItem('carvion.factory.v1');
    localStorage.removeItem('carvion.tweaks.v1');
    localStorage.removeItem('carvion.app.reset.version');
    localStorage.setItem(RESET_KEY, RESET_VERSION);
  };

  const load = () => {
    ensureDemoReset();
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      return data ? { ...seed(), ...data } : seed();
    } catch {
      return seed();
    }
  };

  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  const resetDemoData = (options = {}) => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(CURRENT_SESSION);
    localStorage.removeItem('carvion.factory.v1');
    localStorage.removeItem('carvion.tweaks.v1');
    localStorage.setItem(RESET_KEY, RESET_VERSION);
    localStorage.setItem('carvion.app.reset.version', RESET_VERSION);
    const data = seed();
    save(data);
    if (options.loginAdmin) return login('admin', 'Admin@123', true);
    return { ok: true, data };
  };

  const audit = (action, module, description, ref, status = 'sucesso', actorName) => {
    const data = load();
    const session = getCurrentSession(data);
    const actor = actorName || session?.userName || 'Sistema';
    data.logs.unshift({
      id: uid('log'),
      at: now(),
      actor,
      action,
      module,
      description,
      ref: ref || '',
      origin: session?.ip || 'local',
      status,
    });
    save(data);
    return data.logs[0];
  };

  const currentSessionId = () => localStorage.getItem(CURRENT_SESSION);
  const setCurrentSession = (id) => localStorage.setItem(CURRENT_SESSION, id);
  const clearCurrentSession = () => localStorage.removeItem(CURRENT_SESSION);
  const getCurrentSession = (data = load()) => data.sessions.find((s) => s.id === currentSessionId()) || null;
  const getCurrentUser = (data = load()) => {
    const session = getCurrentSession(data);
    return session ? data.users.find((u) => u.id === session.userId && !u.deletedAt) : null;
  };

  const saveAndAudit = (data, action, module, description, ref, status = 'sucesso') => {
    const session = getCurrentSession(data);
    data.logs.unshift({
      id: uid('log'),
      at: now(),
      actor: session?.userName || 'Sistema',
      action,
      module,
      description,
      ref: ref || '',
      origin: session?.ip || 'local',
      status,
    });
    save(data);
  };

  const validateSession = () => {
    const data = load();
    const session = getCurrentSession(data);
    if (!session) return { ok: false, reason: 'sem sessão' };
    const user = data.users.find((u) => u.id === session.userId && !u.deletedAt);
    if (!user || user.status !== 'ativo') {
      session.status = 'bloqueada';
      session.blockReason = 'Usuário sem acesso ativo';
      saveAndAudit(data, 'sessão bloqueada', 'sessões', 'Usuário inativo/bloqueado tentou continuar sessão.', session.id, 'bloqueado');
      return { ok: false, reason: 'usuário sem acesso' };
    }
    if (session.status !== 'ativa') return { ok: false, reason: session.status };
    if (Date.now() - new Date(session.lastActivity).getTime() > SESSION_TTL) {
      session.status = 'expirada';
      saveAndAudit(data, 'sessão expirada', 'sessões', 'Sessão expirada por inatividade.', session.id, 'expirada');
      return { ok: false, reason: 'expirada' };
    }
    session.lastActivity = now();
    save(data);
    return { ok: true, session, user };
  };

  const requireAuth = () => {
    const result = validateSession();
    if (!result.ok) {
      clearCurrentSession();
      const next = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard');
      location.href = `auth/login.html?reason=${encodeURIComponent(result.reason)}&next=${next}`;
      return false;
    }
    return true;
  };

  const login = (identifier, password, keepConnected = false) => {
    const data = load();
    const input = sanitize(identifier).toLowerCase();
    const user = data.users.find((u) => !u.deletedAt && (u.email.toLowerCase() === input || u.login.toLowerCase() === input));
    if (!user || user.password !== password) {
      saveAndAudit(data, 'login falhou', 'autenticação', `Tentativa de login para ${input}`, '', 'erro');
      return { ok: false, message: 'E-mail/login ou senha inválidos.' };
    }
    if (user.status === 'bloqueado') return { ok: false, message: 'Usuário bloqueado. Contate o administrador.' };
    if (user.status === 'inativo') return { ok: false, message: 'Usuário inativo. Contate o administrador.' };
    if (user.status === 'pendente') return { ok: false, message: 'Usuário pendente de ativação.' };
    const session = {
      id: uid('ses'),
      userId: user.id,
      userName: user.name,
      loginAt: now(),
      lastActivity: now(),
      ip: fakeIp(),
      device: device(),
      status: 'ativa',
      origin: keepConnected ? 'login persistente' : 'login',
      blockReason: '',
    };
    data.sessions.unshift(session);
    user.lastAccess = now();
    saveAndAudit(data, 'login realizado', 'autenticação', `${user.name} entrou no sistema.`, session.id);
    setCurrentSession(session.id);
    return { ok: true, session, user };
  };

  const logout = () => {
    const data = load();
    const session = getCurrentSession(data);
    if (session) {
      session.status = 'encerrada';
      saveAndAudit(data, 'logout', 'autenticação', 'Sessão encerrada pelo usuário.', session.id);
    }
    clearCurrentSession();
  };

  const hasPermission = (permission, user = getCurrentUser()) => {
    if (!user) return false;
    const rolePerms = permissionsByRole[user.role] || [];
    const custom = user.permissions || [];
    return rolePerms.includes('*') || custom.includes('*') || rolePerms.includes(permission) || custom.includes(permission);
  };

  const canAccessModule = (moduleId, user = getCurrentUser()) => {
    const map = {
      dashboard: 'dashboard:view',
      sales: 'orders:view',
      'orders-admin': 'orders:view',
      'users-admin': 'users:view',
      'sessions-admin': 'sessions:manage',
      'audit-admin': 'logs:view',
      reports: 'reports:view',
      analytics: 'reports:view',
      cashflow: 'finance:view',
      payables: 'finance:view',
      receivables: 'finance:view',
      production: 'production:view',
      costing: 'production:view',
      materials: 'stock:view',
      products: 'stock:view',
      'finished-stock': 'stock:view',
      settings: 'settings:view',
    };
    return hasPermission(map[moduleId] || 'dashboard:view', user);
  };

  const strongPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password || '');
  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

  const createUser = (input) => {
    const data = load();
    if (!hasPermission('users:create')) return { ok: false, message: 'Acesso negado.' };
    const user = {
      id: uid('usr'),
      name: sanitize(input.name),
      email: sanitize(input.email).toLowerCase(),
      login: sanitize(input.login).toLowerCase(),
      phone: sanitize(input.phone),
      position: sanitize(input.position),
      role: input.role || 'visualização',
      status: input.status || 'ativo',
      password: input.password,
      createdAt: now(),
      lastAccess: null,
      notes: sanitize(input.notes),
      permissions: permissionsByRole[input.role] || [],
      deletedAt: null,
    };
    const errors = [];
    if (!user.name) errors.push('Nome obrigatório.');
    if (!validEmail(user.email)) errors.push('E-mail inválido.');
    if (!user.login) errors.push('Login obrigatório.');
    if (data.users.some((u) => !u.deletedAt && u.email === user.email)) errors.push('E-mail já cadastrado.');
    if (data.users.some((u) => !u.deletedAt && u.login === user.login)) errors.push('Login já cadastrado.');
    if (!strongPassword(user.password)) errors.push('Senha deve ter 8+ caracteres, maiúscula, minúscula e número.');
    if (errors.length) return { ok: false, message: errors.join(' ') };
    data.users.unshift(user);
    saveAndAudit(data, 'usuário criado', 'usuários', `Usuário ${user.name} criado.`, user.id);
    return { ok: true, user };
  };

  const updateUser = (id, patch) => {
    const data = load();
    if (!hasPermission('users:edit')) return { ok: false, message: 'Acesso negado.' };
    const user = data.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) return { ok: false, message: 'Usuário não encontrado.' };
    Object.assign(user, {
      name: sanitize(patch.name ?? user.name),
      email: sanitize(patch.email ?? user.email).toLowerCase(),
      login: sanitize(patch.login ?? user.login).toLowerCase(),
      phone: sanitize(patch.phone ?? user.phone),
      position: sanitize(patch.position ?? user.position),
      role: patch.role ?? user.role,
      status: patch.status ?? user.status,
      notes: sanitize(patch.notes ?? user.notes),
      permissions: permissionsByRole[patch.role ?? user.role] || user.permissions,
    });
    if (user.status !== 'ativo') data.sessions.filter((s) => s.userId === user.id && s.status === 'ativa').forEach((s) => { s.status = 'bloqueada'; s.blockReason = 'Usuário bloqueado/inativo'; });
    saveAndAudit(data, 'usuário editado', 'usuários', `Usuário ${user.name} atualizado.`, user.id);
    return { ok: true, user };
  };

  const resetPassword = (id, password) => {
    if (!strongPassword(password)) return { ok: false, message: 'Senha fraca.' };
    const data = load();
    const user = data.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) return { ok: false, message: 'Usuário não encontrado.' };
    user.password = password;
    saveAndAudit(data, 'senha redefinida', 'usuários', `Senha de ${user.name} redefinida.`, user.id);
    return { ok: true };
  };

  const deleteUser = (id) => {
    const data = load();
    if (!hasPermission('users:edit')) return { ok: false, message: 'Acesso negado.' };
    const user = data.users.find((u) => u.id === id && !u.deletedAt);
    if (!user) return { ok: false, message: 'Usuário não encontrado.' };
    user.status = 'inativo';
    user.deletedAt = now();
    data.sessions.filter((s) => s.userId === user.id && s.status === 'ativa').forEach((s) => { s.status = 'revogada'; s.blockReason = 'Usuário removido'; });
    saveAndAudit(data, 'exclusão lógica de registro', 'usuários', `Usuário ${user.name} removido logicamente.`, user.id);
    return { ok: true };
  };

  const blockSession = (id, reason = 'Bloqueio manual') => {
    const data = load();
    if (!hasPermission('sessions:manage')) return { ok: false, message: 'Acesso negado.' };
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return { ok: false, message: 'Sessão não encontrada.' };
    session.status = 'bloqueada';
    session.blockReason = sanitize(reason);
    saveAndAudit(data, 'sessão bloqueada', 'sessões', reason, session.id, 'bloqueado');
    return { ok: true };
  };

  const blockUserSessions = (userId, reason = 'Bloqueio administrativo do usuário') => {
    const data = load();
    if (!hasPermission('sessions:manage')) return { ok: false, message: 'Acesso negado.' };
    data.sessions.filter((s) => s.userId === userId && s.status === 'ativa').forEach((session) => {
      session.status = 'bloqueada';
      session.blockReason = sanitize(reason);
    });
    saveAndAudit(data, 'sessões bloqueadas', 'sessões', reason, userId, 'bloqueado');
    return { ok: true };
  };

  const revokeSession = (id) => {
    const data = load();
    const current = getCurrentSession(data);
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return { ok: false, message: 'Sessão não encontrada.' };
    if (session.userId !== current?.userId && !hasPermission('sessions:manage')) return { ok: false, message: 'Acesso negado.' };
    session.status = 'revogada';
    saveAndAudit(data, 'sessão revogada', 'sessões', 'Sessão revogada remotamente.', session.id, 'revogada');
    if (session.id === current?.id) clearCurrentSession();
    return { ok: true };
  };

  const endOtherSessions = () => {
    const data = load();
    const current = getCurrentSession(data);
    if (!current) return { ok: false, message: 'Sessão atual não encontrada.' };
    data.sessions.filter((s) => s.userId === current.userId && s.id !== current.id && s.status === 'ativa').forEach((session) => {
      session.status = 'encerrada';
      session.blockReason = 'Encerrada pelo próprio usuário';
    });
    saveAndAudit(data, 'sessões encerradas', 'sessões', 'Outras sessões do usuário foram encerradas.', current.userId);
    return { ok: true };
  };

  const endCurrentSession = () => {
    const data = load();
    const current = getCurrentSession(data);
    if (!current) return { ok: false, message: 'Sessão atual não encontrada.' };
    current.status = 'encerrada';
    saveAndAudit(data, 'sessão encerrada', 'sessões', 'Sessão atual encerrada.', current.id);
    clearCurrentSession();
    return { ok: true };
  };

  const calculateTotals = (items) => {
    const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalStickers = items.reduce((sum, item) => sum + Number(item.stickers || 0), 0);
    const totalSheets = items.reduce((sum, item) => sum + Math.ceil(Number(item.quantity || 0) / Math.max(Number(item.perSheet || 1), 1)), 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitValue || 0), 0);
    return { totalItems, totalStickers, totalSheets, subtotal, total: subtotal };
  };

  const validateOrder = (order) => {
    const errors = [];
    if (!sanitize(order.customer)) errors.push('Cliente obrigatório.');
    if (!order.deliveryDate) errors.push('Prazo de entrega obrigatório.');
    if (!order.items?.length) errors.push('Informe ao menos um item.');
    order.items?.forEach((item, index) => {
      if (!sanitize(item.product)) errors.push(`Item ${index + 1}: produto obrigatório.`);
      if (Number(item.quantity) <= 0) errors.push(`Item ${index + 1}: quantidade deve ser maior que zero.`);
      if (Number(item.unitValue) < 0) errors.push(`Item ${index + 1}: valor unitário inválido.`);
    });
    return errors;
  };

  const createOrder = (input) => {
    const data = load();
    if (!hasPermission('orders:create')) return { ok: false, message: 'Acesso negado.' };
    const order = {
      id: uid('so'),
      number: `PV-${1000 + data.orders.length + 1}`,
      requestDate: input.requestDate || now().slice(0, 10),
      requester: sanitize(input.requester || getCurrentUser(data)?.name),
      company: sanitize(input.company || 'CARVION'),
      customer: sanitize(input.customer),
      deliveryDate: input.deliveryDate,
      notes: sanitize(input.notes),
      status: 'em aberto',
      deletedAt: null,
      history: [{ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'pedido criado' }],
      items: input.items || [],
      totals: {},
    };
    const errors = validateOrder(order);
    if (errors.length) return { ok: false, message: errors.join(' ') };
    order.totals = calculateTotals(order.items);
    data.orders.unshift(order);
    saveAndAudit(data, 'pedido criado', 'pedido de vendas', `Pedido ${order.number} criado.`, order.id);
    return { ok: true, order };
  };

  const updateOrder = (id, patch) => {
    const data = load();
    const order = data.orders.find((o) => o.id === id && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    if (order.status === 'emitido' && !hasPermission('orders:admin-edit')) return { ok: false, message: 'Pedido emitido não pode ser editado.' };
    if (!hasPermission('orders:edit')) return { ok: false, message: 'Acesso negado.' };
    Object.assign(order, patch);
    order.items = order.items || [];
    const errors = validateOrder(order);
    if (errors.length) return { ok: false, message: errors.join(' ') };
    order.totals = calculateTotals(order.items);
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'pedido editado' });
    saveAndAudit(data, 'pedido editado', 'pedido de vendas', `Pedido ${order.number} editado.`, order.id);
    return { ok: true, order };
  };

  const emitOrder = (id) => {
    const data = load();
    if (!hasPermission('orders:emit')) return { ok: false, message: 'Acesso negado.' };
    const order = data.orders.find((o) => o.id === id && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    const errors = validateOrder(order);
    if (errors.length) return { ok: false, message: errors.join(' ') };
    order.status = 'emitido';
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'pedido emitido' });
    saveAndAudit(data, 'pedido emitido', 'pedido de vendas', `Pedido ${order.number} emitido.`, order.id);
    return { ok: true, order };
  };

  const cancelOrder = (id, reason) => {
    if (!sanitize(reason)) return { ok: false, message: 'Motivo do cancelamento obrigatório.' };
    const data = load();
    const order = data.orders.find((o) => o.id === id && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    order.status = 'cancelado';
    order.cancelReason = sanitize(reason);
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: `pedido cancelado: ${order.cancelReason}` });
    saveAndAudit(data, 'pedido cancelado', 'pedido de vendas', `Pedido ${order.number} cancelado.`, order.id);
    return { ok: true, order };
  };

  const deleteOrder = (id) => {
    const data = load();
    if (!hasPermission('orders:delete')) return { ok: false, message: 'Acesso negado.' };
    const order = data.orders.find((o) => o.id === id && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    order.deletedAt = now();
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'exclusão lógica' });
    saveAndAudit(data, 'exclusão lógica de registro', 'pedido de vendas', `Pedido ${order.number} removido logicamente.`, order.id);
    return { ok: true };
  };

  const duplicateOrder = (id) => {
    const data = load();
    const order = data.orders.find((o) => o.id === id && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    return createOrder({ ...clone(order), status: 'em aberto', number: undefined, requestDate: now().slice(0, 10) });
  };

  const addOrderItem = (orderId, item) => {
    const data = load();
    const order = data.orders.find((o) => o.id === orderId && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    if (order.status === 'emitido' && !hasPermission('orders:admin-edit')) return { ok: false, message: 'Pedido emitido não pode ser editado.' };
    order.items.push({
      id: uid('item'),
      product: sanitize(item.product),
      description: sanitize(item.description),
      quantity: Number(item.quantity || 0),
      observation: sanitize(item.observation),
      unitValue: Number(item.unitValue || 0),
      stickers: Number(item.stickers || 0),
      perSheet: Number(item.perSheet || 1),
    });
    const errors = validateOrder(order);
    if (errors.length) return { ok: false, message: errors.join(' ') };
    order.totals = calculateTotals(order.items);
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'item adicionado' });
    saveAndAudit(data, 'pedido editado', 'pedido de vendas', `Item adicionado ao pedido ${order.number}.`, order.id);
    return { ok: true, order };
  };

  const removeOrderItem = (orderId, itemId) => {
    const data = load();
    const order = data.orders.find((o) => o.id === orderId && !o.deletedAt);
    if (!order) return { ok: false, message: 'Pedido não encontrado.' };
    if (order.status === 'emitido' && !hasPermission('orders:admin-edit')) return { ok: false, message: 'Pedido emitido não pode ser editado.' };
    order.items = order.items.filter((item) => item.id !== itemId);
    const errors = validateOrder(order);
    if (errors.length) return { ok: false, message: errors.join(' ') };
    order.totals = calculateTotals(order.items);
    order.history.unshift({ at: now(), user: getCurrentSession(data)?.userName || 'Sistema', action: 'item removido' });
    saveAndAudit(data, 'pedido editado', 'pedido de vendas', `Item removido do pedido ${order.number}.`, order.id);
    return { ok: true, order };
  };

  const exportData = (module = 'all') => {
    const data = load();
    if (!hasPermission('export:data')) return { ok: false, message: 'Acesso negado.' };
    const payload = module === 'all' ? data : data[module];
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carvion-${module}-${now().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    audit('exportar dados', module, `Exportação de ${module}.`);
    return { ok: true };
  };

  window.Carvion = {
    load,
    save,
    audit,
    login,
    logout,
    resetDemoData,
    requireAuth,
    validateSession,
    refreshSession: validateSession,
    currentSessionId,
    getCurrentSession,
    getCurrentUser,
    hasPermission,
    canAccessModule,
    checkPermission: hasPermission,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    blockSession,
    blockUserSessions,
    revokeSession,
    endOtherSessions,
    endCurrentSession,
    calculateTotals,
    createOrder,
    updateOrder,
    emitOrder,
    cancelOrder,
    deleteOrder,
    duplicateOrder,
    addOrderItem,
    removeOrderItem,
    exportData,
    permissionsByRole,
    sanitize,
  };
})();
