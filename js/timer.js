// Study Timer Module for Smart Study Platform
// Updated to use Supabase instead of Firebase

// Timer state
let timerInterval = null;
let currentUser = null;
let currentSession = null;
let timerState = {
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    sessionType: 'study', // 'study' or 'break'
    selectedSubject: null,
    completedSessions: 0
};

// Timer settings (in minutes)
let timerSettings = {
    studyTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
};

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    loadSettings();
    setupEventListeners();
    updateTimerDisplay();
});

// Auth state management using Supabase
async function checkAuthState() {
    try {
        // Wait for Supabase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (window.supabaseAuth) {
            const { data } = await window.supabaseAuth.getSession();
            if (data?.session?.user) {
                currentUser = data.session.user;
                document.getElementById('userEmail').textContent = currentUser.email;
                await loadSubjects();
                await loadTodaySessions();
            } else {
                window.location.href = 'auth.html';
            }
        } else {
            // Demo mode fallback
            const demoUser = localStorage.getItem('demoUser');
            if (demoUser) {
                currentUser = JSON.parse(demoUser);
                document.getElementById('userEmail').textContent = currentUser.email;
                await loadSubjects();
                await loadTodaySessions();
            } else {
                window.location.href = 'auth.html';
            }
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
        window.location.href = 'auth.html';
    }
}

// Load subjects from Supabase
async function loadSubjects() {
    try {
        const { data, error } = await window.supabase
            .from('subjects')
            .select('id, name')
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('Error loading subjects:', error);
            showNotification('خطأ في تحميل المواد', 'error');
            return;
        }
        
        const subjectSelect = document.getElementById('subjectSelect');
        subjectSelect.innerHTML = '<option value="">اختر المادة للدراسة...</option>';
        
        data.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('خطأ في تحميل المواد', 'error');
    }
}

// Load today's sessions
async function loadTodaySessions() {
    try {
        const { data, error } = await window.supabase
            .from('study_sessions')
            .select('id, subject_id, subject_name, type, duration, completed, date, end_time')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });
        
        if (error) {
            console.error('Error loading sessions:', error);
            showNotification('خطأ في تحميل جلسات اليوم', 'error');
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaySessions = data.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= today && sessionDate < tomorrow;
        });
        
        const subjectStats = {};
        let totalStudyTime = 0;
        let completedSessionsCount = 0;
        
        todaySessions.forEach(session => {
            if (session.completed) {
                completedSessionsCount++;
                totalStudyTime += session.duration || 0;
                
                if (session.subject_name) {
                    if (!subjectStats[session.subject_name]) {
                        subjectStats[session.subject_name] = 0;
                    }
                    subjectStats[session.subject_name] += session.duration || 0;
                }
            }
        });
        
        updateSessionHistory(todaySessions);
        updateStatistics(completedSessionsCount, totalStudyTime, subjectStats);
    } catch (error) {
        console.error('Error loading sessions:', error);
        showNotification('خطأ في تحميل جلسات اليوم', 'error');
    }
}

// Initialize timer
function initializeTimer() {
    timerState.currentTime = timerSettings.studyTime * 60;
    updateDisplay();
    updateCircleProgress();
}

// Start timer
window.startTimer = function() {
    if (!timerState.selectedSubject && (!subjectSelect || !subjectSelect.value)) {
        showNotification('يرجى اختيار مادة للدراسة أولاً', 'warning');
        return;
    }
    
    if (!timerState.selectedSubject && subjectSelect) {
        timerState.selectedSubject = subjectSelect.options[subjectSelect.selectedIndex].textContent;
    }
    
    timerState.isRunning = true;
    currentSession = new Date();
    
    if (startBtn) startBtn.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    
    if (progressText) progressText.textContent = `جلسة ${timerState.sessionType === 'break' ? 'راحة' : 'دراسة'} - ${timerState.selectedSubject}`;
    
    timerInterval = setInterval(() => {
        timerState.currentTime--;
        updateDisplay();
        updateCircleProgress();
        
        if (timerState.currentTime <= 0) {
            completeSession();
        }
    }, 1000);
    
    // Add pulse effect during active session
    if (timerCircle) timerCircle.classList.add('pulse');
};

// Pause timer
window.pauseTimer = function() {
    timerState.isRunning = false;
    clearInterval(timerInterval);
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    
    if (timerCircle) timerCircle.classList.remove('pulse');
    
    if (progressText) progressText.textContent = 'الموقت متوقف مؤقتاً';
};

// Reset timer
window.resetTimer = function() {
    timerState.isRunning = false;
    clearInterval(timerInterval);
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    
    if (timerCircle) timerCircle.classList.remove('pulse');
    
    timerState.currentTime = timerState.sessionType === 'break' ? (timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? timerSettings.longBreak * 60 : timerSettings.shortBreak * 60) : timerSettings.studyTime * 60;
    updateDisplay();
    updateCircleProgress();
    
    if (progressText) progressText.textContent = 'اختر مادة وابدأ جلسة الدراسة';
};

// Complete session
async function completeSession() {
    timerState.isRunning = false;
    clearInterval(timerInterval);
    if (timerCircle) timerCircle.classList.remove('pulse');
    
    // Play sound notification
    if (soundEnabled) {
        playNotificationSound();
    }
    
    // Save session to Supabase
    await saveSession();
    
    if (timerState.sessionType !== 'break') {
        // Study session completed
        showNotification(`تم إنهاء جلسة الدراسة! وقت للراحة`, 'success');
        
        // Switch to break
        timerState.sessionType = 'break';
        timerState.currentTime = timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? timerSettings.longBreak * 60 : timerSettings.shortBreak * 60;
        
        if (timerTitle) timerTitle.textContent = timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? 'راحة طويلة' : 'راحة قصيرة';
        if (sessionType) sessionType.textContent = 'وقت الراحة';
        if (progressText) progressText.textContent = `استرح قليلاً - انتهت الجلسة ${timerState.completedSessions}`;
        
        // Update circle color for break
        updateCircleProgress('#10b981'); // Green for break
        
    } else {
        // Break completed
        showNotification(`انتهت فترة الراحة! وقت للعودة للدراسة`, 'info');
        
        // Switch to study
        timerState.sessionType = 'study';
        timerState.completedSessions++;
        timerState.currentTime = timerSettings.studyTime * 60;
        
        if (timerTitle) timerTitle.textContent = 'جلسة دراسة';
        if (sessionType) sessionType.textContent = 'وقت الدراسة';
        if (sessionCounter) sessionCounter.textContent = `الجلسة ${timerState.completedSessions}`;
        if (progressText) progressText.textContent = `جلسة دراسة جديدة - ${timerState.selectedSubject}`;
        
        // Reset circle color for study
        updateCircleProgress('#3b82f6'); // Blue for study
    }
    
    updateDisplay();
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    
    // Reload today's sessions to update statistics
    await loadTodaySessions();
}

// Save session to Supabase
async function saveSession() {
    try {
        const sessionData = {
            user_id: currentUser.id,
            subject_id: subjectSelect ? subjectSelect.value || null : null,
            subject_name: timerState.selectedSubject,
            type: timerState.sessionType,
            duration: timerState.sessionType === 'break' ? 
                (timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? timerSettings.longBreak * 60 : timerSettings.shortBreak * 60) - timerState.currentTime :
                timerSettings.studyTime * 60 - timerState.currentTime,
            completed: timerState.currentTime === 0,
            date: currentSession || new Date(),
            end_time: new Date()
        };
        
        const { data, error } = await window.supabase
            .from('study_sessions')
            .insert([sessionData]);
        
        if (error) {
            console.error('Error saving session:', error);
        }
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(timerState.currentTime / 60);
    const seconds = timerState.currentTime % 60;
    if (timeDisplay) {
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Update circle progress
function updateCircleProgress(color = null) {
    if (!timerCircle) return;
    
    const totalTime = timerState.sessionType === 'break' ? 
        (timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? timerSettings.longBreak * 60 : timerSettings.shortBreak * 60) : 
        timerSettings.studyTime * 60;
    
    const progress = ((totalTime - timerState.currentTime) / totalTime) * 360;
    const circleColor = color || (timerState.sessionType === 'break' ? '#10b981' : '#3b82f6');
    
    timerCircle.style.background = `conic-gradient(${circleColor} ${progress}deg, #e5e7eb ${progress}deg)`;
}

// Update session history
function updateSessionHistory(sessions) {
    if (!sessionHistory) return;
    
    if (sessions.length === 0) {
        sessionHistory.innerHTML = '<p class="text-gray-500 text-center">لم تبدأ أي جلسة بعد</p>';
        return;
    }
    
    sessionHistory.innerHTML = '';
    
    sessions.slice(0, 10).forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg';
        
        const typeIcon = session.type === 'study' ? 'fa-book' : 'fa-coffee';
        const typeColor = session.type === 'study' ? 'text-blue-500' : 'text-green-500';
        const statusIcon = session.completed ? 'fa-check-circle text-green-500' : 'fa-clock text-yellow-500';
        
        sessionEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${typeIcon} ${typeColor} ml-3"></i>
                <div>
                    <div class="font-medium">${session.subject_name || 'غير محدد'}</div>
                    <div class="text-sm text-gray-500">${formatTime(session.duration)}</div>
                </div>
            </div>
            <div class="flex items-center">
                <span class="text-xs text-gray-500 ml-2">${formatDate(session.date)}</span>
                <i class="fas ${statusIcon}"></i>
            </div>
        `;
        
        sessionHistory.appendChild(sessionEl);
    });
}

// Update statistics
function updateStatistics(completedSessions, totalStudyTime, subjectStats) {
    if (completedSessions) completedSessions.textContent = completedSessions;
    if (totalStudyTimeEl) totalStudyTimeEl.textContent = `${Math.round(totalStudyTime / 60)} دقيقة`;
    
    // Find top subject
    let topSubjectName = '-';
    let maxTime = 0;
    
    for (const [subject, time] of Object.entries(subjectStats)) {
        if (time > maxTime) {
            maxTime = time;
            topSubjectName = subject;
        }
    }
    
    if (topSubject) topSubject.textContent = topSubjectName;
    
    // Calculate focus rate (completed sessions / total sessions)
    const totalSessions = todaySessions.length;
    const focusRateValue = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    if (focusRate) focusRate.textContent = `${focusRateValue}%`;
}

// Set preset timer values
window.setPreset = function(studyMinutes, breakMinutes) {
    if (studyTimeInput) studyTimeInput.value = studyMinutes;
    if (breakTimeInput) breakTimeInput.value = breakMinutes;
    updateSettings();
    
    if (!timerState.isRunning) {
        resetTimer();
    }
    
    showNotification(`تم تعيين الموقت: ${studyMinutes} دقيقة دراسة / ${breakMinutes} دقيقة راحة`, 'success');
};

// Update settings
function updateSettings() {
    if (studyTimeInput) timerSettings.studyTime = parseInt(studyTimeInput.value);
    if (breakTimeInput) timerSettings.shortBreak = parseInt(breakTimeInput.value);
    if (longBreakTimeInput) timerSettings.longBreak = parseInt(longBreakTimeInput.value);
    if (soundEnabledInput) soundEnabled = soundEnabledInput.checked;
    
    // Save settings to localStorage
    localStorage.setItem('timerSettings', JSON.stringify({
        studyTime: studyTimeInput ? studyTimeInput.value : 25,
        shortBreak: breakTimeInput ? breakTimeInput.value : 5,
        longBreak: longBreakTimeInput ? longBreakTimeInput.value : 15,
        soundEnabled: soundEnabled
    }));
    
    // Update current timer if not running
    if (!timerState.isRunning) {
        timerState.currentTime = timerState.sessionType === 'break' ? (timerState.completedSessions % timerSettings.sessionsUntilLongBreak === 0 ? timerSettings.longBreak * 60 : timerSettings.shortBreak * 60) : timerSettings.studyTime * 60;
        updateDisplay();
        updateCircleProgress();
    }
}

// Load settings
function loadSettings() {
    const savedSettings = localStorage.getItem('timerSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (studyTimeInput) studyTimeInput.value = settings.studyTime || 25;
        if (breakTimeInput) breakTimeInput.value = settings.shortBreak || 5;
        if (longBreakTimeInput) longBreakTimeInput.value = settings.longBreak || 15;
        if (soundEnabledInput) soundEnabledInput.checked = settings.soundEnabled !== false;
        
        updateSettings();
    }
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create audio context for better browser compatibility
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a simple beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
        // Fallback to HTML5 audio if available
        if (timerSound) {
            timerSound.play().catch(() => {
                // Silent fail if audio doesn't work
            });
        }
    } catch (error) {
        // Silent fail for audio issues
        console.log('Audio notification not available');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = document.getElementById('notificationIcon');
    
    if (!notification || !notificationMessage || !notificationIcon) return;
    
    // Set icon based on type
    const icons = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        warning: 'fa-exclamation-triangle text-yellow-500',
        info: 'fa-info-circle text-blue-500'
    };
    
    notificationIcon.className = `fas ${icons[type] || icons.info} ml-3`;
    notificationMessage.textContent = message;
    
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

// Logout function
window.logout = async function() {
    try {
        await window.supabaseAuth.signOut();
        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('خطأ في تسجيل الخروج', 'error');
    }
};

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} دقيقة`;
}

function formatDate(date) {
    return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Cleanup when page unloads
window.addEventListener('beforeunload', function() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Reset page title
    document.title = 'موقت المذاكرة - منصة الدراسة الذكية';
});
