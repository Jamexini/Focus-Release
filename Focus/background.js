const MOTIVATIONAL_QUOTES = [{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }, { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }, { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }, { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" }, { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" }, { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" }, { text: "Where focus goes, energy flows.", author: "Tony Robbins" }, { text: "Starve your distractions, feed your focus.", author: "Unknown" }, { text: "You can't depend on your eyes when your imagination is out of focus.", author: "Mark Twain" }, { text: "Gain muscle? Nah I just have a ROPE... I just have one option left.", author: "Empanadadepollo" }, { text: "Lack of direction, not lack of time, is the problem.", author: "Zig Ziglar" }, { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" }, { text: "The path to success is to take massive, determined action.", author: "Tony Robbins" }, { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" }, { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" }, { text: "Quality is not an act, it is a habit.", author: "Aristotle" }, { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }, { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" }, { text: "Focus is the secret of success.", author: "Elbert Hubbard" }, { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" }, { text: "Productivity is never an accident.", author: "Mark Amman" }];
const POMODORO_WORK = 25;
const POMODORO_BREAK = 5;
const POMODORO_LONG_BREAK = 15;
chrome.runtime.onInstalled.addListener(async (details) => {
    const defaults = {
        enabled: true,
        duration: 25,
        isRunning: false,
        timeLeft: 25 * 60,
        endTime: 0,
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
        ],
        whitelistMode: false,
        passwordHash: null,
        pomodoroEnabled: false,
        pomodoroPhase: 'work',
        pomodoroCount: 0,
        scheduleEnabled: false,
        scheduleStart: '09:00',
        scheduleEnd: '17:00',
        scheduleDays: [1, 2, 3, 4, 5],
        theme: 'dark',
        soundEnabled: true,
        totalFocusTime: 0,
        sessionsCompleted: 0,
        currentStreak: 0,
        lastSessionDate: null,
        siteTimeData: {},
        lastScheduledStart: null,
        emergencyTime: 0,
        emergencyPending: false
    };
    if (details.reason === 'install') {
        chrome.storage.local.set(defaults);
    } else {
        const data = await chrome.storage.local.get(['blocklist', 'whitelist']);
        if (!data.blocklist || data.blocklist.length === 0) {
            chrome.storage.local.set({
                blocklist: defaults.blocklist,
                allSites: defaults.allSites
            });
        }
        if (!data.whitelist || data.whitelist.length === 0) {
            chrome.storage.local.set({ whitelist: defaults.whitelist });
        }
    }
    chrome.alarms.create('scheduleCheck', { periodInMinutes: 1 });
    chrome.alarms.create('statsCleanup', { periodInMinutes: 60 });
});
let activeTabDomain = null;
let activeTabStartTime = Date.now();
function getDomainFromUrl(url) {
    try {
        if (!url || url.startsWith('chrome://') || url.startsWith('about:')) return null;
        const urlObj = new URL(url);
        return urlObj.hostname.toLowerCase().replace('www.', '');
    } catch (e) {
        return null;
    }
}
let trackingRemainders = {};
async function flushActiveTracking() {
    if (activeTabDomain) {
        const now = Date.now();
        const elapsedMs = now - activeTabStartTime;
        activeTabStartTime = now;
        if (elapsedMs > 0) {
            trackingRemainders[activeTabDomain] = (trackingRemainders[activeTabDomain] || 0) + elapsedMs;
            const secondsToTrack = Math.floor(trackingRemainders[activeTabDomain] / 1000);
            if (secondsToTrack > 0) {
                await trackSiteTime(activeTabDomain, secondsToTrack);
                trackingRemainders[activeTabDomain] %= 1000;
            }
        }
    }
}
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await flushActiveTracking();
    const tab = await chrome.tabs.get(activeInfo.tabId);
    activeTabDomain = getDomainFromUrl(tab.url);
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        await flushActiveTracking();
        activeTabDomain = getDomainFromUrl(changeInfo.url);
    }
});
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    await flushActiveTracking();
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        activeTabDomain = null;
    } else {
        const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
        if (tab) activeTabDomain = getDomainFromUrl(tab.url);
    }
});
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "focustimer" || alarm.name === "focustimer_fallback") {
        checkTimerStatus();
    }
    if (alarm.name === "statsCleanup") {
        cleanupOldStats();
    }
    if (alarm.name === "emergencyBreakEnd") {
        stopEmergencyBreak();
    }
});
function isDomainMatch(siteUrl, patterns) {
    if (!siteUrl) return false;
    const hostname = siteUrl.toLowerCase().replace('www.', '');
    return patterns.some(pattern => {
        let cleanPattern = pattern.trim().toLowerCase().replace('www.', '');
        if (cleanPattern.startsWith('*.')) {
            cleanPattern = cleanPattern.slice(2);
        }
        return hostname === cleanPattern || hostname.endsWith('.' + cleanPattern);
    });
}
async function checkTimerStatus() {
    const data = await chrome.storage.local.get(["endTime", "isRunning", "isEmergency", "pomodoroEnabled", "pomodoroPhase", "pomodoroCount", "duration"]);
    if (!data.isRunning || data.isEmergency) return;
    const now = Date.now();
    const timeLeft = Math.max(0, Math.round((data.endTime - now) / 1000));
    if (timeLeft <= 0) {
        if (data.pomodoroEnabled) {
            await handlePomodoroComplete(data);
        } else {
            await completeTimer();
        }
    } else {
        await chrome.storage.local.set({ timeLeft });
    }
}
async function handlePomodoroComplete(data) {
    const phase = data.pomodoroPhase || 'work';
    let nextPhase, nextDuration, nextCount;
    if (phase === 'work') {
        const stats = await chrome.storage.local.get(['totalFocusTime']);
        await chrome.storage.local.set({
            totalFocusTime: (stats.totalFocusTime || 0) + (POMODORO_WORK * 60)
        });
        nextCount = (data.pomodoroCount || 0) + 1;
        if (nextCount >= 4) {
            nextPhase = 'break';
            nextDuration = POMODORO_LONG_BREAK;
            nextCount = 0;
        } else {
            nextPhase = 'break';
            nextDuration = POMODORO_BREAK;
        }
        chrome.notifications.create('pomodoro_work_complete', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('images/icon.png'),
            title: 'Work Phase Complete!',
            message: `Time for a ${nextDuration} minute break.`,
            priority: 2,
            buttons: [
                { title: 'Start Break' },
                { title: 'Skip to Work' }
            ]
        });
    } else {
        nextPhase = 'work';
        nextDuration = POMODORO_WORK;
        nextCount = data.pomodoroCount || 0;
        chrome.notifications.create('pomodoro_break_complete', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('images/icon.png'),
            title: 'Break Over!',
            message: 'Back to focused work.',
            priority: 2,
            buttons: [
                { title: 'Start Work' },
                { title: 'Give me 2 more mins' }
            ]
        });
    }
    const newEndTime = Date.now() + nextDuration * 60 * 1000;
    await chrome.storage.local.set({
        pomodoroPhase: nextPhase,
        pomodoroCount: nextCount,
        timeLeft: nextDuration * 60,
        endTime: newEndTime,
        duration: nextDuration
    });
}
async function startTimer(customSeconds = null) {
    const data = await chrome.storage.local.get(["duration", "blocklist", "pomodoroEnabled", "sessionsCompleted", "lastSessionDate", "currentStreak"]);
    let durationSec = (data.duration || 25) * 60;
    if (data.pomodoroEnabled) {
        durationSec = POMODORO_WORK * 60;
    }
    if (customSeconds !== null) {
        durationSec = customSeconds;
    }
    const endTime = Date.now() + durationSec * 1000;
    const today = new Date().toDateString();
    let streak = data.currentStreak || 0;
    if (!data.lastSessionDate) {
        streak = 1;
    } else if (data.lastSessionDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        if (data.lastSessionDate === yesterdayString) {
            streak++;
        } else {
            streak = 1;
        }
    }
    await chrome.storage.local.set({
        timeLeft: durationSec,
        endTime: endTime,
        isRunning: true,
        duration: Math.ceil(durationSec / 60),
        pomodoroPhase: 'work',
        isEmergency: false,
        emergencyEndTime: 0,
        sessionsCompleted: (data.sessionsCompleted || 0) + 1,
        lastSessionDate: today,
        currentStreak: streak
    });
    chrome.alarms.create("focustimer", { when: endTime });
    chrome.alarms.create("focustimer_fallback", { periodInMinutes: 1 });
    await reloadBlockedTabs(data.blocklist || []);
    chrome.action.setBadgeText({ text: "ON" });
    const themeData = await chrome.storage.local.get('theme');
    const badgeColor = themeData.theme === 'light' ? '#3182ce' : '#7c4dff';
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}
async function stopTimer() {
    chrome.alarms.clear("focustimer");
    chrome.alarms.clear("focustimer_fallback");
    chrome.alarms.clear("emergencyBreakEnd");
    const data = await chrome.storage.local.get(["duration", "endTime", "totalFocusTime"]);
    const now = Date.now();
    let elapsed = 0;
    if (data.endTime > now) {
        const durationSec = (data.duration || 25) * 60;
        const timeLeftSec = Math.max(0, Math.round((data.endTime - now) / 1000));
        elapsed = Math.max(0, durationSec - timeLeftSec);
    }
    if (elapsed > (data.duration || 25) * 60) elapsed = (data.duration || 25) * 60;
    await chrome.storage.local.set({
        isRunning: false,
        endTime: 0,
        isEmergency: false,
        emergencyEndTime: 0,
        emergencySavedTimeLeft: 0,
        totalFocusTime: (data.totalFocusTime || 0) + elapsed
    });
    chrome.action.setBadgeText({ text: "" });
}
async function completeTimer() {
    chrome.alarms.clear("focustimer");
    chrome.alarms.clear("focustimer_fallback");
    const data = await chrome.storage.local.get(["duration", "totalFocusTime"]);
    const sessionTime = (data.duration || 25) * 60;
    await chrome.storage.local.set({
        isRunning: false,
        isEmergency: false,
        totalFocusTime: (data.totalFocusTime || 0) + sessionTime
    });
    chrome.action.setBadgeText({ text: "" });
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon.png'),
        title: 'Focus Session Complete!',
        message: `Great job! You focused for ${data.duration || 25} minutes.`,
        priority: 2
    });
}
async function checkSchedule() {
    const data = await chrome.storage.local.get(['scheduleEnabled', 'scheduleStart', 'scheduleEnd', 'scheduleDays', 'isRunning', 'enabled', 'lastScheduledStart']);
    if (!data.scheduleEnabled || data.isRunning || data.enabled === false) return;
    const now = new Date();
    const today = now.toDateString();
    if (data.lastScheduledStart === today) return;
    const day = now.getDay();
    const time = now.toTimeString().slice(0, 5);
    if (!data.scheduleDays.includes(day)) return;
    if (time >= data.scheduleStart && time <= data.scheduleEnd) {
        await chrome.storage.local.set({ lastScheduledStart: today });
        await startTimer();
    }
}
async function reloadBlockedTabs(blocklist) {
    if (!blocklist || blocklist.length === 0) return;
    const data = await chrome.storage.local.get(['whitelist']);
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        const hostname = getDomainFromUrl(tab.url);
        if (!hostname) continue;
        const isBlocked = isDomainMatch(hostname, blocklist);
        const isWhitelisted = isDomainMatch(hostname, data.whitelist || []);
        if (isBlocked && !isWhitelisted) {
            chrome.tabs.reload(tab.id);
        }
    }
}
async function trackSiteTime(domain, seconds) {
    if (!domain || seconds <= 0) return;
    const dateStr = getLocalDateString();
    const key = `stats_${dateStr}`;
    const data = await chrome.storage.local.get(key);
    const dayStats = data[key] || {};
    dayStats[domain] = (dayStats[domain] || 0) + seconds;
    await chrome.storage.local.set({ [key]: dayStats });
    const globalData = await chrome.storage.local.get('siteTimeData');
    const siteTimeData = globalData.siteTimeData || {};
    const dateKey = new Date().toDateString();
    if (!siteTimeData[dateKey]) siteTimeData[dateKey] = {};
    siteTimeData[dateKey][domain] = (siteTimeData[dateKey][domain] || 0) + seconds;
    await chrome.storage.local.set({ siteTimeData });
}
function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}_${month}_${day}`;
}
async function cleanupOldStats() {
    const data = await chrome.storage.local.get(null);
    const keys = Object.keys(data).filter(k => k.startsWith('stats_'));
    if (keys.length > 30) {
        keys.sort();
        const toDelete = keys.slice(0, keys.length - 30);
        await chrome.storage.local.remove(toDelete);
    }
    if (data.siteTimeData) {
        const legacyKeys = Object.keys(data.siteTimeData);
        if (legacyKeys.length > 30) {
            legacyKeys.sort((a, b) => new Date(b) - new Date(a)).slice(30).forEach(k => delete data.siteTimeData[k]);
            await chrome.storage.local.set({ siteTimeData: data.siteTimeData });
        }
    }
}
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    const data = await chrome.storage.local.get(["pomodoroPhase", "pomodoroCount"]);
    if (notificationId === 'pomodoro_work_complete') {
        if (buttonIndex === 0) {
        } else if (buttonIndex === 1) {
            await chrome.storage.local.set({
                pomodoroPhase: 'work',
                timeLeft: POMODORO_WORK * 60,
                endTime: Date.now() + POMODORO_WORK * 60 * 1000
            });
            chrome.alarms.create("focustimer", { when: Date.now() + POMODORO_WORK * 60 * 1000 });
        }
    } else if (notificationId === 'pomodoro_break_complete') {
        if (buttonIndex === 0) {
        } else if (buttonIndex === 1) {
            const extraTime = 2 * 60 * 1000;
            const newEndTime = Date.now() + extraTime;
            await chrome.storage.local.set({
                pomodoroPhase: 'break',
                timeLeft: 2 * 60,
                endTime: newEndTime
            });
            chrome.alarms.create("focustimer", { when: newEndTime });
        }
    }
});
async function startEmergencyBreak() {
    const data = await chrome.storage.local.get(['isRunning', 'endTime']);
    if (!data.isRunning) return;
    chrome.alarms.clear("focustimer");
    const pauseDuration = 5;
    const breakEndTime = Date.now() + pauseDuration * 60 * 1000;
    const now = Date.now();
    const timeLeft = Math.max(0, Math.round((data.endTime - now) / 1000));
    await chrome.storage.local.set({
        isEmergency: true,
        emergencyEndTime: breakEndTime,
        emergencySavedTimeLeft: timeLeft,
        emergencyPending: false,
        emergencyDelayEnd: 0
    });
    chrome.alarms.create("emergencyBreakEnd", { delayInMinutes: pauseDuration });
}
async function stopEmergencyBreak() {
    const data = await chrome.storage.local.get(['emergencySavedTimeLeft', 'duration']);
    if (!data.emergencySavedTimeLeft && data.emergencySavedTimeLeft !== 0) return;
    const penaltySeconds = 5 * 60;
    const remainingSeconds = data.emergencySavedTimeLeft + penaltySeconds;
    const newEndTime = Date.now() + remainingSeconds * 1000;
    await chrome.storage.local.set({
        isEmergency: false,
        emergencyEndTime: 0,
        emergencySavedTimeLeft: 0,
        endTime: newEndTime,
        timeLeft: remainingSeconds,
        duration: (data.duration || 25) + 5,
        isRunning: true
    });
    chrome.alarms.clear("emergencyBreakEnd");
    chrome.alarms.create("focustimer", { when: newEndTime });
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.cmd) {
        case "PING":
            sendResponse({ success: true, payload: "PONG-v2.1" });
            break;
        case "START_TIMER":
            startTimer(request.customSeconds).then(() => sendResponse({ success: true }));
            return true;
        case "STOP_TIMER":
            stopTimer().then(() => sendResponse({ success: true }));
            return true;
        case "GET_QUOTE":
            const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
            sendResponse({ success: true, data: quote });
            break;
        case "TRACK_TIME":
            trackSiteTime(request.domain, request.seconds).then(() => {
                sendResponse({ success: true });
            });
            return true;
        case "GET_DOG":
            fetch("https://dog.ceo/api/breeds/image/random")
                .then(r => r.json())
                .then(data => sendResponse({ success: true, url: data.message }))
                .catch(err => sendResponse({ success: false, error: err.toString() }));
            return true;
        case "START_EMERGENCY":
            startEmergencyBreak().then(() => sendResponse({ success: true }));
            return true;
        case "STOP_EMERGENCY":
            stopEmergencyBreak().then(() => sendResponse({ success: true }));
            return true;
        case "IS_DOMAIN_BLOCKED":
            const isBlocked = isDomainMatch(request.domain, request.blocklist || []);
            const isWhitelisted = isDomainMatch(request.domain, request.whitelist || []);
            sendResponse({ blocked: isBlocked && !isWhitelisted });
            break;
        default:
            sendResponse({ success: false, error: "Unknown command" });
    }
    return true;
});

