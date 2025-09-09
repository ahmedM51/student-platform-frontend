// Subjects Management System for Smart Study Platform
// Updated to use Supabase instead of Firebase

// Global variables
let subjects = [];
let lectures = [];
let currentUser = null;

// Initialize authentication and load subjects
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Wait for Supabase to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (window.supabaseAuth) {
            const { data } = await window.supabaseAuth.getSession();
            if (data?.session?.user) {
                currentUser = data.session.user;
                await loadSubjects();
            } else {
                // Redirect to auth if no user
                window.location.href = '/auth.html';
            }
        } else {
            throw new Error('Supabase not initialized. Please check your configuration.');
        }
    } catch (error) {
        console.error('Error initializing subjects page:', error);
        window.location.href = '/auth.html';
    }
});

// Load subjects from Supabase
window.loadSubjects = async function() {
    try {
        showLoading();
        subjects = [];
        
        if (!currentUser || !window.supabaseDB) {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }

        const { data, error } = await window.supabaseDB.subjects.getByUser(currentUser.id);
        
        if (error) {
            console.error('Error loading subjects:', error);
            throw error;
        }
        
        subjects = data || [];
        displaySubjects();
        
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('فشل في تحميل المواد. يرجى التحقق من اتصال قاعدة البيانات.', 'error');
        // Redirect to auth page if database connection fails
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 2000);
    } finally {
        hideLoading();
    }
};

function displaySubjects() {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-book text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-500 mb-2">لا توجد مواد بعد</h3>
                <p class="text-gray-400 mb-4">ابدأ بتنظيم دراستك وإضافة المواد مع ملفات PDF</p>
                <button onclick="showAddSubject()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition-all">
                    <i class="fas fa-plus ml-2"></i>إضافة أول مادة
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subjects.map(subject => `
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover border border-gray-100">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3 space-x-reverse">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-book text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${subject.name}</h3>
                        ${subject.has_files ? '<span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">يحتوي على ملفات</span>' : ''}
                    </div>
                </div>
                <div class="flex space-x-2 space-x-reverse">
                    <button onclick="editSubject('${subject.id}')" class="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSubject('${subject.id}')" class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <p class="text-gray-600 mb-4 line-clamp-2">${subject.description || 'لا يوجد وصف'}</p>
            
            <div class="flex justify-between items-center mb-4">
                <div class="flex space-x-4 space-x-reverse text-sm text-gray-500">
                    <span><i class="fas fa-graduation-cap ml-1"></i>${subject.total_lectures || 0} محاضرة</span>
                    ${subject.file_count ? `<span><i class="fas fa-file-pdf ml-1"></i>${subject.file_count} ملف</span>` : ''}
                </div>
                <span class="text-sm font-medium text-blue-600">${subject.progress || 0}% مكتمل</span>
            </div>
            
            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all" style="width: ${subject.progress || 0}%"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
                <button onclick="viewSubjectLectures('${subject.id}')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm transition-all">
                    <i class="fas fa-eye ml-1"></i>عرض المحاضرات
                </button>
                <button onclick="addLecture('${subject.id}')" 
                        class="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm transition-all">
                    <i class="fas fa-plus ml-1"></i>إضافة محاضرة
                </button>
            </div>
        </div>
    `).join('');
}

// Show add subject modal with file upload
window.showAddSubject = function() {
    const modal = createModal('إضافة مادة جديدة', `
        <form id="subjectForm" onsubmit="createSubject(event)">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">اسم المادة *</label>
                    <input type="text" id="subjectName" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="مثال: الرياضيات المتقدمة" required>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">وصف المادة</label>
                    <textarea id="subjectDescription" class="w-full p-3 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="وصف مختصر عن محتوى المادة..."></textarea>
                </div>
                
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">رفع ملف PDF للمادة (اختياري)</label>
                    <input type="file" id="subjectFile" accept=".pdf,.doc,.docx,.ppt,.pptx" class="hidden" onchange="handleSubjectFileSelect(this)">
                    <button type="button" onclick="document.getElementById('subjectFile').click()" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-2">
                        <i class="fas fa-upload ml-2"></i>اختيار ملف
                    </button>
                    <div id="subjectFileInfo" class="text-sm text-gray-600 mt-2"></div>
                    <p class="text-xs text-gray-500 mt-2">يدعم: PDF, Word, PowerPoint (حد أقصى 10MB)</p>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">أو إضافة رابط مباشر</label>
                    <input type="url" id="subjectUrl" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="https://example.com/document.pdf">
                    <p class="text-xs text-gray-500 mt-1">سيتم إنشاء محاضرة تلقائياً من هذا الرابط</p>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                            class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        إلغاء
                    </button>
                    <button type="submit" id="createSubjectBtn"
                            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <i class="fas fa-plus ml-2"></i>إضافة المادة
                    </button>
                </div>
            </div>
        </form>
    `);
};

// Handle subject file selection
window.handleSubjectFileSelect = function(input) {
    const fileInfo = document.getElementById('subjectFileInfo');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (file.size > 10 * 1024 * 1024) {
            showNotification('حجم الملف كبير جداً. الحد الأقصى 10MB', 'error');
            input.value = '';
            fileInfo.innerHTML = '';
            return;
        }
        
        fileInfo.innerHTML = `
            <div class="flex items-center justify-center space-x-2 space-x-reverse text-green-600">
                <i class="fas fa-file-pdf"></i>
                <span>${file.name} (${fileSize} MB)</span>
                <button type="button" onclick="clearSubjectFile()" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
};

window.clearSubjectFile = function() {
    document.getElementById('subjectFile').value = '';
    document.getElementById('subjectFileInfo').innerHTML = '';
};

// Upload file to server
async function uploadFile(file, type = 'subject') {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('userId', currentUser.id);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('فشل رفع الملف');
        }

        const result = await response.json();
        return {
            url: result.url,
            name: file.name,
            size: file.size,
            type: file.type,
            path: result.path
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('فشل رفع الملف');
    }
}

// Create subject with file upload
window.createSubject = async function(e) {
    e.preventDefault();
    
    try {
        const createBtn = document.getElementById('createSubjectBtn');
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري الإضافة...';
        
        const name = document.getElementById('subjectName').value.trim();
        const description = document.getElementById('subjectDescription').value.trim();
        const url = document.getElementById('subjectUrl').value.trim();
        const fileInput = document.getElementById('subjectFile');
        
        if (!name) {
            throw new Error('اسم المادة مطلوب');
        }
        
        const subjectData = {
            name,
            description,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            total_lectures: 0,
            completed_lectures: 0,
            progress: 0,
            has_files: false,
            file_count: 0
        };
        
        // Handle file upload
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const fileData = await uploadFile(file, 'subject');
            
            subjectData.file = fileData;
            subjectData.has_files = true;
            subjectData.file_count = 1;
        }
        
        if (url) {
            subjectData.url = url;
        }
        
        let subjectId;
        
        if (window.supabaseDB) {
            const { data, error } = await window.supabaseDB.subjects.create(subjectData);
            if (error) throw error;
            subjectId = data.id;
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        // Create initial lecture if file or URL provided
        if (subjectData.file || url) {
            const lectureData = {
                subject_id: subjectId,
                title: subjectData.file ? `محاضرة من ملف: ${subjectData.file.name}` : 'محاضرة من رابط',
                content: subjectData.file ? 
                    `تم رفع ملف: ${subjectData.file.name} (${(subjectData.file.size / 1024 / 1024).toFixed(2)} MB)` : 
                    `تم إضافة رابط: ${url}`,
                user_id: currentUser.id,
                created_at: new Date().toISOString(),
                is_completed: false,
                file_url: subjectData.file?.url || url,
                file_name: subjectData.file?.name || 'رابط خارجي',
                file_type: subjectData.file?.type || 'url'
            };
            
            if (window.supabaseDB) {
                await window.supabaseDB.lectures.create(lectureData);
                await window.supabaseDB.subjects.update(subjectId, { total_lectures: 1 });
            } else {
                throw new Error('Supabase client not initialized. Please check your configuration.');
            }
        }
        
        // Award XP for creating subject
        if (window.xpSystem) {
            await window.xpSystem.awardXP('add_subject');
        }
        
        closeModal();
        showNotification('تم إضافة المادة بنجاح', 'success');
        loadSubjects();
        
    } catch (error) {
        console.error('Error creating subject:', error);
        showNotification('فشل إضافة المادة: ' + error.message, 'error');
    } finally {
        const createBtn = document.getElementById('createSubjectBtn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = '<i class="fas fa-plus ml-2"></i>إضافة المادة';
        }
    }
};

// Add lecture with enhanced file upload
window.addLecture = function(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    createModal(`إضافة محاضرة جديدة - ${subject.name}`, `
        <form id="lectureForm" onsubmit="createLecture(event, '${subjectId}')">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">عنوان المحاضرة *</label>
                    <input type="text" id="lectureTitle" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="مثال: الفصل الأول - المقدمة" required>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold mb-2 text-gray-700">وصف المحاضرة</label>
                    <textarea id="lectureContent" class="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ملخص أو ملاحظات حول المحاضرة..."></textarea>
                </div>
                
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div class="text-center mb-4">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                        <label class="block text-sm font-semibold mb-2 text-gray-700">رفع ملفات المحاضرة</label>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input type="file" id="lectureFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png" class="hidden" onchange="handleLectureFileSelect(this)">
                            <button type="button" onclick="document.getElementById('lectureFile').click()" 
                                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg">
                                <i class="fas fa-upload ml-2"></i>اختيار ملف
                            </button>
                            <div id="lectureFileInfo" class="text-sm text-gray-600 mt-2"></div>
                        </div>
                        
                        <div>
                            <input type="url" id="lectureUrl" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                   placeholder="أو أدخل رابط مباشر">
                            <p class="text-xs text-gray-500 mt-1">رابط لفيديو، PDF، أو أي مصدر آخر</p>
                        </div>
                    </div>
                    
                    <p class="text-xs text-gray-500 mt-3 text-center">يدعم: PDF, Word, PowerPoint, صور, نصوص (حد أقصى 15MB)</p>
                </div>
                
                <div class="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
                    <button type="button" onclick="closeModal()" 
                            class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
                        إلغاء
                    </button>
                    <button type="submit" id="createLectureBtn"
                            class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
                        <i class="fas fa-plus ml-2"></i>إضافة المحاضرة
                    </button>
                </div>
            </div>
        </form>
    `);
};

// Handle lecture file selection
window.handleLectureFileSelect = function(input) {
    const fileInfo = document.getElementById('lectureFileInfo');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (file.size > 15 * 1024 * 1024) {
            showNotification('حجم الملف كبير جداً. الحد الأقصى 15MB', 'error');
            input.value = '';
            fileInfo.innerHTML = '';
            return;
        }
        
        const fileIcon = getFileIcon(file.type);
        fileInfo.innerHTML = `
            <div class="flex items-center justify-center space-x-2 space-x-reverse text-green-600 bg-green-50 p-2 rounded">
                <i class="${fileIcon}"></i>
                <span class="text-sm">${file.name}</span>
                <span class="text-xs text-gray-500">(${fileSize} MB)</span>
                <button type="button" onclick="clearLectureFile()" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
};

window.clearLectureFile = function() {
    document.getElementById('lectureFile').value = '';
    document.getElementById('lectureFileInfo').innerHTML = '';
};

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word text-blue-500';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint text-orange-500';
    if (fileType.includes('image')) return 'fas fa-file-image text-green-500';
    if (fileType.includes('text')) return 'fas fa-file-alt text-gray-500';
    return 'fas fa-file text-gray-500';
}

// Create lecture with file upload
window.createLecture = async function(e, subjectId) {
    e.preventDefault();
    
    try {
        const createBtn = document.getElementById('createLectureBtn');
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري الإضافة...';
        
        const title = document.getElementById('lectureTitle').value.trim();
        const content = document.getElementById('lectureContent').value.trim();
        const url = document.getElementById('lectureUrl').value.trim();
        const fileInput = document.getElementById('lectureFile');
        
        if (!title) {
            throw new Error('عنوان المحاضرة مطلوب');
        }
        
        const lectureData = {
            subject_id: subjectId,
            title,
            content,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            is_completed: false
        };
        
        // Handle file upload
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const filePath = `lectures/${currentUser.id}/${subjectId}/${Date.now()}_${file.name}`;
            const fileData = await uploadFile(file, filePath);
            
            lectureData.file = fileData;
            lectureData.file_url = fileData.url;
            lectureData.file_name = fileData.name;
            lectureData.file_type = fileData.type;
        }
        
        if (url) {
            lectureData.url = url;
            if (!lectureData.file_url) {
                lectureData.file_url = url;
                lectureData.file_name = 'رابط خارجي';
                lectureData.file_type = 'url';
            }
        }
        
        if (window.supabaseDB) {
            await window.supabaseDB.lectures.create(lectureData);
            
            // Update subject lecture count and file count
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                const newLectureCount = (subject.total_lectures || 0) + 1;
                const newFileCount = lectureData.file ? (subject.file_count || 0) + 1 : (subject.file_count || 0);
                const hasFiles = newFileCount > 0 || subject.has_files;
                
                await window.supabaseDB.subjects.update(subjectId, { 
                    total_lectures: newLectureCount,
                    file_count: newFileCount,
                    has_files: hasFiles
                });
            }
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        closeModal();
        showNotification('تم إضافة المحاضرة بنجاح', 'success');
        loadSubjects();
        
    } catch (error) {
        console.error('Error creating lecture:', error);
        showNotification('فشل إضافة المحاضرة: ' + error.message, 'error');
    } finally {
        const createBtn = document.getElementById('createLectureBtn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.innerHTML = '<i class="fas fa-plus ml-2"></i>إضافة المحاضرة';
        }
    }
};

// View subject lectures with enhanced display
window.viewSubjectLectures = async function(subjectId) {
    try {
        showLoading();
        
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) {
            throw new Error('المادة غير موجودة');
        }
        
        let subjectLectures = [];
        
        if (window.supabaseDB) {
            const { data, error } = await window.supabaseDB.lectures.getBySubject(subjectId);
            if (error) throw error;
            subjectLectures = data || [];
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        const lecturesHtml = subjectLectures.length > 0 ? subjectLectures.map(lecture => `
            <div class="border-2 rounded-xl p-6 mb-4 transition-all ${lecture.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-200'}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h4 class="text-lg font-bold ${lecture.is_completed ? 'text-green-800' : 'text-gray-800'} mb-2">${lecture.title}</h4>
                        <p class="text-gray-600 text-sm mb-3">${lecture.content || lecture.description || 'لا يوجد وصف'}</p>
                        
                        ${lecture.file_url ? `
                            <div class="flex items-center space-x-2 space-x-reverse mb-3">
                                <i class="${getFileIcon(lecture.file_type)} text-lg"></i>
                                <a href="${lecture.file_url}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium">
                                    ${lecture.file_name || 'عرض الملف'}
                                </a>
                                ${lecture.file_size ? `<span class="text-xs text-gray-500">(${(lecture.file_size / 1024 / 1024).toFixed(2)} MB)</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex flex-col space-y-2 mr-4">
                        <button onclick="toggleLectureComplete('${lecture.id}')" 
                                class="px-3 py-1 rounded-full text-sm font-medium transition-all ${lecture.is_completed ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                            ${lecture.is_completed ? 'مكتملة ✓' : 'غير مكتملة'}
                        </button>
                        <button onclick="editLecture('${lecture.id}')" class="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="confirmDeleteLecture('${lecture.id}')" class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span class="text-xs text-gray-500">
                        تاريخ الإنشاء: ${new Date(lecture.created_at).toLocaleDateString('ar-SA')}
                    </span>
                    <button onclick="showLectureSummary('${lecture.id}')" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        <i class="fas fa-eye ml-1"></i>عرض التفاصيل
                    </button>
                </div>
            </div>
        `).join('') : `
            <div class="text-center py-12">
                <i class="fas fa-graduation-cap text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-500 mb-2">لا توجد محاضرات في هذه المادة</h3>
                <p class="text-gray-400 mb-4">ابدأ بإضافة محاضرات مع ملفات PDF أو روابط</p>
            </div>
        `;
        
        createModal(`محاضرات مادة: ${subject.name}`, `
            <div class="max-h-96 overflow-y-auto mb-6">
                ${lecturesHtml}
            </div>
            <div class="flex justify-center space-x-3 space-x-reverse pt-4 border-t">
                <button onclick="addLecture('${subjectId}')" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all">
                    <i class="fas fa-plus ml-2"></i>إضافة محاضرة جديدة
                </button>
                <button onclick="closeModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all">
                    إغلاق
                </button>
            </div>
        `);
        
    } catch (error) {
        console.error('Error viewing lectures:', error);
        showNotification('فشل تحميل المحاضرات', 'error');
    } finally {
        hideLoading();
    }
};

// Toggle lecture completion
window.toggleLectureComplete = async function(lectureId) {
    try {
        let lecture;
        
        if (window.supabaseDB) {
            // Find lecture in Supabase
            const { data, error } = await window.supabaseDB.lectures.get(lectureId);
            if (error) throw error;
            lecture = data || {};
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        if (lecture) {
            if (window.supabaseDB) {
                await window.supabaseDB.lectures.update(lectureId, { 
                    is_completed: !lecture.is_completed,
                    updated_at: new Date().toISOString()
                });
            } else {
                throw new Error('Supabase client not initialized. Please check your configuration.');
            }
            
            if (lecture) {
                showNotification(lecture.is_completed ? 'تم إكمال المحاضرة' : 'تم إلغاء إكمال المحاضرة', 'success');
                // Refresh the current view
                viewSubjectLectures(lecture.subject_id);
                // Update statistics
                if (window.updateStatistics) {
                    window.updateStatistics();
                }
            }
            
        }
        
    } catch (error) {
        console.error('Error toggling lecture completion:', error);
        showNotification('فشل تحديث حالة المحاضرة', 'error');
    }
};

// Delete lecture confirmation
window.confirmDeleteLecture = function(lectureId) {
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟ سيتم حذف الملفات المرتبطة بها أيضاً.')) {
        deleteLecture(lectureId);
    }
};

// Delete lecture
async function deleteLecture(lectureId) {
    try {
        showLoading();
        
        let lecture;
        
        if (window.supabaseDB) {
            // Find and delete lecture in Supabase
            const { data, error } = await window.supabaseDB.lectures.get(lectureId);
            if (error) throw error;
            lecture = data || {};
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        if (lecture) {
            if (window.supabaseDB) {
                // Delete file from server if exists
                if (lecture.file && lecture.file.path) {
                    try {
                        const response = await fetch('/api/delete-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: lecture.file.path })
                        });
                        if (!response.ok) {
                            console.warn('Could not delete file from server:', response.statusText);
                        }
                    } catch (fileError) {
                        console.warn('Could not delete file from server:', fileError);
                    }
                }
                
                await window.supabaseDB.lectures.delete(lectureId);
                
                // Update subject file count
                const subject = subjects.find(s => s.id === lecture.subject_id);
                if (subject && lecture.file) {
                    const newFileCount = Math.max(0, (subject.file_count || 0) - 1);
                    await window.supabaseDB.subjects.update(lecture.subject_id, { 
                        file_count: newFileCount,
                        has_files: newFileCount > 0
                    });
                }
            } else {
                throw new Error('Supabase client not initialized. Please check your configuration.');
            }
            
            showNotification('تم حذف المحاضرة بنجاح', 'success');
            if (lecture) {
                viewSubjectLectures(lecture.subject_id);
            }
            loadSubjects();
            
        }
        
    } catch (error) {
        console.error('Error deleting lecture:', error);
        showNotification('فشل حذف المحاضرة', 'error');
    } finally {
        hideLoading();
    }
}

// Show lecture summary
window.showLectureSummary = async function(lectureId) {
    try {
        let lecture;
        
        if (window.supabaseDB) {
            const { data, error } = await window.supabaseDB.lectures.get(lectureId);
            if (error) throw error;
            lecture = data || {};
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        if (!lecture) {
            showNotification('المحاضرة غير موجودة', 'error');
            return;
        }
        
        const createdDate = new Date(lecture.created_at).toLocaleDateString('ar-SA');
        const subject = subjects.find(s => s.id === lecture.subject_id);
        
        createModal(`تفاصيل المحاضرة: ${lecture.title}`, `
            <div class="space-y-6">
                <div class="bg-gray-50 p-6 rounded-xl">
                    <h4 class="font-bold mb-4 text-lg">معلومات عامة</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <i class="fas fa-book text-blue-500"></i>
                            <span><strong>المادة:</strong> ${subject?.name || 'غير محدد'}</span>
                        </div>
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <i class="fas fa-calendar text-green-500"></i>
                            <span><strong>تاريخ الإنشاء:</strong> ${createdDate}</span>
                        </div>
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <i class="fas ${lecture.is_completed ? 'fa-check-circle text-green-500' : 'fa-clock text-orange-500'}"></i>
                            <span><strong>الحالة:</strong> ${lecture.is_completed ? 'مكتملة' : 'غير مكتملة'}</span>
                        </div>
                        <div class="flex items-center space-x-2 space-x-reverse">
                            <i class="fas fa-file text-purple-500"></i>
                            <span><strong>نوع المحتوى:</strong> ${lecture.file_url ? 'ملف + نص' : 'نص فقط'}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold mb-3 text-lg flex items-center">
                        <i class="fas fa-align-left text-blue-500 ml-2"></i>
                        المحتوى
                    </h4>
                    <div class="bg-white border-2 border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto">
                        ${lecture.content || 'لا يوجد محتوى'}
                    </div>
                </div>
                
                ${lecture.file_url ? `
                    <div>
                        <h4 class="font-bold mb-3 text-lg flex items-center">
                            <i class="fas fa-paperclip text-green-500 ml-2"></i>
                            المرفقات
                        </h4>
                        <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3 space-x-reverse">
                                    <i class="${getFileIcon(lecture.file_type)} text-2xl"></i>
                                    <div>
                                        <div class="font-medium">${lecture.file_name || 'ملف مرفق'}</div>
                                        ${lecture.file_size ? `<div class="text-sm text-gray-600">${(lecture.file_size / 1024 / 1024).toFixed(2)} MB</div>` : ''}
                                    </div>
                                </div>
                                <a href="${lecture.file_url}" target="_blank" 
                                   class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all">
                                    <i class="fas fa-external-link-alt ml-2"></i>فتح الملف
                                </a>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex justify-center space-x-3 space-x-reverse pt-6 border-t">
                    <button onclick="editLecture('${lecture.id}')" 
                            class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
                        <i class="fas fa-edit ml-2"></i>تعديل
                    </button>
                    <button onclick="toggleLectureComplete('${lecture.id}')" 
                            class="px-6 py-3 ${lecture.is_completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-all">
                        <i class="fas ${lecture.is_completed ? 'fa-undo' : 'fa-check'} ml-2"></i>
                        ${lecture.is_completed ? 'إلغاء الإكمال' : 'تمييز كمكتمل'}
                    </button>
                </div>
            </div>
        `);
        
    } catch (error) {
        console.error('Error showing lecture summary:', error);
        showNotification('فشل عرض تفاصيل المحاضرة', 'error');
    }
};

// Edit lecture function
window.editLecture = function(lectureId) {
    // Implementation for editing lectures
    showNotification('ميزة التعديل قيد التطوير', 'info');
};

// Delete subject
window.deleteSubject = async function(subjectId) {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع المحاضرات والملفات المرتبطة بها.')) {
        return;
    }
    
    try {
        showLoading();
        
        if (window.supabaseDB) {
            // Delete all lectures and their files for this subject
            const { data, error } = await window.supabaseDB.lectures.getBySubject(subjectId);
            if (error) throw error;
            const lectures = data || [];
            
            for (const lecture of lectures) {
                // Delete file from server if exists
                if (lecture.file && lecture.file.path) {
                    try {
                        const response = await fetch('/api/delete-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: lecture.file.path })
                        });
                        if (!response.ok) {
                            console.warn('Could not delete file from server:', response.statusText);
                        }
                    } catch (fileError) {
                        console.warn('Could not delete file from server:', fileError);
                    }
                }
                
                await window.supabaseDB.lectures.delete(lecture.id);
            }
            
            // Delete subject file if exists
            const subject = subjects.find(s => s.id === subjectId);
            if (subject && subject.file && subject.file.path) {
                try {
                    const response = await fetch('/api/delete-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: subject.file.path })
                    });
                    if (!response.ok) {
                        console.warn('Could not delete subject file from server:', response.statusText);
                    }
                } catch (fileError) {
                    console.warn('Could not delete subject file from server:', fileError);
                }
            }
            
            // Delete the subject
            await window.supabaseDB.subjects.delete(subjectId);
        } else {
            throw new Error('Supabase client not initialized. Please check your configuration.');
        }
        
        showNotification('تم حذف المادة وجميع محاضراتها بنجاح', 'success');
        loadSubjects();
        
    } catch (error) {
        console.error('Error deleting subject:', error);
        showNotification('فشل حذف المادة', 'error');
    } finally {
        hideLoading();
    }
};

// Edit subject function
window.editSubject = function(subjectId) {
    // Implementation for editing subjects
    showNotification('ميزة التعديل قيد التطوير', 'info');
};

// Update the loadSubjects function to call updateStatistics
const originalLoadSubjects = window.loadSubjects;
window.loadSubjects = async function() {
    await originalLoadSubjects();
    if (window.updateStatistics) {
        window.updateStatistics();
    }
};
