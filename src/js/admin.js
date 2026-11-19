const apiBaseUrl = String(globalThis.__RESILIENCE_RUNTIME__?.apiBaseUrl || '').replace(/\/+$/, '');
const $ = (selector) => document.querySelector(selector);
const pageSize = 25;
let currentPage = 1;
let overview = null;
let listRequest = 0;
let detailRequest = 0;
let drawerTrigger = null;

async function request(path, options = {}) {
    if (!apiBaseUrl) throw new Error('当前页面没有配置 API。');
    const response = await fetch(`${apiBaseUrl}${path}`, {
        credentials: 'include',
        cache: 'no-store',
        ...options,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || `请求失败 (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function formatDate(value, includeTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '—';
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    }).format(date);
}

function formatDuration(seconds) {
    if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
    const total = Math.max(0, Math.floor(Number(seconds)));
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;
    return minutes ? `${minutes}分${remaining}秒` : `${remaining}秒`;
}

function showMessage(message) {
    const element = $('#globalMessage');
    element.textContent = message;
    element.classList.add('visible');
    setTimeout(() => element.classList.remove('visible'), 2800);
}

function renderOverview(data) {
    overview = data;
    const cards = [
        { label: '已入组', value: data.participants.enrolled, detail: `进行中 ${data.participants.active} 人`, filter: 'enrolled' },
        { label: '今日完成率', value: `${(data.today.completionRate * 100).toFixed(1)}%`, detail: `今日完成 ${data.today.completed} / 应训练 ${data.today.eligible} 人`, filter: 'today' },
        { label: '完成 6-7', value: `${data.participants.graduated}`, detail: `结业率 ${(data.participants.graduationRate * 100).toFixed(1)}%`, filter: 'graduated' },
        { label: '连续两日未完成', value: data.alerts.participantCount, detail: '点击查看需要跟进的参与者', filter: 'alert' },
        { label: '已暂停', value: data.participants.paused, detail: `已退出 ${data.participants.withdrawn} 人`, filter: 'paused' }
    ];
    $('#overviewGrid').innerHTML = cards.map((card) => `<button class="metric" type="button" data-metric="${card.filter}"><span>${card.label}</span><strong>${card.value}</strong><small>${card.detail}</small></button>`).join('');
    $('#updatedAt').textContent = `统计日期 ${escapeHtml(data.date)}（北京时间） · 更新于 ${formatDate(data.updatedAt, true)}`;
    document.querySelectorAll('[data-metric]').forEach((button) => button.addEventListener('click', () => {
        $('#alertFilter').checked = button.dataset.metric === 'alert';
        $('#statusFilter').value = button.dataset.metric === 'paused' ? 'paused' : 'all';
        $('#completionFilter').value = ['today', 'graduated', 'enrolled'].includes(button.dataset.metric) ? button.dataset.metric : 'all';
        $('#searchInput').value = '';
        currentPage = 1;
        loadParticipants().catch((error) => showMessage(error.message));
        document.querySelector('.participants-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
}

function statusLabel(status) {
    return ({ active: '进行中', paused: '已暂停', archived: '已退出' })[status] || status;
}

function renderParticipants(data) {
    $('#resultCount').textContent = `${data.total} 人`;
    const rows = $('#participantRows');
    if (!data.items.length) {
        rows.innerHTML = '<tr><td colspan="8" class="empty-state">没有符合条件的参与者</td></tr>';
    } else {
        rows.innerHTML = data.items.map((item) => `<tr tabindex="0" role="button" data-participant="${escapeHtml(item.participantId)}">
            <td class="code-cell">${escapeHtml(item.participantCode)}</td><td>${escapeHtml(item.participantName)}</td>
            <td><span class="status status-${escapeHtml(item.status)}">${statusLabel(item.status)}</span></td>
            <td>${formatDate(item.enrolledAt)}</td><td>${item.completedDays}/42${item.graduated ? ' · 已结业' : ''}</td>
            <td>${item.lastModuleId ? `${escapeHtml(item.lastModuleId)} · ${formatDate(item.lastCompletedAt)}` : '—'}</td>
            <td>${formatDuration(item.lastPracticeDurationSeconds)}</td>
            <td>${item.alert ? `<span class="alert-mark">连续 ${item.missedExpectedDays} 日</span>` : '—'}</td>
        </tr>`).join('');
        rows.querySelectorAll('[data-participant]').forEach((row) => {
            const open = () => openParticipant(row.dataset.participant);
            row.addEventListener('click', open);
            row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
        });
    }
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $('#pageLabel').textContent = `第 ${data.page} / ${totalPages} 页`;
    $('#previousPage').disabled = data.page <= 1;
    $('#nextPage').disabled = data.page >= totalPages;
}

async function loadOverview() {
    renderOverview(await request('/api/v1/admin/overview'));
}

async function loadParticipants() {
    const requestId = ++listRequest;
    $('#participantRows').innerHTML = '<tr><td colspan="8" class="empty-state">正在加载参与者</td></tr>';
    const params = new URLSearchParams({
        page: String(currentPage), pageSize: String(pageSize),
        status: $('#statusFilter').value, q: $('#searchInput').value.trim(),
        sort: $('#sortFilter').value,
        completion: $('#completionFilter').value,
        alert: String($('#alertFilter').checked)
    });
    try {
        const data = await request(`/api/v1/admin/participants?${params}`);
        if (requestId === listRequest) renderParticipants(data);
    } catch (error) {
        if (requestId !== listRequest) return;
        $('#participantRows').innerHTML = '<tr><td colspan="8" class="empty-state">加载失败，请刷新重试</td></tr>';
        throw error;
    }
}

function openDrawer() {
    if ($('#participantDrawer').hidden) drawerTrigger = document.activeElement;
    $('#participantDrawer').hidden = false;
    $('#drawerBackdrop').hidden = false;
    document.body.classList.add('drawer-open');
    $('.admin-shell').inert = true;
    $('#closeDrawer').focus();
}

function closeDrawer() {
    detailRequest += 1;
    $('#participantDrawer').hidden = true;
    $('#drawerBackdrop').hidden = true;
    document.body.classList.remove('drawer-open');
    $('.admin-shell').inert = false;
    if (drawerTrigger?.isConnected) drawerTrigger.focus();
}

async function openParticipant(id) {
    const requestId = ++detailRequest;
    openDrawer();
    $('#drawerTitle').textContent = '正在加载';
    $('#drawerContent').innerHTML = '<p class="empty-state">正在加载训练记录</p>';
    try {
        const data = await request(`/api/v1/admin/participants/${encodeURIComponent(id)}`);
        if (requestId !== detailRequest) return;
        const participant = data.participant;
        $('#drawerTitle').textContent = `${participant.participantCode} · ${participant.participantName}`;
        const actions = participant.status === 'active'
            ? '<button class="button button-secondary" data-status="paused">暂停参与</button><button class="button button-danger" data-status="archived">标记退出</button>'
            : participant.status === 'paused'
                ? '<button class="button button-primary" data-status="active">恢复参与</button><button class="button button-danger" data-status="archived">标记退出</button>'
                : '<button class="button button-primary" data-status="active">恢复为进行中</button>';
        $('#drawerContent').innerHTML = `<dl class="participant-facts">
            <div><dt>状态</dt><dd>${statusLabel(participant.status)}</dd></div>
            <div><dt>首次进入</dt><dd>${formatDate(participant.createdAt, true)}</dd></div>
            <div><dt>最近活动</dt><dd>${formatDate(participant.lastSeenAt, true)}</dd></div>
        </dl><div class="status-actions">${actions}</div>
        <div class="section-heading"><h3>训练记录</h3><span>${data.moduleRuns.length} 条</span></div>
        <div class="run-list">${data.moduleRuns.length ? data.moduleRuns.map((run) => `<article class="run-row">
            <div><strong>第 ${run.dayIndex} 天 · ${escapeHtml(run.moduleId)}</strong><span class="status status-${run.status === 'completed' ? 'active' : 'paused'}">${run.status === 'completed' ? '已完成' : '进行中'}</span></div>
            <p>${run.completedAt ? `完成于 ${formatDate(run.completedAt, true)}` : '尚未完成'}</p>
            <small>练习时长 ${formatDuration(run.practiceDurationSeconds)}</small>
        </article>`).join('') : '<p class="empty-state">尚无训练记录</p>'}</div>
        <p class="readonly-note">此视图不展示输入内容，也不能修改练习记录。</p>`;
        $('#drawerContent').querySelectorAll('[data-status]').forEach((button) => button.addEventListener('click', async () => {
            const nextStatus = button.dataset.status;
            if (!globalThis.confirm(`确定将 ${participant.participantCode} 的状态改为“${statusLabel(nextStatus)}”吗？`)) return;
            button.disabled = true;
            try {
                await request(`/api/v1/admin/participants/${encodeURIComponent(id)}/status`, {
                    method: 'POST', body: JSON.stringify({ status: nextStatus })
                });
                showMessage('参与状态已更新');
                await Promise.all([loadOverview(), loadParticipants()]);
                await openParticipant(id);
            } catch (error) {
                showMessage(error.message);
                button.disabled = false;
            }
        }));
    } catch (error) {
        if (requestId !== detailRequest) return;
        $('#drawerContent').innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
    }
}

function showDashboard(username) {
    $('#loginView').hidden = true;
    $('#dashboardView').hidden = false;
    $('#staffBar').hidden = false;
    $('#staffName').textContent = username;
    loadOverview().then(loadParticipants).catch((error) => showMessage(error.message));
}

$('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    $('#loginError').textContent = '';
    try {
        const result = await request('/api/v1/admin/login', {
            method: 'POST',
            body: JSON.stringify({ username: $('#username').value.trim(), password: $('#password').value })
        });
        $('#password').value = '';
        showDashboard(result.username);
    } catch (error) {
        $('#loginError').textContent = error.status === 503 ? '后台认证尚未配置，请联系系统维护人员。' : '账号或密码不正确，请重试。';
    } finally {
        button.disabled = false;
    }
});

$('#logoutButton').addEventListener('click', async () => {
    try { await request('/api/v1/admin/logout', { method: 'POST', body: '{}' }); }
    catch { showMessage('退出未成功，请检查网络后重试。'); return; }
    listRequest += 1;
    closeDrawer();
    $('#participantRows').replaceChildren();
    $('#drawerContent').replaceChildren();
    $('#dashboardView').hidden = true;
    $('#staffBar').hidden = true;
    $('#loginView').hidden = false;
    $('#loginForm').reset();
});
$('#filters').addEventListener('submit', (event) => { event.preventDefault(); currentPage = 1; loadParticipants().catch((error) => showMessage(error.message)); });
$('#refreshButton').addEventListener('click', () => Promise.all([loadOverview(), loadParticipants()]).catch((error) => showMessage(error.message)));
$('#previousPage').addEventListener('click', () => { currentPage = Math.max(1, currentPage - 1); loadParticipants().catch((error) => showMessage(error.message)); });
$('#nextPage').addEventListener('click', () => { currentPage += 1; loadParticipants().catch((error) => showMessage(error.message)); });
$('#closeDrawer').addEventListener('click', closeDrawer);
$('#drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => {
    if ($('#participantDrawer').hidden) return;
    if (event.key === 'Escape') closeDrawer();
    if (event.key === 'Tab') {
        const controls = [...$('#participantDrawer').querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
});

const localDevelopment = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);
if (globalThis.__RESILIENCE_RUNTIME__?.deploymentId !== 'mainland' && !localDevelopment) {
    $('#loginView').hidden = false;
    $('#loginError').textContent = '研究管理后台目前仅连接中国大陆研究数据。';
    $('#loginForm').querySelectorAll('input, button').forEach((element) => { element.disabled = true; });
} else {
    request('/api/v1/admin/session').then((result) => showDashboard(result.username))
        .catch(() => { $('#loginView').hidden = false; $('#username').focus(); });
}
