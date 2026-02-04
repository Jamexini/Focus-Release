(function () {
    const currentHost = window.location.hostname.toLowerCase().replace('www.', '');
    let overlayElement = null;
    let timerInterval = null;
    let trackingInterval = null;
    let trackingSeconds = 0;
    const QUOTES = [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
        { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
        { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
        { text: "Starve your distractions, feed your focus.", author: "Unknown" },
        { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
        { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Einstein" },
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
        { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
        { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
        { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
        { text: "Realize deeply that the present moment is all you have.", author: "Eckhart Tolle" },
        { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
        { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
        { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
        { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
        { text: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
        { text: "Do not wait; the time will never be 'just right.'", author: "Napoleon Hill" },
        { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" },
        { text: "The shorter way to do many things is to only do one thing at a time.", author: "Mozart" },
        { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
        { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
        { text: "Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.", author: "Mother Teresa" },
        { text: "You don't need a new plan for next year. You need a commitment.", author: "Seth Godin" },
        { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
        { text: "The price of excellence is discipline. The cost of mediocrity is disappointment.", author: "William Arthur Ward" },
        { text: "It is not enough to be busy. So are the ants. The question is: What are we busy about?", author: "Henry David Thoreau" },
        { text: "Great acts are made up of small deeds.", author: "Lao Tzu" },
        { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
        { text: "The tragedy in life doesn't lie in not reaching your goal. The tragedy lies in having no goal to reach.", author: "Benjamin E. Mays" },
        { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
        { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
        { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
        { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "There's no dark side of the moon really. Matter of fact it's all dark.", author: "Roger Waters" },
        { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix" },
        { text: "All you need is love.", author: "The Beatles" },
        { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
        { text: "You learn more from failure than from success.", author: "Unknown" },
        { text: "If you are working on something that you really care about, you don't have to be pushed.", author: "Steve Jobs" },
        { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino" },
        { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
        { text: "Whether you think you can or think you can't, you're right.", author: "Henry Ford" },
        { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" }
    ];
    function startTimeTracking() {
    }
    function stopTimeTracking() {
    }
    function isDomainMatch(siteUrl, patterns) {
        if (!siteUrl) return false;
        const hostname = siteUrl.toLowerCase().replace('www.', '');
        return patterns.some(pattern => {
            const cleanPattern = pattern.trim().toLowerCase().replace('www.', '');
            return hostname === cleanPattern || hostname.endsWith('.' + cleanPattern);
        });
    }
    function checkBlocking(data) {
        if (!data.isRunning) return false;
        if (data.enabled === false) return false;
        if (data.isEmergency === true) return false;
        const blocklist = data.blocklist || [];
        const whitelist = data.whitelist || [];
        const isInBlocklist = isDomainMatch(currentHost, blocklist);
        const isInWhitelist = isDomainMatch(currentHost, whitelist);
        return isInBlocklist && !isInWhitelist;
    }
    function formatTime(seconds) {
        if (!seconds || seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    function getRandomQuote() {
        return QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }
    function injectBlockOverlay(domain, endTime) {
        window.stop();
        stopTimeTracking();
        const quote = getRandomQuote();
        const initialSeconds = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        chrome.storage.local.get(['theme'], (settings) => {
            const isLight = settings.theme === 'light';
            const primaryColor = isLight ? '#3182ce' : '#7c4dff';
            const primaryAlpha = isLight ? 'rgba(49, 130, 206, 0.3)' : 'rgba(124, 77, 255, 0.3)';
            const primaryBorder = isLight ? 'rgba(49, 130, 206, 0.5)' : 'rgba(124, 77, 255, 0.5)';
            const bgColor = isLight ? '#f0f4f8' : '#121212';
            const textColor = isLight ? '#1a365d' : 'white';
            const secondaryBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';
            const quoteBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)';
            overlayElement = document.createElement('div');
            overlayElement.id = 'focus-minimal-blocker';
            overlayElement.innerHTML = `
                <style>
                    #focus-minimal-blocker {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        background: ${bgColor} !important;
                        z-index: 2147483647 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                        color: ${textColor} !important;
                    }
                    #focus-minimal-blocker .icon { font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite; }
                    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
                    #focus-minimal-blocker h1 { font-size: 42px !important; margin: 0 0 10px 0 !important; font-weight: 700 !important; }
                    #focus-minimal-blocker .domain { font-size: 20px !important; opacity: 0.7 !important; margin-bottom: 30px !important; padding: 10px 20px !important; background: ${secondaryBg} !important; border-radius: 8px !important; }
                    #focus-minimal-blocker .timer-display { font-size: 64px !important; font-weight: 700 !important; margin: 20px 0 !important; font-family: monospace !important; background: ${primaryAlpha} !important; padding: 20px 40px !important; border-radius: 16px !important; border: 2px solid ${primaryBorder} !important; }
                    #focus-minimal-blocker .quote { max-width: 500px !important; text-align: center !important; margin-top: 30px !important; padding: 20px !important; background: ${quoteBg} !important; border-radius: 12px !important; border-left: 4px solid ${primaryColor} !important; }
                    #focus-minimal-blocker .quote-text { font-size: 18px !important; font-style: italic !important; line-height: 1.6 !important; opacity: 0.9 !important; }
                    #focus-minimal-blocker .quote-author { margin-top: 10px !important; font-size: 14px !important; opacity: 0.6 !important; }
                    #focus-minimal-blocker .hint { margin-top: 25px !important; font-size: 14px !important; opacity: 0.5 !important; }
                </style>
                <div class="icon">
                    <svg viewBox="0 0 24 24" width="80" height="80" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: ${primaryColor};">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h1>Focus Mode Active</h1>
                <div class="domain">${domain}</div>
                <div class="timer-display" id="blockTimer">${formatTime(initialSeconds)}</div>
                <div class="quote">
                    <div class="quote-text">"${quote.text}"</div>
                    <div class="quote-author">- ${quote.author}</div>
                </div>
                <div class="hint">Stay focused! This site will unblock when the timer ends.</div>
            `;
            document.documentElement.innerHTML = '';
            document.documentElement.appendChild(overlayElement);
            document.body.style.overflow = 'hidden';
            startTimerSync();
        });
    }
    function startTimerSync() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            chrome.storage.local.get(['endTime', 'isRunning', 'enabled'], (data) => {
                if (!data.isRunning || data.enabled === false) {
                    removeOverlayAndReload();
                    return;
                }
                const timerEl = document.getElementById('blockTimer');
                if (timerEl && data.endTime) {
                    const seconds = Math.max(0, Math.round((data.endTime - Date.now()) / 1000));
                    timerEl.textContent = formatTime(seconds);
                    if (seconds <= 0) {
                        removeOverlayAndReload();
                    }
                }
            });
        }, 500);
    }
    function removeOverlayAndReload() {
        if (overlayElement) {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            window.location.reload();
        }
    }
    chrome.storage.local.get(['isRunning', 'blocklist', 'whitelist', 'enabled', 'endTime', 'whitelistMode', 'isEmergency'], (data) => {
        if (checkBlocking(data)) {
            injectBlockOverlay(currentHost, data.endTime);
        } else {
            startTimeTracking();
        }
    });
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.isRunning || changes.enabled || changes.blocklist || changes.whitelist || changes.whitelistMode || changes.isEmergency) {
            chrome.storage.local.get(['isRunning', 'enabled', 'blocklist', 'whitelist', 'whitelistMode', 'endTime', 'isEmergency'], (data) => {
                const shouldBeBlocked = checkBlocking(data);
                if (!shouldBeBlocked && overlayElement) {
                    removeOverlayAndReload();
                } else if (shouldBeBlocked && !overlayElement) {
                    injectBlockOverlay(currentHost, data.endTime);
                }
            });
        }
    });
    window.addEventListener('beforeunload', stopTimeTracking);
})();

