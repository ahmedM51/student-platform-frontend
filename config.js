// إعدادات الربط مع Backend API
const API_CONFIG = {
    // عنوان Backend API (Backend منفصل)
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://student-platform-backend-one.vercel.app',
    
    // API Endpoints
    ENDPOINTS: {
        AUTH: '/api/auth',
        AI_CHAT: '/api/ai-chat',
        UPLOAD: '/api/upload',
        SUBJECTS: '/api/subjects',
        PLANNER: '/api/planner',
        HEALTH: '/health'
    },
    
    // Request timeout (milliseconds)
    TIMEOUT: 30000
};

// دالة لإرسال الطلبات للـ Backend
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT
    };
    
    // دمج الخيارات
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
        console.log(`🔗 API Request: ${requestOptions.method} ${url}`);
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
        return data;
        
    } catch (error) {
        console.error('❌ API Request failed:', error);
        throw error;
    }
}

// دالة لرفع الملفات
async function uploadFile(file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('❌ File upload failed:', error);
        throw error;
    }
}

// دالة للتحقق من حالة Backend
async function checkBackendHealth() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.HEALTH);
        console.log('✅ Backend is healthy');
        return true;
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        return false;
    }
}

// تحديث عنوان Backend بعد النشر
function updateBackendURL(newURL) {
    API_CONFIG.BASE_URL = newURL;
    console.log(`🔄 Backend URL updated to: ${newURL}`);
}

// تصدير للاستخدام في ملفات أخرى
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.uploadFile = uploadFile;
window.checkBackendHealth = checkBackendHealth;
window.updateBackendURL = updateBackendURL;
