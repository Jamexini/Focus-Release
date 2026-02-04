const el = {
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    timer: document.getElementById('timer'),
    progressRing: document.getElementById('progressRing'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    pomodoroStatus: document.getElementById('pomodoroStatus'),
    phaseLabel: document.getElementById('phaseLabel'),
    cycleCount: document.getElementById('cycleCount'),
    blockModeBtn: document.getElementById('blockModeBtn'),
    whiteModeBtn: document.getElementById('whiteModeBtn'),
    modeHint: document.getElementById('modeHint'),
    siteList: document.getElementById('siteList'),
    customDomain: document.getElementById('customDomain'),
    addCustomBtn: document.getElementById('addCustomBtn'),
    whitelistCurrentBtn: document.getElementById('whitelistCurrentBtn'),
    passwordInput: document.getElementById('passwordInput'),
    setPasswordBtn: document.getElementById('setPasswordBtn'),
    passwordStatus: document.getElementById('passwordStatus'),
    statTotalTime: document.getElementById('statTotalTime'),
    statSessions: document.getElementById('statSessions'),
    statStreak: document.getElementById('statStreak'),
    siteTimeList: document.getElementById('siteTimeList'),
    themeToggle: document.getElementById('themeToggle'),
    soundToggle: document.getElementById('soundToggle'),
    pomodoroToggle: document.getElementById('pomodoroToggle'),
    scheduleToggle: document.getElementById('scheduleToggle'),
    scheduleConfig: document.getElementById('scheduleConfig'),
    scheduleStart: document.getElementById('scheduleStart'),
    scheduleEnd: document.getElementById('scheduleEnd'),
    dayBtns: document.querySelectorAll('.day-btn'),
    toggle: document.getElementById('toggle'),
    statusText: document.getElementById('statusText'),
    pingBtn: document.getElementById('pingBtn'),
    quoteBtn: document.getElementById('quoteBtn'),
    dogBtn: document.getElementById('dogBtn'),
    apiResult: document.getElementById('apiResult'),
    emergencyContainer: document.getElementById('emergencyContainer'),
    emergencyBtn: document.getElementById('emergencyBtn'),
    emergencyHint: document.getElementById('emergencyHint'),
    emergencyCountdown: document.getElementById('emergencyCountdown'),
    customH: document.getElementById('customH'),
    customM: document.getElementById('customM'),
    customS: document.getElementById('customS'),
    customTimeToggle: document.getElementById('customTimeToggle'),
    customTimePicker: document.getElementById('customTimePicker'),
    applyTimeBtn: document.getElementById('applyTimeBtn'),
    closeTimePicker: document.getElementById('closeTimePicker'),
    challengeToggle: document.getElementById('challengeToggle'),
    challengeConfig: document.getElementById('challengeConfig'),
    challengeInput: document.getElementById('challengeInput'),
    setChallengeBtn: document.getElementById('setChallengeBtn'),
    challengeStatus: document.getElementById('challengeStatus'),
    speedBtn: document.getElementById('speedBtn'),
    funBtn: document.getElementById('funBtn'),
    weeklyChart: document.getElementById('weeklyChart')
};
let state = {
    duration: 25,
    timeLeft: 25 * 60,
    endTime: 0,
    isRunning: false,
    enabled: true,
    blocklist: [],
    whitelist: [],
    allSites: [],
    whitelistMode: false,
    challengeEnabled: false,
    challengeText: null,
    pomodoroEnabled: false,
    pomodoroPhase: 'work',
    pomodoroCount: 0,
    scheduleEnabled: false,
    scheduleDays: [1, 2, 3, 4, 5],
    scheduleStart: '09:00',
    scheduleEnd: '17:00',
    theme: 'dark',
    soundEnabled: true,
    totalFocusTime: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    siteTimeData: {},
    isEmergency: false,
    funMode: false
};
let uiInterval = null;
const RING_CIRCUMFERENCE = 2 * Math.PI * 80;
function getFavicon(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
async function callBG(cmd, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ cmd, ...data }, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
                resolve(response || { success: false });
            }
        });
    });
}
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
function formatDuration(totalSeconds) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
}
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}
function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
}
function triggerConfetti(x, y) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        particle.style.borderRadius = '50%';
        particle.style.zIndex = '100000';
        particle.style.pointerEvents = 'none';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        document.body.appendChild(particle);
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 8;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        let posX = x;
        let posY = y;
        let opacity = 1;
        const anim = setInterval(() => {
            posX += vx;
            posY += vy;
            opacity -= 0.02;
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(anim);
                particle.remove();
            }
        }, 16);
    }
}
async function init() {
    const data = await chrome.storage.local.get(null);
    state = { ...state, ...data };
    if (!state.blocklist || state.blocklist.length === 0) {
        const bgDefaults = {
            blocklist: ["youtube.com", "facebook.com", "twitter.com", "instagram.com", "tiktok.com", "netflix.com", "discord.com", "twitch.tv"],
            allSites: [
                { domain: "youtube.com", name: "YouTube" },
                { domain: "facebook.com", name: "Facebook" },
                { domain: "twitter.com", name: "Twitter/X" },
                { domain: "instagram.com", name: "Instagram" },
                { domain: "reddit.com", name: "Reddit" },
                { domain: "tiktok.com", name: "TikTok" },
                { domain: "netflix.com", name: "Netflix" },
                { domain: "twitch.tv", name: "Twitch" },
                { domain: "discord.com", name: "Discord" }
            ],
            whitelist: [
                "google.com", "gmail.com", "github.com", "stackoverflow.com",
                "wikipedia.org", "docs.google.com", "zoom.us", "slack.com",
                "trello.com", "notion.so", "canvas.instructure.com", "medium.com"
            ]
        };
        state.blocklist = bgDefaults.blocklist;
        state.allSites = bgDefaults.allSites;
        if (!state.whitelist || state.whitelist.length === 0) state.whitelist = bgDefaults.whitelist;
    }
    if (state.theme === 'light') {
        document.body.classList.add('light-theme');
        el.themeToggle.checked = false;
    } else {
        document.body.classList.remove('light-theme');
        el.themeToggle.checked = true;
    }
    updateModeUI();
    updateGlobalStatus(state.enabled);
    updateTimerDisplay();
    updateProgressRing();
    renderSiteList();
    updateStats();
    loadSettings();
    if (state.isRunning) {
        startUISync();
    }
    el.customTimeToggle.onclick = () => {
        if (state.isRunning) return;
        el.customTimePicker.style.display = 'flex';
        playSound('click');
    };
    el.applyTimeBtn.onclick = () => {
        const h = parseInt(el.customH.value) || 0;
        const m = parseInt(el.customM.value) || 0;
        const s = parseInt(el.customS.value) || 0;
        const totalSec = (h * 3600) + (m * 60) + s;
        if (totalSec <= 0) {
            alert('Please set a valid time!');
            return;
        }
        state.timeLeft = totalSec;
        state.duration = Math.ceil(totalSec / 60);
        updateTimerDisplay();
        updateProgressRing();
        el.customTimePicker.style.display = 'none';
        el.presetBtns.forEach(b => b.classList.remove('active'));
        playSound('success');
    };
    el.customTimePicker.onclick = (e) => {
        if (e.target === el.customTimePicker) {
            el.customTimePicker.style.display = 'none';
        }
    };
    el.closeTimePicker.onclick = () => {
        el.customTimePicker.style.display = 'none';
    };
    el.emergencyContainer.style.display = 'block';
    el.presetBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.mins) === state.duration);
    });
}
function updateModeUI() {
    el.whiteModeBtn.classList.toggle('active', state.whitelistMode);
    el.blockModeBtn.classList.toggle('active', !state.whitelistMode);
    el.modeHint.textContent = state.whitelistMode ?
        'These sites will NEVER be blocked' :
        'These sites will be STOPPED during focus';
}
el.tabBtns.forEach(btn => {
    btn.onclick = () => {
        const tabId = btn.dataset.tab;
        el.tabBtns.forEach(b => b.classList.remove('active'));
        el.tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        playSound('switch');
    };
});
function updateTimerDisplay() {
    el.timer.textContent = formatTime(state.timeLeft);
}
function updateProgressRing() {
    const total = state.duration * 60;
    const progress = state.timeLeft / total;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    el.progressRing.style.strokeDasharray = RING_CIRCUMFERENCE;
    el.progressRing.style.strokeDashoffset = offset;
}
el.presetBtns.forEach(btn => {
    btn.onclick = () => {
        if (state.isRunning) return;
        const mins = parseInt(btn.dataset.mins);
        state.duration = mins;
        state.timeLeft = mins * 60;
        el.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        el.customH.value = Math.floor(mins / 60);
        el.customM.value = mins % 60;
        el.customS.value = 0;
        chrome.storage.local.set({ duration: mins, timeLeft: mins * 60 });
        updateTimerDisplay();
        updateProgressRing();
        playSound('click');
    };
});
el.startBtn.onclick = async () => {
    if (state.isRunning) {
        if (state.challengeEnabled && state.challengeText && !state.isEmergency) {
            let targetText = state.challengeText;
            if (targetText === "(RANDOM_QUOTE)") {
                const res = await callBG('GET_QUOTE');
                if (res.success) {
                    const author = (res.data.author && res.data.author !== "Unknown") ? ` - ${res.data.author}` : "";
                    targetText = `"${res.data.text}"${author}`;
                }
                else targetText = "Focus on your goals.";
            }
            const userInput = prompt(`Type the following text to stop:\n\n${targetText}`);
            if (userInput === null) return;
            let target = targetText;
            const quoteMatch = target.match(/"([^"]+)"/);
            if (quoteMatch) target = quoteMatch[1];
            if (userInput.trim().toLowerCase() !== target.trim().toLowerCase()) {
                alert("Text does not match!");
                return;
            }
        }
        await callBG('STOP_TIMER');
        stopUISync();
        playSound('stop');
    } else {
        const h = parseInt(el.customH.value) || 0;
        const m = parseInt(el.customM.value) || 0;
        const s = parseInt(el.customS.value) || 0;
        const customSeconds = (h * 3600) + (m * 60) + s;
        if (customSeconds <= 0) {
            el.apiResult.textContent = 'Set a valid time!';
            return;
        }
        await callBG('START_TIMER', { customSeconds });
        const data = await chrome.storage.local.get(['endTime', 'isRunning']);
        state.endTime = data.endTime;
        startUISync();
        playSound('start');
        el.emergencyContainer.style.display = 'block';
    }
};
el.resetBtn.onclick = async () => {
    if (state.challengeEnabled && state.challengeText && state.isRunning && !state.isEmergency) {
        let targetText = state.challengeText;
        if (targetText === "(RANDOM_QUOTE)") {
            const res = await callBG('GET_QUOTE');
            if (res.success) {
                const author = (res.data.author && res.data.author !== "Unknown") ? ` - ${res.data.author}` : "";
                targetText = `"${res.data.text}"${author}`;
            }
            else targetText = "Focus on your goals.";
        }
        const userInput = prompt(`Type the following text to stop:\n\n${targetText}`);
        if (userInput === null) return;
        let target = targetText;
        const quoteMatch = target.match(/"([^"]+)"/);
        if (quoteMatch) target = quoteMatch[1];
        if (userInput.trim().toLowerCase() !== target.trim().toLowerCase()) {
            alert('Text does not match!');
            return;
        }
    }
    await callBG('STOP_TIMER');
    stopUISync();
    state.timeLeft = state.duration * 60;
    chrome.storage.local.set({ timeLeft: state.timeLeft });
    updateTimerDisplay();
    updateProgressRing();
};
function startUISync() {
    state.isRunning = true;
    el.startBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>Pause</span>`;
    el.startBtn.style.background = 'var(--danger)';
    el.customTimeToggle.style.display = 'none';
    document.querySelector('.presets').style.display = 'none';
    if (state.pomodoroEnabled) {
        el.pomodoroStatus.style.display = 'flex';
    }
    if (uiInterval) clearInterval(uiInterval);
    uiInterval = setInterval(async () => {
        const data = await chrome.storage.local.get(['timeLeft', 'isRunning', 'pomodoroPhase', 'pomodoroCount', 'endTime', 'isEmergency', 'emergencyEndTime']);
        if (!data.isRunning) {
            stopUISync();
            if (state.soundEnabled) playSound('complete');
            updateStats();
            return;
        }
        if (data.isEmergency && data.emergencyEndTime) {
            el.emergencyHint.style.display = 'block';
            el.emergencyBtn.style.color = 'var(--danger)';
            el.emergencyBtn.style.borderColor = 'var(--danger)';
            el.timer.style.color = 'var(--danger)';
            el.progressRing.style.stroke = 'var(--danger)';
            const diff = Math.max(0, Math.round((data.emergencyEndTime - Date.now()) / 1000));
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            el.emergencyCountdown.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            state.timeLeft = diff;
            state.duration = 5;
        } else {
            el.emergencyHint.style.display = 'none';
            el.emergencyBtn.style.color = '';
            el.emergencyBtn.style.borderColor = '';
            el.timer.style.color = '';
            el.progressRing.style.stroke = '';
            if (data.endTime) {
                state.timeLeft = Math.max(0, Math.round((data.endTime - Date.now()) / 1000));
                const stored = await chrome.storage.local.get('duration');
                state.duration = stored.duration || 25;
            } else {
                state.timeLeft = data.timeLeft;
                const stored = await chrome.storage.local.get('duration');
                state.duration = stored.duration || 25;
            }
        }
        state.isRunning = data.isRunning;
        updateTimerDisplay();
        updateProgressRing();
        if (state.pomodoroEnabled) {
            state.pomodoroPhase = data.pomodoroPhase || 'work';
            state.pomodoroCount = data.pomodoroCount || 0;
            const icon = state.pomodoroPhase === 'work' ?
                '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" style="margin-right:4px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' :
                '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>';
            el.phaseLabel.innerHTML = `${icon}<span>${state.pomodoroPhase.toUpperCase()}</span>`;
            el.phaseLabel.className = `phase-label ${state.pomodoroPhase}`;
            el.cycleCount.textContent = state.pomodoroCount + 1;
        }
    }, 500);
}
function stopUISync() {
    state.isRunning = false;
    el.startBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="currentColor" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Start Focus</span>`;
    el.startBtn.style.background = 'var(--primary)';
    el.customTimeToggle.style.display = 'flex';
    document.querySelector('.presets').style.display = 'flex';
    el.pomodoroStatus.style.display = 'none';
    el.timer.style.color = '';
    el.progressRing.style.stroke = '';
    el.emergencyHint.style.display = 'none';
    el.emergencyBtn.style.color = '';
    el.emergencyBtn.style.borderColor = '';
    if (uiInterval) clearInterval(uiInterval);
}
function renderSiteList() {
    el.siteList.innerHTML = '';
    const siteMap = new Map();
    state.allSites.forEach(s => siteMap.set(s.domain, s));
    state.blocklist.forEach(d => { if (!siteMap.has(d)) siteMap.set(d, { domain: d, name: d }); });
    state.whitelist.forEach(d => { if (!siteMap.has(d)) siteMap.set(d, { domain: d, name: d }); });
    const sitesToShow = Array.from(siteMap.values());
    const currentList = state.whitelistMode ? state.whitelist : state.blocklist;
    sitesToShow.sort((a, b) => {
        const aActive = currentList.includes(a.domain);
        const bActive = currentList.includes(b.domain);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return a.domain.localeCompare(b.domain);
    });
    if (sitesToShow.length === 0) {
        el.siteList.innerHTML = '<p class="empty-state">No domains added yet</p>';
        return;
    }
    sitesToShow.forEach(site => {
        const isActive = currentList.includes(site.domain);
        const item = document.createElement('div');
        item.className = `site-item ${isActive ? 'blocked' : ''}`;
        item.innerHTML = `
            <img src="${getFavicon(site.domain)}" alt="" class="site-icon">
            <span class="site-name">${site.name}</span>
            <span class="site-domain">${site.domain}</span>
            <div class="toggle-switch ${isActive ? 'active' : ''}" data-domain="${site.domain}">
                <div class="toggle-knob"></div>
            </div>
        `;
        item.querySelector('.toggle-switch').onclick = () => toggleSite(site.domain);
        el.siteList.appendChild(item);
    });
}
function toggleSite(domain) {
    if (state.whitelistMode) {
        if (state.whitelist.includes(domain)) {
            state.whitelist = state.whitelist.filter(d => d !== domain);
        } else {
            state.whitelist.push(domain);
            state.blocklist = state.blocklist.filter(d => d !== domain);
        }
    } else {
        if (state.blocklist.includes(domain)) {
            state.blocklist = state.blocklist.filter(d => d !== domain);
        } else {
            state.blocklist.push(domain);
            state.whitelist = state.whitelist.filter(d => d !== domain);
        }
    }
    chrome.storage.local.set({
        whitelist: state.whitelist,
        blocklist: state.blocklist
    }, () => {
        renderSiteList();
        playSound('toggle');
    });
}
el.addCustomBtn.onclick = addCustomSite;
el.customDomain.onkeypress = (e) => { if (e.key === 'Enter') addCustomSite(); };
function addCustomSite() {
    let domain = el.customDomain.value.trim().toLowerCase();
    if (!domain) return;
    domain = domain.replace('https://', '').replace('http://', '').split('/')[0];
    if (!state.allSites.some(s => s.domain === domain)) {
        state.allSites.push({ domain, name: domain });
    }
    if (state.whitelistMode) {
        if (!state.whitelist.includes(domain)) {
            state.whitelist.push(domain);
            state.blocklist = state.blocklist.filter(d => d !== domain);
        }
    } else {
        if (!state.blocklist.includes(domain)) {
            state.blocklist.push(domain);
            state.whitelist = state.whitelist.filter(d => d !== domain);
        }
    }
    chrome.storage.local.set({
        allSites: state.allSites,
        blocklist: state.blocklist,
        whitelist: state.whitelist
    });
    el.customDomain.value = '';
    renderSiteList();
    playSound('success');
}
el.blockModeBtn.onclick = () => {
    state.whitelistMode = false;
    updateModeUI();
    chrome.storage.local.set({ whitelistMode: false });
    renderSiteList();
    playSound('switch');
};
el.whiteModeBtn.onclick = () => {
    state.whitelistMode = true;
    updateModeUI();
    chrome.storage.local.set({ whitelistMode: true });
    renderSiteList();
    playSound('switch');
};
el.challengeToggle.onchange = () => {
    state.challengeEnabled = el.challengeToggle.checked;
    el.challengeConfig.style.display = state.challengeEnabled ? 'block' : 'none';
    chrome.storage.local.set({ challengeEnabled: state.challengeEnabled });
};
el.setChallengeBtn.onclick = async () => {
    const text = el.challengeInput.value.trim();
    if (text.length === 0) {
        state.challengeText = "(RANDOM_QUOTE)";
        el.challengeInput.value = "";
        el.challengeStatus.textContent = 'Random quote mode active!';
        el.challengeStatus.style.color = 'var(--primary)';
    } else if (text.length < 25) {
        el.challengeStatus.style.color = 'var(--danger)';
        el.challengeStatus.textContent = 'Minimum 25 characters required!';
        return;
    } else {
        state.challengeText = text;
        el.challengeStatus.textContent = 'Challenge text saved!';
    }
    el.challengeStatus.style.color = 'var(--success)';
    chrome.storage.local.set({ challengeText: state.challengeText });
    playSound('success');
};
function updateStats() {
    const dateStr = new Date().getFullYear() + '_' + String(new Date().getMonth() + 1).padStart(2, '0') + '_' + String(new Date().getDate()).padStart(2, '0');
    const statsKey = `stats_${dateStr}`;
    chrome.storage.local.get(['totalFocusTime', 'sessionsCompleted', 'currentStreak', 'siteTimeData', statsKey], (data) => {
        const total = data.totalFocusTime || 0;
        el.statTotalTime.textContent = formatDuration(total);
        el.statSessions.textContent = data.sessionsCompleted || 0;
        el.statStreak.textContent = data.currentStreak || 0;
        const siteData = data[statsKey] || (data.siteTimeData ? data.siteTimeData[new Date().toDateString()] : {}) || {};
        const sites = Object.entries(siteData).sort((a, b) => b[1] - a[1]);
        if (sites.length === 0) {
            el.siteTimeList.innerHTML = '<p class="empty-state">No tracking data for today</p>';
            return;
        }
        const maxTime = sites[0][1];
        el.siteTimeList.innerHTML = sites.slice(0, 10).map(([domain, seconds]) => {
            const pct = Math.round((seconds / maxTime) * 100);
            return `
                <div class="site-time-item">
                    <img src="${getFavicon(domain)}" class="site-icon">
                    <span class="domain">${domain}</span>
                    <span class="time">${formatDuration(seconds)}</span>
                </div>
                <div class="site-time-bar">
                    <div class="site-time-bar-fill" style="width:${pct}%"></div>
                </div>
            `;
        }).join('');
    });
    renderWeeklyChart();
}
async function renderWeeklyChart() {
    if (!el.weeklyChart) return;
    const daysArr = [];
    const keys = [];
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        daysArr.push({
            key: `stats_${getLocalDateString(d)}`,
            label: labels[d.getDay()]
        });
        keys.push(`stats_${getLocalDateString(d)}`);
    }
    chrome.storage.local.get(keys, (data) => {
        const weeklyData = daysArr.map(day => {
            const dayStats = data[day.key] || {};
            const totalSec = Object.values(dayStats).reduce((acc, curr) => acc + curr, 0);
            return { label: day.label, seconds: totalSec };
        });
        const maxSec = Math.max(...weeklyData.map(d => d.seconds), 3600);
        el.weeklyChart.innerHTML = weeklyData.map(day => {
            const height = Math.max(2, Math.round((day.seconds / maxSec) * 100));
            return `
                <div class="chart-bar-wrap">
                    <div class="chart-bar" style="height: ${height}%" title="${formatDuration(day.seconds)}"></div>
                    <div class="chart-label">${day.label}</div>
                </div>
            `;
        }).join('');
    });
}
function loadSettings() {
    el.soundToggle.checked = state.soundEnabled;
    el.pomodoroToggle.checked = state.pomodoroEnabled;
    el.scheduleToggle.checked = state.scheduleEnabled;
    el.scheduleStart.value = state.scheduleStart;
    el.scheduleEnd.value = state.scheduleEnd;
    el.scheduleConfig.style.display = state.scheduleEnabled ? 'block' : 'none';
    el.challengeToggle.checked = !!state.challengeEnabled;
    el.challengeConfig.style.display = state.challengeEnabled ? 'block' : 'none';
    if (state.challengeText === "(RANDOM_QUOTE)") {
        el.challengeInput.value = "";
        el.challengeStatus.textContent = 'Random quote mode active';
    } else if (state.challengeText) {
        el.challengeInput.value = state.challengeText;
        el.challengeStatus.textContent = 'Challenge is active';
    } else {
        el.challengeStatus.textContent = 'No challenge text set';
    }
    el.dayBtns.forEach(btn => {
        btn.classList.toggle('active', state.scheduleDays.includes(parseInt(btn.dataset.day)));
    });
}
el.themeToggle.onchange = () => {
    const isDark = el.themeToggle.checked;
    state.theme = isDark ? 'dark' : 'light';
    document.body.classList.toggle('light-theme', !isDark);
    chrome.storage.local.set({ theme: state.theme });
    playSound('toggle');
};
el.soundToggle.onchange = () => {
    state.soundEnabled = el.soundToggle.checked;
    chrome.storage.local.set({ soundEnabled: state.soundEnabled });
    playSound('toggle');
};
el.pomodoroToggle.onchange = () => {
    state.pomodoroEnabled = el.pomodoroToggle.checked;
    chrome.storage.local.set({ pomodoroEnabled: state.pomodoroEnabled });
    playSound('toggle');
};
el.scheduleToggle.onchange = () => {
    state.scheduleEnabled = el.scheduleToggle.checked;
    el.scheduleConfig.style.display = state.scheduleEnabled ? 'block' : 'none';
    chrome.storage.local.set({ scheduleEnabled: state.scheduleEnabled });
    playSound('toggle');
};
el.scheduleStart.onchange = () => {
    state.scheduleStart = el.scheduleStart.value;
    chrome.storage.local.set({ scheduleStart: state.scheduleStart });
};
el.scheduleEnd.onchange = () => {
    state.scheduleEnd = el.scheduleEnd.value;
    chrome.storage.local.set({ scheduleEnd: state.scheduleEnd });
};
el.dayBtns.forEach(btn => {
    btn.onclick = () => {
        const day = parseInt(btn.dataset.day);
        if (state.scheduleDays.includes(day)) {
            state.scheduleDays = state.scheduleDays.filter(d => d !== day);
        } else {
            state.scheduleDays.push(day);
        }
        btn.classList.toggle('active');
        chrome.storage.local.set({ scheduleDays: state.scheduleDays });
    };
});
let audioCtx = null;
function playSound(type) {
    if (!state.soundEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        const playTone = (freqs, duration, volume = 0.2, oscType = 'sine', stagger = 0.05) => {
            freqs.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                osc.type = oscType;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                osc.connect(g);
                g.connect(masterGain);
                const start = audioCtx.currentTime + (i * stagger);
                g.gain.setValueAtTime(0, start);
                g.gain.linearRampToValueAtTime(volume / freqs.length, start + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, start + duration);
                osc.start(start);
                osc.stop(start + duration + 0.1);
            });
            masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
        };
        switch (type) {
            case 'start': playTone([880, 1108, 1318], 1.2, 0.12); break;
            case 'stop': playTone([440], 0.15, 0.04); break;
            case 'complete': playTone([196, 293, 392, 440], 4.0, 0.25); break;
            case 'click': playTone([1760], 0.08, 0.03); break;
            case 'toggle': playTone([660, 523], 0.3, 0.08, 'sine', 0.1); break;
            case 'switch': playTone([2200, 1800], 0.1, 0.02, 'sine', 0.02); break;
            case 'success': playTone([659, 880, 1046], 0.6, 0.1, 'sine', 0.05); break;
        }
    } catch (e) {
        console.error("Audio error", e);
    }
}
function updateGlobalStatus(enabled) {
    state.enabled = enabled;
    el.toggle.classList.toggle('on', enabled);
    el.statusText.textContent = enabled ? 'ON' : 'OFF';
}
el.toggle.onclick = async () => {
    state.enabled = !state.enabled;
    if (!state.enabled) {
        await callBG('STOP_TIMER');
        stopUISync();
        playSound('stop');
    } else {
        playSound('start');
    }
    chrome.storage.local.set({ enabled: state.enabled }, () => {
        updateGlobalStatus(state.enabled);
    });
};
el.whitelistCurrentBtn.onclick = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.url) return;
    try {
        let url = new URL(tabs[0].url);
        let domain = url.hostname.replace('www.', '');
        if (!state.allSites.some(s => s.domain === domain)) {
            state.allSites.push({ domain, name: domain });
        }
        if (state.whitelistMode) {
            if (!state.whitelist.includes(domain)) {
                state.whitelist.push(domain);
            }
            state.blocklist = state.blocklist.filter(d => d !== domain);
            el.apiResult.textContent = `Whitelisted ${domain}`;
        } else {
            state.blocklist = state.blocklist.filter(d => d !== domain);
            el.apiResult.textContent = `Unblocked ${domain}`;
        }
        chrome.storage.local.set({
            allSites: state.allSites,
            blocklist: state.blocklist,
            whitelist: state.whitelist
        }, () => {
            renderSiteList();
            playSound('success');
        });
    } catch (e) {
        el.apiResult.textContent = 'Invalid URL';
    }
};
el.pingBtn.onclick = async () => {
    const res = await callBG('PING');
    el.apiResult.textContent = res.success ? res.payload : "Lost";
};
el.quoteBtn.onclick = async () => {
    el.apiResult.textContent = "Fetching...";
    const res = await callBG('GET_QUOTE');
    if (res.success) {
        const author = (res.data.author && res.data.author !== "Unknown") ? ` - ${res.data.author}` : "";
        el.apiResult.textContent = `"${res.data.text}"${author}`;
    } else {
        el.apiResult.textContent = "Fail";
    }
};
el.dogBtn.onclick = async () => {
    el.apiResult.textContent = "Fetching...";
    const res = await callBG('GET_DOG');
    if (res.success) {
        el.apiResult.innerHTML = `<img src="${res.url}" style="width:80px; border-radius:8px">`;
    }
};
el.speedBtn.onclick = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
        const speed = conn.downlink;
        el.apiResult.textContent = `Estimated Speed: ${speed} Mb/s`;
    } else {
        el.apiResult.textContent = "API not supported on this browser.";
    }
};
el.funBtn.onclick = () => {
    state.funMode = !state.funMode;
    if (state.funMode) {
        el.funBtn.style.backgroundColor = 'var(--primary)';
        el.funBtn.style.color = 'white';
        el.apiResult.textContent = "Fun mode enabled!";
        playSound('success');
        triggerConfetti(window.innerWidth / 2, window.innerHeight / 2);
    } else {
        el.funBtn.style.backgroundColor = '';
        el.funBtn.style.color = '';
        el.apiResult.textContent = "Fun mode disabled.";
        playSound('toggle');
    }
};
document.addEventListener('mousedown', (e) => {
    if (!state.funMode) return;
    const btn = e.target.closest('button, .preset-btn, .tab-btn, .day-btn, input[type="checkbox"], .mode-btn');
    if (btn) {
        triggerConfetti(e.clientX, e.clientY);
    }
});
el.emergencyBtn.onclick = async () => {
    const data = await chrome.storage.local.get('isEmergency');
    if (!data.isEmergency) {
        await callBG('START_EMERGENCY');
        playSound('click');
    } else {
        await callBG('STOP_EMERGENCY');
        playSound('click');
    }
};
chrome.storage.onChanged.addListener((changes) => {
    for (let key in changes) {
        state[key] = changes[key].newValue;
        if (key === 'enabled') updateGlobalStatus(state.enabled);
        if (key === 'whitelistMode') updateModeUI();
        if (key === 'blocklist' || key === 'whitelist' || key === 'allSites') renderSiteList();
        if (key === 'totalFocusTime' || key === 'sessionsCompleted' || key === 'currentStreak' || key === 'siteTimeData') updateStats();
        if (key === 'isRunning' && !state.isRunning) stopUISync();
        if (key === 'isRunning' && state.isRunning && !uiInterval) startUISync();
    }
});
init();

