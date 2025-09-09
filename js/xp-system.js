// XP Gamification System for Smart Study Platform
// Updated to use Supabase instead of Firebase

class XPSystem {
    constructor() {
        this.currentUser = null;
        this.xpActions = {
            // Subject Management
            'add_subject': { xp: 10, message: 'أضفت مادة جديدة!' },
            'complete_subject': { xp: 50, message: 'أكملت مادة بنجاح!' },
            
            // Lecture Management
            'add_lecture': { xp: 5, message: 'أضفت محاضرة جديدة!' },
            'complete_lecture': { xp: 15, message: 'أكملت محاضرة!' },
            'upload_file': { xp: 8, message: 'رفعت ملف للمحاضرة!' },
            
            // Study Sessions
            'complete_study_session': { xp: 20, message: 'أكملت جلسة دراسة!' },
            'complete_pomodoro': { xp: 25, message: 'أكملت جلسة بومودورو!' },
            
            // Quiz and Tests
            'create_quiz': { xp: 15, message: 'أنشأت اختبار!' },
            'complete_quiz': { xp: 30, message: 'أكملت اختبار!' },
            'perfect_score': { xp: 50, message: 'حصلت على درجة كاملة!' },
            
            // AI Assistant
            'ask_ai': { xp: 2, message: 'سألت المساعد الذكي!' },
            'use_ai_summary': { xp: 5, message: 'استخدمت التلخيص الذكي!' },
            
            // Planning
            'create_plan': { xp: 10, message: 'أنشأت خطة دراسية!' },
            'complete_task': { xp: 8, message: 'أكملت مهمة!' },
            
            // Daily Activities
            'daily_login': { xp: 5, message: 'سجلت دخولك اليوم!' },
            'streak_week': { xp: 100, message: 'حافظت على نشاطك لأسبوع!' },
            'streak_month': { xp: 500, message: 'حافظت على نشاطك لشهر!' }
        };

        this.badges = [
            { id: 'first_subject', name: 'البداية', description: 'أضف أول مادة', icon: 'fa-star', xpRequired: 10 },
            { id: 'study_master', name: 'خبير الدراسة', description: 'أكمل 50 جلسة دراسة', icon: 'fa-graduation-cap', xpRequired: 1000 },
            { id: 'quiz_champion', name: 'بطل الاختبارات', description: 'احصل على 10 درجات كاملة', icon: 'fa-trophy', xpRequired: 500 },
            { id: 'ai_explorer', name: 'مستكشف الذكاء الاصطناعي', description: 'استخدم المساعد الذكي 100 مرة', icon: 'fa-robot', xpRequired: 200 },
            { id: 'planning_pro', name: 'محترف التخطيط', description: 'أنشئ 20 خطة دراسية', icon: 'fa-calendar', xpRequired: 200 },
            { id: 'consistency_king', name: 'ملك الثبات', description: 'حافظ على نشاطك لشهر', icon: 'fa-crown', xpRequired: 500 }
        ];

        this.levels = [
            { level: 1, xpRequired: 0, title: 'مبتدئ', color: '#6b7280' },
            { level: 2, xpRequired: 100, title: 'طالب نشيط', color: '#10b981' },
            { level: 3, xpRequired: 250, title: 'دارس متفوق', color: '#3b82f6' },
            { level: 4, xpRequired: 500, title: 'باحث متقدم', color: '#8b5cf6' },
            { level: 5, xpRequired: 1000, title: 'خبير أكاديمي', color: '#f59e0b' },
            { level: 6, xpRequired: 2000, title: 'عالم متميز', color: '#ef4444' },
            { level: 7, xpRequired: 4000, title: 'أسطورة العلم', color: '#ec4899' }
        ];
    }

    // Initialize XP system
    async initialize() {
        try {
            // Wait for Supabase to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (window.supabaseAuth) {
                const { data } = await window.supabaseAuth.getSession();
                if (data?.session?.user) {
                    this.currentUser = data.session.user;
                    await this.loadUserData();
                } else {
                    console.log('No authenticated user found');
                }
            } else {
                // Demo mode fallback
                const demoUser = localStorage.getItem('demoUser');
                if (demoUser) {
                    this.currentUser = JSON.parse(demoUser);
                    await this.loadUserData();
                }
            }
        } catch (error) {
            console.error('Error initializing XP system:', error);
        }
    }

    // Load user XP data from Supabase
    async loadUserData() {
        try {
            if (!this.currentUser || !window.supabaseDB) return;

            const { data, error } = await window.supabaseDB.users.get(this.currentUser.id);
            
            if (error && error.code !== 'PGRST116') { // Not found error
                console.error('Error loading user XP data:', error);
                return;
            }

            if (!data) {
                // Create default user profile
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Create user profile with default XP data
    async createUserProfile() {
        try {
            if (!this.currentUser || !window.supabaseDB) return;

            const userData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
                xp: 0,
                level: 1,
                badges: [],
                total_subjects: 0,
                completed_lectures: 0,
                study_sessions: 0,
                quiz_attempts: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await window.supabaseDB.users.create(userData);
            console.log('✅ User XP profile created');
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    // Award XP for an action
    async awardXP(action, customAmount = null) {
        try {
            if (!this.currentUser || !window.supabaseDB) return;

            const xpData = this.xpActions[action];
            if (!xpData && !customAmount) {
                console.warn(`Unknown XP action: ${action}`);
                return;
            }

            const xpAmount = customAmount || xpData.xp;
            const message = xpData?.message || `حصلت على ${xpAmount} نقطة خبرة!`;

            // Get current user data
            const { data: userData, error: getUserError } = await window.supabaseDB.users.get(this.currentUser.id);
            
            if (getUserError) {
                console.error('Error getting user data:', getUserError);
                return;
            }

            const currentXP = userData?.xp || 0;
            const newXP = currentXP + xpAmount;
            const currentLevel = this.calculateLevel(currentXP);
            const newLevel = this.calculateLevel(newXP);

            // Update user XP
            const updateData = {
                xp: newXP,
                level: newLevel,
                updated_at: new Date().toISOString()
            };

            await window.supabaseDB.users.update(this.currentUser.id, updateData);

            // Log XP activity
            await this.logXPActivity(action, xpAmount, message);

            // Check for level up
            if (newLevel > currentLevel) {
                this.showLevelUpNotification(newLevel);
            }

            // Check for new badges
            await this.checkAndAwardBadges(newXP);

            // Show XP notification
            this.showXPNotification(xpAmount, message);

            console.log(`✅ Awarded ${xpAmount} XP for ${action}`);
        } catch (error) {
            console.error('Error awarding XP:', error);
        }
    }

    // Log XP activity
    async logXPActivity(action, amount, message) {
        try {
            if (!window.supabaseDB) return;

            const activityData = {
                user_id: this.currentUser.id,
                action: action,
                amount: amount,
                message: message,
                created_at: new Date().toISOString()
            };

            await window.supabaseDB.activities.create(activityData);
        } catch (error) {
            console.error('Error logging XP activity:', error);
        }
    }

    // Calculate level based on XP
    calculateLevel(xp) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (xp >= this.levels[i].xpRequired) {
                return this.levels[i].level;
            }
        }
        return 1;
    }

    // Get level info
    getLevelInfo(level) {
        return this.levels.find(l => l.level === level) || this.levels[0];
    }

    // Check and award badges
    async checkAndAwardBadges(currentXP) {
        try {
            if (!window.supabaseDB) return;

            const { data: userData, error } = await window.supabaseDB.users.get(this.currentUser.id);
            
            if (error) return;

            const currentBadges = userData?.badges || [];
            const newBadges = [];

            // Check each badge
            for (const badge of this.badges) {
                if (!currentBadges.includes(badge.id) && currentXP >= badge.xpRequired) {
                    newBadges.push(badge.id);
                }
            }

            // Award new badges
            if (newBadges.length > 0) {
                const updatedBadges = [...currentBadges, ...newBadges];
                
                await window.supabaseDB.users.update(this.currentUser.id, {
                    badges: updatedBadges,
                    updated_at: new Date().toISOString()
                });

                // Show badge notifications
                newBadges.forEach(badgeId => {
                    const badge = this.badges.find(b => b.id === badgeId);
                    if (badge) {
                        this.showBadgeNotification(badge);
                    }
                });
            }
        } catch (error) {
            console.error('Error checking badges:', error);
        }
    }

    // Show XP notification
    showXPNotification(amount, message) {
        this.showNotification(`+${amount} XP - ${message}`, 'success', 'fa-plus-circle');
    }

    // Show level up notification
    showLevelUpNotification(newLevel) {
        const levelInfo = this.getLevelInfo(newLevel);
        this.showNotification(`🎉 تهانينا! وصلت للمستوى ${newLevel} - ${levelInfo.title}`, 'success', 'fa-arrow-up');
    }

    // Show badge notification
    showBadgeNotification(badge) {
        this.showNotification(`🏆 حصلت على شارة جديدة: ${badge.name}`, 'success', badge.icon);
    }

    // Generic notification function
    showNotification(message, type = 'info', icon = 'fa-info-circle') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('xp-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'xp-notification';
            notification.className = 'fixed top-20 right-4 p-4 rounded-lg text-white z-50 transform translate-x-full transition-transform duration-300';
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        const bgColor = type === 'success' ? 'bg-green-500' : 
                        type === 'error' ? 'bg-red-500' : 
                        'bg-blue-500';

        notification.className = `fixed top-20 right-4 p-4 rounded-lg text-white z-50 transform transition-transform duration-300 ${bgColor}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${icon} ml-3"></i>
                <span>${message}</span>
            </div>
        `;

        // Show notification
        notification.classList.remove('translate-x-full');
        
        // Hide after 4 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
        }, 4000);
    }

    // Get user stats for display
    async getUserStats() {
        try {
            if (!this.currentUser || !window.supabaseDB) return null;

            const { data, error } = await window.supabaseDB.users.get(this.currentUser.id);
            
            if (error) return null;

            const currentLevel = this.calculateLevel(data.xp);
            const levelInfo = this.getLevelInfo(currentLevel);
            const nextLevelInfo = this.getLevelInfo(currentLevel + 1);
            
            return {
                xp: data.xp || 0,
                level: currentLevel,
                levelTitle: levelInfo.title,
                levelColor: levelInfo.color,
                badges: data.badges || [],
                xpToNextLevel: nextLevelInfo ? nextLevelInfo.xpRequired - data.xp : 0,
                progressToNextLevel: nextLevelInfo ? 
                    ((data.xp - levelInfo.xpRequired) / (nextLevelInfo.xpRequired - levelInfo.xpRequired)) * 100 : 100
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Update XP display in UI
    async updateXPDisplay() {
        const stats = await this.getUserStats();
        if (!stats) return;

        // Update header XP
        const headerXP = document.getElementById('headerXP');
        if (headerXP) {
            headerXP.textContent = stats.xp;
        }

        // Update level display
        const levelDisplay = document.getElementById('userLevel');
        if (levelDisplay) {
            levelDisplay.textContent = `المستوى ${stats.level} - ${stats.levelTitle}`;
            levelDisplay.style.color = stats.levelColor;
        }

        // Update progress bar
        const progressBar = document.getElementById('xpProgressBar');
        if (progressBar) {
            progressBar.style.width = `${stats.progressToNextLevel}%`;
        }

        // Update badges display
        const badgesContainer = document.getElementById('userBadges');
        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            stats.badges.forEach(badgeId => {
                const badge = this.badges.find(b => b.id === badgeId);
                if (badge) {
                    const badgeEl = document.createElement('div');
                    badgeEl.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 ml-1';
                    badgeEl.innerHTML = `<i class="fas ${badge.icon} ml-1"></i>${badge.name}`;
                    badgesContainer.appendChild(badgeEl);
                }
            });
        }
    }
}

// Create global XP system instance
window.xpSystem = new XPSystem();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await window.xpSystem.initialize();
    await window.xpSystem.updateXPDisplay();
});

// Export for module usage
export default XPSystem;
