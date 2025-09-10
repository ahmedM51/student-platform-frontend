// Frontend Configuration for Student Platform
// This file handles API communication between frontend and backend

// API Configuration
const CONFIG = {
    // Backend URL - updated with actual deployment URL
    API_BASE_URL: 'https://student-platform-backend.vercel.app', // Replace with your actual backend URL
    
    // API Endpoints
    ENDPOINTS: {
        HEALTH: '/api/health',
        AI_CHAT: '/api/ai-chat',
        UPLOAD: '/api/upload',
        SUPABASE: '/api/supabase'
    },
    
    // CORS Configuration
    CORS_OPTIONS: {
        credentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    
    // Development mode detection
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Auto-detect API base URL
    getApiBaseUrl() {
        // If in development, use localhost
        if (this.IS_DEVELOPMENT) {
            return 'http://localhost:3000';
        }
        
        // Use configured backend URL
        return this.API_BASE_URL;
    }
};

// API Request Function
async function apiRequest(endpoint, options = {}) {
    const baseUrl = CONFIG.getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...CONFIG.CORS_OPTIONS.headers
        },
        credentials: 'include'
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        console.log(`🌐 API Request: ${url}`);
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Response: ${endpoint}`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ API Error: ${endpoint}`, error);
        throw error;
    }
}

// Export for use in other files
window.CONFIG = CONFIG;
window.apiRequest = apiRequest;

console.log('✅ Frontend config loaded. Backend URL:', CONFIG.getApiBaseUrl());
