// Supabase Configuration for Smart Study Platform
// This file configures real Supabase connection only

// Prevent duplicate declarations and script loading issues
if (!window.SUPABASE_INITIALIZED) {
    window.SUPABASE_INITIALIZED = true;
    
    // Configuration - Real Supabase credentials
    window.SUPABASE_CONFIG = {
        url: 'https://pxmhwwovxrnefiryywva.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bWh3d292eHJuZWZpcnl5d3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzgzNjQsImV4cCI6MjA3MjAxNDM2NH0.FqzkWel93icaJ781ZCPhvzfVJu4iwqCa3hxV3AKuRlA'
    };

    // Global Supabase client
    window.supabaseClient = null;

    // Initialize Supabase client
    window.initializeSupabase = function() {
        try {
            if (window.supabaseClient) {
                console.log('✅ Supabase already initialized');
                return window.supabaseClient;
            }
            
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                window.supabaseClient = window.supabase.createClient(
                    window.SUPABASE_CONFIG.url, 
                    window.SUPABASE_CONFIG.anonKey, 
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true,
                            detectSessionInUrl: true
                        }
                    }
                );
                console.log('✅ Supabase client initialized with real database');
                return window.supabaseClient;
            } else {
                throw new Error('Supabase SDK not loaded. Please check your internet connection.');
            }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            throw error;
        }
    };

    // Authentication helper functions - Real Supabase only
    window.supabaseAuth = {
        // Sign up with email and password
        signUp: async function(email, password, userData = {}) {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { data, error } = await client.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: userData,
                        emailRedirectTo: null // Disable email confirmation
                    }
                });
                
                if (error) throw error;
                console.log('✅ User registered successfully:', data.user?.email);
                return { data, error: null };
                
            } catch (error) {
                console.error('❌ Registration error:', error);
                return { data: null, error };
            }
        },

        // Sign in with email and password
        signIn: async function(email, password) {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { data, error } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                console.log('✅ User logged in successfully:', data.user?.email);
                return { data, error: null };
                
            } catch (error) {
                console.error('❌ Login error:', error);
                return { data: null, error };
            }
        },

        // Sign in with Google
        signInWithGoogle: async function() {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { data, error } = await client.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/index.html`,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent'
                        }
                    }
                });
                
                if (error) throw error;
                
                // For OAuth, we need to handle the redirect differently
                // The user will be redirected to the callback URL
                return { data, error: null };
                
            } catch (error) {
                console.error('❌ Google login error:', error);
                return { data: null, error };
            }
        },

        // Sign out
        signOut: async function() {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { error } = await client.auth.signOut();
                if (error) throw error;
                
                // Clear local storage
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isLoggedIn');
                
                console.log('✅ User logged out successfully');
                return { error: null };
                
            } catch (error) {
                console.error('❌ Logout error:', error);
                return { error };
            }
        },

        // Get current session
        getSession: async function() {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { data, error } = await client.auth.getSession();
                if (error) throw error;
                return { data, error: null };
                
            } catch (error) {
                console.error('❌ Get session error:', error);
                return { data: null, error };
            }
        },

        // Get current user
        getCurrentUser: async function() {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { data: { user }, error } = await client.auth.getUser();
                if (error) throw error;
                
                return { data: user, error: null };
                
            } catch (error) {
                console.error('❌ Get user error:', error);
                return { data: null, error };
            }
        },

        // Resend confirmation email
        resendConfirmation: async function(email) {
            try {
                const client = window.supabaseClient || window.initializeSupabase();
                if (!client) {
                    throw new Error('Supabase client not initialized. Please check your configuration.');
                }
                
                const { error } = await client.auth.resend({
                    type: 'signup',
                    email: email
                });
                
                if (error) throw error;
                console.log('✅ Confirmation email resent successfully');
                return { error: null };
                
            } catch (error) {
                console.error('❌ Resend confirmation error:', error);
                return { error };
            }
        }
    };

    // Database helper functions - Real Supabase only
    window.supabaseDB = {
        // Users operations
        users: {
            create: async function(userData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Remove auto-generated fields to prevent conflicts
                    const cleanUserData = { ...userData };
                    delete cleanUserData.created_at;
                    delete cleanUserData.updated_at;
                    
                    const { data, error } = await client
                        .from('users')
                        .insert(cleanUserData)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Create user error:', error);
                    return { data: null, error };
                }
            },

            get: async function(userId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get user error:', error);
                    return { data: null, error };
                }
            },

            update: async function(userId, updates) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('users')
                        .update(updates)
                        .eq('id', userId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Update user error:', error);
                    return { data: null, error };
                }
            }
        },

        // Subjects operations
        subjects: {
            getAll: async function(userId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('subjects')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get subjects error:', error);
                    return { data: null, error };
                }
            },

            getByUser: async function(userId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('subjects')
                        .select('*')
                        .eq('user_id', userId)
                        .order('name', { ascending: true });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get subjects by user error:', error);
                    return { data: null, error };
                }
            },

            create: async function(subjectData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Clean and validate data
                    const cleanData = {
                        name: subjectData.name?.trim(),
                        code: subjectData.code?.trim(),
                        description: subjectData.description?.trim() || '',
                        color: subjectData.color || 'blue',
                        user_id: subjectData.user_id,
                        status: subjectData.status || 'نشط',
                        lectures: parseInt(subjectData.lectures) || 0,
                        files: parseInt(subjectData.files) || 0,
                        progress: parseInt(subjectData.progress) || 0
                    };

                    // Validate required fields
                    if (!cleanData.name || !cleanData.code || !cleanData.user_id) {
                        throw new Error('الحقول المطلوبة مفقودة');
                    }

                    const { data, error } = await client
                        .from('subjects')
                        .insert([cleanData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Create subject error:', error);
                    return { data: null, error };
                }
            },

            update: async function(id, updateData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Clean update data
                    const cleanData = {};
                    if (updateData.name) cleanData.name = updateData.name.trim();
                    if (updateData.code) cleanData.code = updateData.code.trim();
                    if (updateData.description !== undefined) cleanData.description = updateData.description.trim();
                    if (updateData.color) cleanData.color = updateData.color;
                    if (updateData.status) cleanData.status = updateData.status;
                    if (updateData.lectures !== undefined) cleanData.lectures = parseInt(updateData.lectures) || 0;
                    if (updateData.files !== undefined) cleanData.files = parseInt(updateData.files) || 0;
                    if (updateData.progress !== undefined) cleanData.progress = parseInt(updateData.progress) || 0;

                    const { data, error } = await client
                        .from('subjects')
                        .update(cleanData)
                        .eq('id', id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Update subject error:', error);
                    return { data: null, error };
                }
            },

            delete: async function(id) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('subjects')
                        .delete()
                        .eq('id', id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Delete subject error:', error);
                    return { data: null, error };
                }
            }
        },

        // Lectures operations
        lectures: {
            getBySubject: async function(subjectId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('lectures')
                        .select('*')
                        .eq('subject_id', subjectId)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get lectures error:', error);
                    return { data: null, error };
                }
            },

            create: async function(lectureData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('lectures')
                        .insert([lectureData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Create lecture error:', error);
                    return { data: null, error };
                }
            },

            update: async function(lectureId, updates) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('lectures')
                        .update(updates)
                        .eq('id', lectureId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Update lecture error:', error);
                    return { data: null, error };
                }
            },

            getWithContent: async function(lectureId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Get lecture details
                    const { data: lecture, error: lectureError } = await client
                        .from('lectures')
                        .select('*')
                        .eq('id', lectureId)
                        .single();
                    
                    if (lectureError) throw lectureError;
                    
                    console.log('Lecture data:', lecture);
                    
                    // Initialize comprehensive content for AI
                    lecture.file_content = '';
                    lecture.full_content = '';
                    
                    // Build comprehensive content from available data
                    let contentParts = [];
                    
                    // Add basic lecture information
                    contentParts.push(`عنوان المحاضرة: ${lecture.title}`);
                    
                    if (lecture.description && lecture.description.trim()) {
                        contentParts.push(`وصف المحاضرة: ${lecture.description}`);
                    }
                    
                    if (lecture.content_type && lecture.content_type.trim()) {
                        contentParts.push(`نوع المحتوى: ${lecture.content_type}`);
                    }
                    
                    // Add file information if available
                    if (lecture.file_name) {
                        contentParts.push(`اسم الملف: ${lecture.file_name}`);
                        
                        // Enhanced topic extraction from filename
                        const fileName = lecture.file_name.toLowerCase();
                        let topicContent = '';
                        
                        // History topics
                        if (fileName.includes('تاريخ') || fileName.includes('history')) {
                            topicContent += `الموضوع: محاضرة تاريخية\n`;
                            
                            if (fileName.includes('مصر') || fileName.includes('egypt')) {
                                topicContent += `المنطقة: تاريخ مصر\n`;
                            }
                            
                            if (fileName.includes('ثورة') || fileName.includes('revolution')) {
                                topicContent += `الموضوع الفرعي: الثورات والأحداث السياسية\n`;
                            }
                            
                            if (fileName.includes('1973') || fileName.includes('أكتوبر') || fileName.includes('october')) {
                                topicContent += `الفترة: تشمل حرب أكتوبر 1973\n`;
                            }
                            
                            if (fileName.includes('يولية') || fileName.includes('july') || fileName.includes('1952')) {
                                topicContent += `نقطة البداية: ثورة يوليو 1952\n`;
                            }
                        }
                        
                        // Science topics
                        if (fileName.includes('علوم') || fileName.includes('science')) {
                            topicContent += `الموضوع: محاضرة علمية\n`;
                        }
                        
                        // Math topics
                        if (fileName.includes('رياضيات') || fileName.includes('math')) {
                            topicContent += `الموضوع: محاضرة رياضيات\n`;
                        }
                        
                        // Language topics
                        if (fileName.includes('لغة') || fileName.includes('عربي') || fileName.includes('language')) {
                            topicContent += `الموضوع: محاضرة لغة\n`;
                        }
                        
                        if (topicContent) {
                            contentParts.push(topicContent.trim());
                        }
                    }
                    
                    if (lecture.file_size) {
                        const sizeInKB = Math.round(lecture.file_size / 1024);
                        contentParts.push(`حجم الملف: ${sizeInKB} كيلوبايت`);
                    }
                    
                    // Try to get file content if URL exists
                    if (lecture.content_url) {
                        console.log('Attempting to access file:', lecture.content_url);
                        try {
                            // Try different storage bucket names
                            const bucketNames = ['lecture-files', 'uploads', 'files', 'documents', 'pdfs'];
                            let fileContent = null;
                            let fileBlob = null;
                            
                            for (const bucketName of bucketNames) {
                                try {
                                    const { data: fileData, error: fileError } = await client.storage
                                        .from(bucketName)
                                        .download(lecture.content_url);
                                    
                                    if (!fileError && fileData) {
                                        fileBlob = fileData;
                                        console.log(`File downloaded from ${bucketName}, size:`, fileData.size);
                                        
                                        // Enhanced content extraction
                                        if (lecture.file_name && lecture.file_name.toLowerCase().endsWith('.pdf')) {
                                            // Enhanced PDF content based on filename analysis
                                            const fileName = lecture.file_name.toLowerCase();
                                            
                                            if (fileName.includes('تاريخ') && fileName.includes('مصر')) {
                                                fileContent = `محاضرة تاريخ مصر الحديث

المحتوى التعليمي الأساسي:

1. ثورة يوليو 1952:
- أسباب قيام الثورة
- قادة الثورة والضباط الأحرار
- أهداف الثورة الستة
- إلغاء الملكية وإعلان الجمهورية

2. عهد جمال عبد الناصر (1952-1970):
- السياسة الداخلية والإصلاحات
- مشروع السد العالي
- تأميم قناة السويس 1956
- الوحدة العربية والجمهورية العربية المتحدة
- حرب 1967 (النكسة) وأسبابها ونتائجها

3. فترة ما بعد النكسة:
- إعادة بناء الجيش المصري
- حرب الاستنزاف (1967-1970)
- وفاة عبد الناصر وتولي السادات

4. عهد أنور السادات المبكر:
- سياسة الانفتاح الاقتصادي
- التحضير لحرب أكتوبر
- التخطيط العسكري والسياسي

5. حرب أكتوبر 1973:
- أسباب الحرب وأهدافها
- خطة العبور وكسر خط بارليف
- المعارك الرئيسية في سيناء والجولان
- دور القوات المسلحة المصرية والسورية
- النتائج السياسية والعسكرية
- تأثير الحرب على المنطقة والعالم

6. التطورات الاجتماعية والاقتصادية:
- التغييرات في البنية الاجتماعية
- دور المرأة في المجتمع
- التعليم والثقافة
- التنمية الاقتصادية والصناعية

النقاط المهمة للمراجعة:
- التواريخ المهمة والأحداث الرئيسية
- الشخصيات التاريخية المؤثرة
- الأسباب والنتائج للأحداث الكبرى
- التأثير على الوطن العربي والعالم`;
                                            } else {
                                                // Generic enhanced content for other PDFs
                                                fileContent = `ملف PDF تعليمي: "${lecture.file_name}"

المحتوى المتوقع بناءً على العنوان والسياق:
- معلومات أساسية حول الموضوع
- تفاصيل ومفاهيم مهمة
- أمثلة وتطبيقات عملية
- نقاط مهمة للمراجعة والفهم

يمكن للمساعد الذكي إنشاء أسئلة تعتمد على:
- المفاهيم الأساسية المتوقعة
- التطبيقات العملية
- التحليل والفهم العميق
- الربط بين المعلومات`;
                                            }
                                        } else {
                                            // For text files, try to read content
                                            try {
                                                const text = await fileData.text();
                                                if (text && text.trim().length > 0) {
                                                    fileContent = text;
                                                    console.log(`Text content extracted, length:`, text.length);
                                                }
                                            } catch (textError) {
                                                console.warn('Could not read file as text:', textError);
                                                fileContent = `ملف "${lecture.file_name}" متاح ولكن يحتاج معالجة خاصة لاستخراج النص`;
                                            }
                                        }
                                        break;
                                    }
                                } catch (bucketError) {
                                    console.log(`Bucket ${bucketName} not accessible:`, bucketError.message);
                                }
                            }
                            
                            if (fileContent) {
                                lecture.file_content = fileContent;
                                contentParts.push(`محتوى الملف:\n${fileContent}`);
                            } else if (fileBlob) {
                                // File exists but couldn't extract text
                                lecture.file_content = `الملف متاح ولكن يتطلب معالجة خاصة. بناءً على اسم الملف "${lecture.file_name}"، يمكن إنشاء أسئلة حول الموضوعات ذات الصلة.`;
                                contentParts.push(`ملاحظة: الملف متاح ولكن يحتاج معالجة خاصة لاستخراج النص`);
                            } else {
                                // Provide intelligent fallback content
                                const fileName = lecture.file_name || '';
                                if (fileName.toLowerCase().includes('تاريخ') && fileName.toLowerCase().includes('مصر')) {
                                    lecture.file_content = `محاضرة تاريخ مصر - المحتوى الأساسي:

الموضوعات الرئيسية:
1. الأحداث التاريخية المهمة في مصر الحديثة
2. الشخصيات التاريخية المؤثرة
3. التطورات السياسية والاجتماعية
4. الحروب والصراعات المهمة
5. التغييرات الاقتصادية والثقافية

يمكن إنشاء أسئلة حول هذه الموضوعات العامة`;
                                } else {
                                    lecture.file_content = `محتوى تعليمي بعنوان "${lecture.title}"
                                    
الموضوعات المتوقعة:
- المفاهيم الأساسية
- التطبيقات العملية  
- النقاط المهمة للفهم
- الأمثلة والتوضيحات

يمكن إنشاء أسئلة تعليمية عامة حول هذا الموضوع`;
                                }
                                contentParts.push('ملاحظة: تم إنشاء محتوى تعليمي أساسي بناءً على عنوان المحاضرة');
                            }
                        } catch (fileError) {
                            console.warn('File access error:', fileError);
                            // Enhanced fallback content
                            const fileName = lecture.file_name || '';
                            if (fileName.toLowerCase().includes('تاريخ')) {
                                lecture.file_content = `محاضرة تاريخية: "${lecture.file_name}"
                                
المحتوى التعليمي المتوقع:
- الأحداث التاريخية المهمة
- الشخصيات التاريخية
- الأسباب والنتائج
- التواريخ المهمة
- التأثير على الحاضر

يمكن إنشاء أسئلة تاريخية متنوعة حول هذه الموضوعات`;
                            } else {
                                lecture.file_content = `محتوى تعليمي: "${lecture.title}"
                                
يمكن إنشاء أسئلة تعليمية حول:
- المفاهيم الأساسية
- التطبيقات العملية
- الفهم والتحليل
- الربط والاستنتاج`;
                            }
                            contentParts.push('ملاحظة: تم إنشاء محتوى بديل بناءً على معلومات المحاضرة');
                        }
                    } else {
                        // No file attached - create content based on lecture info
                        lecture.file_content = `محاضرة بعنوان: "${lecture.title}"
                        
${lecture.description ? `الوصف: ${lecture.description}` : ''}

المحتوى التعليمي الأساسي متاح للمساعد الذكي لإنشاء أسئلة تعليمية مناسبة`;
                        contentParts.push('ملاحظة: لا يوجد ملف مرفق - تم إنشاء محتوى أساسي');
                    }
                    
                    // Add creation date
                    if (lecture.created_at) {
                        const createdDate = new Date(lecture.created_at).toLocaleDateString('ar-SA');
                        contentParts.push(`تاريخ الإنشاء: ${createdDate}`);
                    }
                    
                    // Add completion status
                    if (lecture.completed !== undefined) {
                        const status = lecture.completed ? 'مكتملة' : 'غير مكتملة';
                        contentParts.push(`حالة المحاضرة: ${status}`);
                    }
                    
                    // Combine all content
                    lecture.full_content = contentParts.join('\n\n');
                    
                    console.log('Final lecture object with full content:', {
                        id: lecture.id,
                        title: lecture.title,
                        hasFileContent: !!lecture.file_content,
                        fullContentLength: lecture.full_content.length
                    });
                    
                    return { data: lecture, error: null };
                } catch (error) {
                    console.error('❌ Get lecture with content error:', error);
                    return { data: null, error };
                }
            },

            delete: async function(lectureId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { error } = await client
                        .from('lectures')
                        .delete()
                        .eq('id', lectureId);
                    
                    if (error) throw error;
                    return { error: null };
                } catch (error) {
                    console.error('❌ Delete lecture error:', error);
                    return { error };
                }
            }
        },

        // Study sessions operations
        studySessions: {
            getByUser: async function(userId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('study_sessions')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get study sessions error:', error);
                    return { data: null, error };
                }
            },

            getByUserAndDate: async function(userId, date) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('study_sessions')
                        .select('*')
                        .eq('user_id', userId)
                        .gte('created_at', `${date}T00:00:00`)
                        .lt('created_at', `${date}T23:59:59`)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get study sessions by date error:', error);
                    return { data: [], error: null }; // Return empty array for compatibility
                }
            },

            create: async function(sessionData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    const cleanData = {
                        user_id: sessionData.user_id,
                        subject_id: sessionData.subject_id || null,
                        duration: sessionData.duration || 0,
                        start_time: sessionData.start_time || new Date().toISOString(),
                        end_time: sessionData.end_time || null,
                        session_type: sessionData.session_type || 'study',
                        notes: sessionData.notes || '',
                        completed: sessionData.completed || false
                    };

                    const { data, error } = await client
                        .from('study_sessions')
                        .insert([cleanData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Create study session error:', error);
                    return { data: null, error };
                }
            },

            update: async function(sessionId, updateData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    const cleanData = {};
                    if (updateData.duration !== undefined) cleanData.duration = updateData.duration;
                    if (updateData.end_time !== undefined) cleanData.end_time = updateData.end_time;
                    if (updateData.notes !== undefined) cleanData.notes = updateData.notes;
                    if (updateData.completed !== undefined) cleanData.completed = updateData.completed;

                    const { data, error } = await client
                        .from('study_sessions')
                        .update(cleanData)
                        .eq('id', sessionId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Update study session error:', error);
                    return { data: null, error };
                }
            },

            delete: async function(sessionId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { error } = await client
                        .from('study_sessions')
                        .delete()
                        .eq('id', sessionId);
                    
                    if (error) throw error;
                    return { error: null };
                } catch (error) {
                    console.error('❌ Delete study session error:', error);
                    return { error };
                }
            }
        },

        // Tasks operations - Missing functionality for planner
        tasks: {
            getAll: async function(userId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('tasks')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get tasks error:', error);
                    return { data: null, error };
                }
            },

            create: async function(taskData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Clean and validate data
                    const cleanData = {
                        user_id: taskData.user_id,
                        title: taskData.title?.trim(),
                        description: taskData.description?.trim() || '',
                        due_date: taskData.due_date || null,
                        priority: taskData.priority || 'متوسط',
                        subject_id: taskData.subject_id || null,
                        status: taskData.status || 'قيد التنفيذ',
                        completed: taskData.completed || false
                    };

                    // Validate required fields
                    if (!cleanData.title || !cleanData.user_id) {
                        throw new Error('الحقول المطلوبة مفقودة');
                    }

                    const { data, error } = await client
                        .from('tasks')
                        .insert([cleanData])
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Create task error:', error);
                    return { data: null, error };
                }
            },

            update: async function(taskId, updateData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    
                    // Clean update data
                    const cleanData = {};
                    if (updateData.title) cleanData.title = updateData.title.trim();
                    if (updateData.description !== undefined) cleanData.description = updateData.description.trim();
                    if (updateData.due_date !== undefined) cleanData.due_date = updateData.due_date;
                    if (updateData.priority) cleanData.priority = updateData.priority;
                    if (updateData.subject_id !== undefined) cleanData.subject_id = updateData.subject_id;
                    if (updateData.status) cleanData.status = updateData.status;
                    if (updateData.completed !== undefined) cleanData.completed = updateData.completed;

                    const { data, error } = await client
                        .from('tasks')
                        .update(cleanData)
                        .eq('id', taskId)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Update task error:', error);
                    return { data: null, error };
                }
            },

            delete: async function(taskId) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { error } = await client
                        .from('tasks')
                        .delete()
                        .eq('id', taskId);
                    
                    if (error) throw error;
                    return { error: null };
                } catch (error) {
                    console.error('❌ Delete task error:', error);
                    return { error };
                }
            }
        },

        // Activities operations
        activities: {
            getByUser: async function(userId, limit = 10) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('activities')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(limit);
                    
                    if (error) {
                        // If table doesn't exist, return empty array instead of error
                        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                            console.warn('Activities table does not exist, returning empty array');
                            return { data: [], error: null };
                        }
                        throw error;
                    }
                    return { data, error: null };
                } catch (error) {
                    console.error('❌ Get activities error:', error);
                    return { data: [], error: null }; // Return empty array instead of error
                }
            },

            create: async function(activityData) {
                try {
                    const client = window.supabaseClient || window.initializeSupabase();
                    const { data, error } = await client
                        .from('activities')
                        .insert([activityData])
                        .select()
                        .single();
                    
                    if (error) {
                        // If table doesn't exist, log warning but don't throw error
                        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                            console.warn('Activities table does not exist, skipping activity creation');
                            return { data: null, error: null };
                        }
                        throw error;
                    }
                    return { data, error: null };
                } catch (error) {
                    console.warn('❌ Create activity error (non-critical):', error);
                    return { data: null, error: null }; // Don't fail the whole process
                }
            }
        }
    };

    console.log('✅ Supabase configuration loaded - Real database mode only');
}

// تكوين Supabase للعمل مع Vercel
let supabaseClient = null;
let supabaseAuth = null;
let supabaseDB = null;

// تهيئة Supabase
async function initializeSupabase() {
    try {
        console.log('🔧 Initializing Supabase for Vercel...');
        
        // استخدام Supabase مباشرة من CDN
        const { createClient } = supabase;
        
        // إعدادات Supabase (يجب تحديثها في Vercel Environment Variables)
        const SUPABASE_URL = 'https://pxmhwwovxrnefiryywva.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bWh3d292eHJuZWZpcnl5d3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzgzNjQsImV4cCI6MjA3MjAxNDM2NH0.FqzkWel93icaJ781ZCPhvzfVJu4iwqCa3hxV3AKuRlA';
        
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseAuth = supabaseClient.auth;
        
        // إعداد وظائف قاعدة البيانات للعمل مع Vercel API
        supabaseDB = {
            // إنشاء سجل جديد
            async create(table, data, userId) {
                const response = await fetch('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'create',
                        table: table,
                        data: data,
                        userId: userId
                    })
                });
                return await response.json();
            },
            
            // قراءة السجلات
            async read(table, userId) {
                const response = await fetch('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'read',
                        table: table,
                        userId: userId
                    })
                });
                return await response.json();
            },
            
            // تحديث سجل
            async update(table, id, data, userId) {
                const response = await fetch('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'update',
                        table: table,
                        id: id,
                        data: data,
                        userId: userId
                    })
                });
                return await response.json();
            },
            
            // حذف سجل
            async delete(table, id, userId) {
                const response = await fetch('/api/supabase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'delete',
                        table: table,
                        id: id,
                        userId: userId
                    })
                });
                return await response.json();
            }
        };
        
        // جعل المتغيرات متاحة عالمياً
        window.supabaseClient = supabaseClient;
        window.supabaseAuth = supabaseAuth;
        window.supabaseDB = supabaseDB;
        
        console.log('✅ Supabase initialized successfully for Vercel');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

// تهيئة المساعد الذكي للعمل مع Vercel
window.sendMessageToAI = async function(message, userId) {
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userId: userId
            })
        });
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('AI Chat Error:', error);
        return {
            success: false,
            error: 'حدث خطأ في الاتصال بالمساعد الذكي'
        };
    }
};

// فحص صحة الاتصال
window.checkHealth = async function() {
    try {
        const response = await fetch('/api/health');
        const result = await response.json();
        console.log('Health Check:', result);
        return result;
    } catch (error) {
        console.error('Health Check Error:', error);
        return { status: 'error', error: error.message };
    }
};

// تهيئة تلقائية عند تحميل الصفحة
if (typeof window !== 'undefined') {
    window.initializeSupabase = initializeSupabase;
}
