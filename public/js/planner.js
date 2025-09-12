// Study Planner System for Smart Study Platform
// Updated to use Supabase instead of Firebase

// Global variables
let currentUser = null;
let currentDate = new Date();
let events = [];
let lectures = [];
let selectedEvent = null;

// Arabic month names
const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthState();
    setupEventListeners();
});

// Auth state management
async function checkAuthState() {
    try {
        // Wait for Supabase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (window.supabaseAuth) {
            const { data } = await window.supabaseAuth.getSession();
            if (data?.session?.user) {
                currentUser = data.session.user;
                document.getElementById('userEmail').textContent = currentUser.email;
                await loadData();
            } else {
                window.location.href = '/auth.html';
            }
        } else {
            // Demo mode fallback
            const demoUser = localStorage.getItem('demoUser');
            if (demoUser) {
                currentUser = JSON.parse(demoUser);
                document.getElementById('userEmail').textContent = currentUser.email;
                await loadData();
            } else {
                window.location.href = '/auth.html';
            }
        }
    } catch (error) {
        console.error('Error checking auth state:', error);
        window.location.href = '/auth.html';
    }
}

// Logout function
window.logout = async function() {
    try {
        if (window.supabaseAuth) {
            await window.supabaseAuth.signOut();
        } else {
            localStorage.removeItem('demoUser');
        }
        window.location.href = '/auth.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('خطأ في تسجيل الخروج', 'error');
    }
};

// Setup event listeners
function setupEventListeners() {
    // Event form submission
    document.getElementById('eventForm').addEventListener('submit', createEvent);
    
    // Event type change
    document.getElementById('eventType').addEventListener('change', function() {
        const lectureSelection = document.getElementById('lectureSelection');
        if (this.value === 'study' || this.value === 'lecture') {
            lectureSelection.classList.remove('hidden');
        } else {
            lectureSelection.classList.add('hidden');
        }
    });
}

// Load data from database
async function loadData() {
    try {
        showLoading();
        
        // Load events
        await loadEvents();
        
        // Load lectures
        await loadLectures();
        
        // Render calendar
        renderCalendar();
        
        // Update sidebar
        updateTodayEvents();
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

// Load events from Supabase
async function loadEvents() {
    events = [];
    
    try {
        if (currentUser && window.supabaseDB) {
            const { data, error } = await window.supabaseDB.events.getByUser(currentUser.id);
            
            if (error) {
                console.error('Error loading events:', error);
                throw error;
            }
            
            events = (data || []).map(event => ({
                ...event,
                date: new Date(event.date)
            }));
        } else {
            // Demo mode fallback
            events = JSON.parse(localStorage.getItem('events') || '[]').map(event => ({
                ...event,
                date: new Date(event.date)
            }));
        }
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to localStorage
        events = JSON.parse(localStorage.getItem('events') || '[]').map(event => ({
            ...event,
            date: new Date(event.date)
        }));
    }
}

// Load lectures from Supabase
async function loadLectures() {
    lectures = [];
    
    try {
        if (currentUser && window.supabaseDB) {
            const { data, error } = await window.supabaseDB.lectures.getByUser(currentUser.id);
            
            if (error) {
                console.error('Error loading lectures:', error);
                throw error;
            }
            
            lectures = data || [];
        } else {
            // Demo mode fallback
            lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
        }
    } catch (error) {
        console.error('Error loading lectures:', error);
        // Fallback to localStorage
        lectures = JSON.parse(localStorage.getItem('lectures') || '[]');
    }
    
    // Populate lecture dropdown
    populateLectureDropdown();
}

// Populate lecture dropdown
function populateLectureDropdown() {
    const select = document.getElementById('linkedLecture');
    select.innerHTML = '<option value="">اختر محاضرة...</option>';
    
    lectures.forEach(lecture => {
        const option = document.createElement('option');
        option.value = lecture.id;
        option.textContent = lecture.title;
        select.appendChild(option);
    });
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthEl = document.getElementById('currentMonth');
    
    // Update month display
    currentMonthEl.textContent = `${arabicMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear calendar
    calendarGrid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Calculate starting day (Saturday = 0)
    let startingDay = firstDay.getDay();
    if (startingDay === 6) startingDay = 0; // Saturday
    else startingDay = startingDay + 1;
    
    // Add empty cells for previous month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day border border-gray-200 p-2';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day border border-gray-200 p-2 cursor-pointer';
        
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        
        // Check if it's today
        if (dayDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Get events for this day
        const dayEvents = events.filter(event => 
            event.date.toDateString() === dayDate.toDateString()
        );
        
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
        }
        
        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'font-bold text-gray-800 mb-1';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Events
        dayEvents.slice(0, 3).forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event-item event-${event.type}`;
            eventEl.textContent = event.title;
            eventEl.onclick = (e) => {
                e.stopPropagation();
                showEventDetails(event);
            };
            dayElement.appendChild(eventEl);
        });
        
        // More events indicator
        if (dayEvents.length > 3) {
            const moreEl = document.createElement('div');
            moreEl.className = 'text-xs text-gray-500 mt-1';
            moreEl.textContent = `+${dayEvents.length - 3} أخرى`;
            dayElement.appendChild(moreEl);
        }
        
        // Click to add event
        dayElement.onclick = () => {
            openEventModal(dayDate);
        };
        
        calendarGrid.appendChild(dayElement);
    }
}

// Calendar navigation
window.previousMonth = function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateTodayEvents();
    updateStatistics();
};

window.nextMonth = function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateTodayEvents();
    updateStatistics();
};

window.goToToday = function() {
    currentDate = new Date();
    renderCalendar();
    updateTodayEvents();
    updateStatistics();
};

// Open event modal
window.openEventModal = function(selectedDate = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    
    // Reset form
    form.reset();
    document.getElementById('eventDuration').value = 60;
    document.getElementById('lectureSelection').classList.add('hidden');
    
    // Set date if provided
    if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        document.getElementById('eventDate').value = dateStr;
    } else {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('eventDate').value = today;
    }
    
    modal.classList.remove('hidden');
};

// Close event modal
window.closeEventModal = function() {
    document.getElementById('eventModal').classList.add('hidden');
};

// Create event
async function createEvent(e) {
    e.preventDefault();
    
    try {
        const title = document.getElementById('eventTitle').value.trim();
        const type = document.getElementById('eventType').value;
        const linkedLecture = document.getElementById('linkedLecture').value;
        const date = new Date(document.getElementById('eventDate').value);
        const time = document.getElementById('eventTime').value;
        const duration = parseInt(document.getElementById('eventDuration').value);
        const description = document.getElementById('eventDescription').value.trim();
        
        if (!title || !date || !time) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // Combine date and time
        const [hours, minutes] = time.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
        
        const eventData = {
            title,
            type,
            date: date.toISOString(),
            duration,
            description,
            userId: currentUser.id,
            createdAt: new Date().toISOString()
        };
        
        // Add linked lecture if selected
        if (linkedLecture) {
            const lecture = lectures.find(l => l.id === linkedLecture);
            if (lecture) {
                eventData.linkedLecture = {
                    id: lecture.id,
                    title: lecture.title
                };
            }
        }
        
        // Save to database
        if (window.supabaseDB) {
            const { data, error } = await window.supabaseDB.events.create(eventData);
            if (error) throw error;
            eventData.id = data.id;
        } else {
            // Demo mode fallback
            eventData.id = 'event_' + Date.now();
            const localEvents = JSON.parse(localStorage.getItem('events') || '[]');
            localEvents.push(eventData);
            localStorage.setItem('events', JSON.stringify(localEvents));
        }
        
        // Convert date back to Date object for local array
        eventData.date = new Date(eventData.date);
        events.push(eventData);
        
        // Award XP for creating plan
        if (window.xpSystem) {
            await window.xpSystem.awardXP('create_plan');
        }
        
        closeEventModal();
        renderCalendar();
        updateTodayEvents();
        updateStatistics();
        
        showNotification('تم إضافة الحدث بنجاح', 'success');
        
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification('خطأ في إضافة الحدث', 'error');
    }
}

// Show event details
function showEventDetails(event) {
    selectedEvent = event;
    const modal = document.getElementById('eventDetailsModal');
    const content = document.getElementById('eventDetailsContent');
    
    const eventDate = event.date.toLocaleDateString('ar-SA');
    const eventTime = event.date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const typeLabels = {
        study: 'جلسة دراسة',
        lecture: 'محاضرة',
        exam: 'امتحان',
        assignment: 'مهمة/واجب'
    };
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <h4 class="font-bold text-gray-900">${event.title}</h4>
                <p class="text-sm text-gray-600">${typeLabels[event.type]}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="font-medium text-gray-700">التاريخ:</span>
                    <p class="text-gray-600">${eventDate}</p>
                </div>
                <div>
                    <span class="font-medium text-gray-700">الوقت:</span>
                    <p class="text-gray-600">${eventTime}</p>
                </div>
            </div>
            
            <div>
                <span class="font-medium text-gray-700">المدة:</span>
                <p class="text-gray-600">${event.duration} دقيقة</p>
            </div>
            
            ${event.linkedLecture ? `
                <div>
                    <span class="font-medium text-gray-700">المحاضرة المرتبطة:</span>
                    <p class="text-gray-600">${event.linkedLecture.title}</p>
                </div>
            ` : ''}
            
            ${event.description ? `
                <div>
                    <span class="font-medium text-gray-700">الوصف:</span>
                    <p class="text-gray-600">${event.description}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close event details modal
window.closeEventDetailsModal = function() {
    document.getElementById('eventDetailsModal').classList.add('hidden');
    selectedEvent = null;
};

// Edit event
window.editEvent = function() {
    if (!selectedEvent) return;
    
    closeEventDetailsModal();
    
    // Open event modal with pre-filled data
    const modal = document.getElementById('eventModal');
    
    document.getElementById('eventTitle').value = selectedEvent.title;
    document.getElementById('eventType').value = selectedEvent.type;
    document.getElementById('eventDate').value = selectedEvent.date.toISOString().split('T')[0];
    document.getElementById('eventTime').value = selectedEvent.date.toTimeString().slice(0, 5);
    document.getElementById('eventDuration').value = selectedEvent.duration;
    document.getElementById('eventDescription').value = selectedEvent.description || '';
    
    if (selectedEvent.linkedLecture) {
        document.getElementById('linkedLecture').value = selectedEvent.linkedLecture.id;
        document.getElementById('lectureSelection').classList.remove('hidden');
    }
    
    modal.classList.remove('hidden');
};

// Delete event
window.deleteEvent = async function() {
    if (!selectedEvent) return;
    
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
    
    try {
        // Delete from database
        if (window.supabaseDB) {
            const { error } = await window.supabaseDB.events.delete(selectedEvent.id);
            if (error) throw error;
        } else {
            // Demo mode fallback
            const localEvents = JSON.parse(localStorage.getItem('events') || '[]');
            const filteredEvents = localEvents.filter(e => e.id !== selectedEvent.id);
            localStorage.setItem('events', JSON.stringify(filteredEvents));
        }
        
        // Remove from local array
        events = events.filter(e => e.id !== selectedEvent.id);
        
        closeEventDetailsModal();
        renderCalendar();
        updateTodayEvents();
        updateStatistics();
        
        showNotification('تم حذف الحدث بنجاح', 'success');
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('خطأ في حذف الحدث', 'error');
    }
};

// Generate smart plan
window.generateSmartPlan = async function() {
    try {
        showLoading();
        
        // Analyze current schedule and lectures
        const suggestions = await generateSmartSuggestions();
        
        if (suggestions.length === 0) {
            showNotification('لا توجد اقتراحات متاحة حالياً', 'info');
            return;
        }
        
        // Show suggestions
        displaySmartSuggestions(suggestions);
        
        showNotification('تم إنشاء الخطة الذكية بنجاح', 'success');
        
    } catch (error) {
        console.error('Error generating smart plan:', error);
        showNotification('خطأ في إنشاء الخطة الذكية', 'error');
    } finally {
        hideLoading();
    }
};

// Generate smart suggestions
async function generateSmartSuggestions() {
    const suggestions = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Suggest study sessions for lectures without recent study events
    lectures.forEach(lecture => {
        const recentStudyEvents = events.filter(event => 
            event.type === 'study' && 
            event.linkedLecture?.id === lecture.id &&
            event.date >= today
        );
        
        if (recentStudyEvents.length === 0) {
            suggestions.push({
                type: 'study_session',
                title: `جلسة دراسة: ${lecture.title}`,
                description: 'لم تقم بجدولة جلسة دراسة لهذه المحاضرة مؤخراً',
                priority: 'high',
                lectureId: lecture.id,
                suggestedDate: new Date(today.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
        }
    });
    
    // Suggest review sessions before exams
    const upcomingExams = events.filter(event => 
        event.type === 'exam' && 
        event.date > today && 
        event.date <= nextWeek
    );
    
    upcomingExams.forEach(exam => {
        const reviewDate = new Date(exam.date.getTime() - 2 * 24 * 60 * 60 * 1000);
        if (reviewDate > today) {
            suggestions.push({
                type: 'review_session',
                title: `مراجعة قبل ${exam.title}`,
                description: 'مراجعة مكثفة قبل الامتحان بيومين',
                priority: 'high',
                suggestedDate: reviewDate,
                relatedEvent: exam
            });
        }
    });
    
    // Suggest balanced study schedule
    const studyEvents = events.filter(event => 
        event.type === 'study' && 
        event.date >= today && 
        event.date <= nextWeek
    );
    
    if (studyEvents.length < 3) {
        for (let i = 1; i <= 7; i++) {
            const suggestedDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
            if (suggestedDate.getDay() !== 5) { // Skip Fridays
                const dayEvents = events.filter(event => 
                    event.date.toDateString() === suggestedDate.toDateString()
                );
                
                if (dayEvents.length < 2) {
                    suggestions.push({
                        type: 'daily_study',
                        title: 'جلسة دراسة يومية',
                        description: 'جلسة دراسة منتظمة للحفاظ على الروتين',
                        priority: 'medium',
                        suggestedDate: suggestedDate
                    });
                }
            }
        }
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
}

// Display smart suggestions
function displaySmartSuggestions(suggestions) {
    const container = document.getElementById('smartSuggestions');
    const content = document.getElementById('suggestionsContent');
    
    content.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'smart-suggestion p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50';
        
        const priorityColor = suggestion.priority === 'high' ? 'text-red-600' : 'text-yellow-600';
        const dateStr = suggestion.suggestedDate.toLocaleDateString('ar-SA');
        
        suggestionEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">${suggestion.title}</h4>
                <span class="text-xs ${priorityColor}">${suggestion.priority === 'high' ? 'عالي' : 'متوسط'}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">${suggestion.description}</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">${dateStr}</span>
                <button onclick="applySuggestion(${index})" class="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    تطبيق
                </button>
            </div>
        `;
        
        content.appendChild(suggestionEl);
    });
    
    container.classList.remove('hidden');
    
    // Store suggestions globally for applySuggestion function
    window.currentSuggestions = suggestions;
}

// Apply suggestion
window.applySuggestion = function(index) {
    const suggestion = window.currentSuggestions[index];
    if (!suggestion) return;
    
    // Pre-fill event modal with suggestion data
    document.getElementById('eventTitle').value = suggestion.title;
    document.getElementById('eventType').value = suggestion.type.includes('study') ? 'study' : 'exam';
    document.getElementById('eventDate').value = suggestion.suggestedDate.toISOString().split('T')[0];
    document.getElementById('eventTime').value = '14:00'; // Default 2 PM
    document.getElementById('eventDescription').value = suggestion.description;
    
    if (suggestion.lectureId) {
        document.getElementById('linkedLecture').value = suggestion.lectureId;
        document.getElementById('lectureSelection').classList.remove('hidden');
    }
    
    openEventModal();
};

// View upcoming events
window.viewUpcoming = function() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = events
        .filter(event => event.date >= today && event.date <= nextWeek)
        .sort((a, b) => a.date - b.date);
    
    if (upcomingEvents.length === 0) {
        showNotification('لا توجد أحداث قادمة في الأسبوع القادم', 'info');
        return;
    }
    
    let message = 'الأحداث القادمة:\n\n';
    upcomingEvents.forEach(event => {
        const dateStr = event.date.toLocaleDateString('ar-SA');
        const timeStr = event.date.toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        message += `• ${event.title} - ${dateStr} ${timeStr}\n`;
    });
    
    alert(message);
};

// Update today's events
function updateTodayEvents() {
    const today = new Date();
    const todayEvents = events.filter(event => 
        event.date.toDateString() === today.toDateString()
    ).sort((a, b) => a.date - b.date);
    
    const container = document.getElementById('todayEvents');
    
    if (todayEvents.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">لا توجد أحداث اليوم</p>';
        return;
    }
    
    container.innerHTML = '';
    
    todayEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = `event-item event-${event.type} cursor-pointer`;
        eventEl.textContent = `${event.date.toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })} - ${event.title}`;
        eventEl.onclick = () => showEventDetails(event);
        container.appendChild(eventEl);
    });
}

// Update statistics
function updateStatistics() {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Monthly events
    const monthlyEvents = events.filter(event => 
        event.date >= currentMonth && event.date < nextMonth
    ).length;
    
    // Study sessions
    const studySessions = events.filter(event => 
        event.type === 'study' && event.date >= currentMonth && event.date < nextMonth
    ).length;
    
    // Upcoming exams
    const upcomingExams = events.filter(event => 
        event.type === 'exam' && event.date > today
    ).length;
    
    document.getElementById('monthlyEvents').textContent = monthlyEvents;
    document.getElementById('studySessions').textContent = studySessions;
    document.getElementById('upcomingExams').textContent = upcomingExams;
}

// Utility functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const messageEl = document.getElementById('notificationMessage');
    
    const icons = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        info: 'fa-info-circle text-blue-500',
        warning: 'fa-exclamation-triangle text-yellow-500'
    };
    
    icon.className = `fas ${icons[type]} ml-3`;
    messageEl.textContent = message;
    
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}
