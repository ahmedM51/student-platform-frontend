// إعدادات الاتصال بين Frontend و Backend
const CONFIG = {
    // رابط Backend API (سيتم تحديثه بعد النشر)
    API_BASE_URL: 'https://your-backend-app.vercel.app',
    
    // إعدادات الاتصال
    API_ENDPOINTS: {
        HEALTH: '/health',
        AI_CHAT: '/api/ai-chat',
        UPLOAD: '/api/upload',
        AUTH: '/api/auth'
    },
    
    // إعدادات CORS
    CORS_OPTIONS: {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    
    // كشف البيئة تلقائياً
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // بيئة التطوير المحلي
            this.API_BASE_URL = 'http://localhost:3000';
        } else if (hostname.includes('vercel.app')) {
            // بيئة الإنتاج على Vercel
            // سيتم تحديث هذا الرابط بعد نشر Backend
            this.API_BASE_URL = 'https://your-backend-app.vercel.app';
        }
        
        return this.API_BASE_URL;
    },
    
    // دالة لإرسال طلبات API
    async apiRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            ...this.CORS_OPTIONS,
            ...options
        };
        
        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
};

// تشغيل كشف البيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    CONFIG.detectEnvironment();
    console.log('🔗 API Base URL:', CONFIG.API_BASE_URL);
});

// تصدير الإعدادات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
