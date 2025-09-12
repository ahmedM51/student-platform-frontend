// Show quiz results
function showQuizResults() {
    stopQuizTimer();
    
    if (!currentQuiz || !currentQuiz.questions) return;
    
    let correctAnswers = 0;
    const totalQuestions = currentQuiz.questions.length;
    
    // Calculate score
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (userAnswer === question.correctAnswer) {
            correctAnswers++;
        }
    });
    
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    
    const quizArea = document.getElementById('quizArea');
    if (!quizArea) return;
    
    let resultHTML = `
        <div class="quiz-results text-center">
            <div class="mb-6">
                <i class="fas fa-trophy text-6xl ${percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'} mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">نتائج الاختبار</h2>
                <p class="text-gray-600">${currentQuiz.title}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-100 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${correctAnswers}/${totalQuestions}</div>
                    <div class="text-sm text-blue-800">الإجابات الصحيحة</div>
                </div>
                <div class="bg-green-100 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${percentage}%</div>
                    <div class="text-sm text-green-800">النسبة المئوية</div>
                </div>
                <div class="bg-purple-100 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                    <div class="text-sm text-purple-800">الوقت المستغرق</div>
                </div>
            </div>
            
            <div class="mb-6">
                <div class="text-lg font-semibold mb-2">التقييم</div>
                <div class="text-${percentage >= 90 ? 'green' : percentage >= 70 ? 'blue' : percentage >= 50 ? 'yellow' : 'red'}-600 font-medium">
                    ${percentage >= 90 ? 'ممتاز! ' : 
                      percentage >= 70 ? 'جيد جداً! ' : 
                      percentage >= 50 ? 'جيد ' : 'يحتاج تحسين '}
                </div>
            </div>
            
            <div class="space-x-4">
                <button onclick="resetQuiz()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    اختبار جديد
                </button>
                <button onclick="reviewAnswers()" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                    مراجعة الإجابات
                </button>
            </div>
        </div>
    `;
    
    quizArea.innerHTML = resultHTML;
    
    // Show success notification
    showNotification(`تم إكمال الاختبار! النتيجة: ${percentage}%`, 'success');
}

// Reset quiz
function resetQuiz() {
    currentQuiz = null;
    currentQuestionIndex = 0;
    userAnswers = [];
    selectedLectureId = null;
    
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
        quizContainer.classList.add('hidden');
    }
    
    // Reset timer display
    const timerElement = document.getElementById('quizTimer');
    if (timerElement) {
        timerElement.textContent = '00:00';
    }
    
    stopQuizTimer();
}

// Review answers
function reviewAnswers() {
    if (!currentQuiz || !currentQuiz.questions) return;
    
    const quizArea = document.getElementById('quizArea');
    if (!quizArea) return;
    
    let reviewHTML = `
        <div class="quiz-review">
            <h2 class="text-xl font-bold mb-4">مراجعة الإجابات</h2>
    `;
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        
        reviewHTML += `
            <div class="mb-6 p-4 border rounded-lg ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                <div class="flex items-center mb-2">
                    <span class="font-medium">السؤال ${index + 1}:</span>
                    <i class="fas fa-${isCorrect ? 'check text-green-500' : 'times text-red-500'} mr-2"></i>
                </div>
                <p class="mb-3">${question.question}</p>
        `;
        
        if (question.type === 'multiple') {
            reviewHTML += '<div class="space-y-1">';
            question.options.forEach((option, optionIndex) => {
                const isUserAnswer = userAnswer === optionIndex;
                const isCorrectAnswer = question.correctAnswer === optionIndex;
                
                reviewHTML += `
                    <div class="p-2 rounded ${
                        isCorrectAnswer ? 'bg-green-100 text-green-800' : 
                        isUserAnswer && !isCorrectAnswer ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100'
                    }">
                        ${isUserAnswer ? '' : ''}${isCorrectAnswer ? '' : ''}${option}
                    </div>
                `;
            });
            reviewHTML += '</div>';
        } else {
            const correctText = question.correctAnswer ? 'صح' : 'خطأ';
            const userText = userAnswer ? 'صح' : 'خطأ';
            
            reviewHTML += `
                <div class="space-y-1">
                    <div class="p-2 rounded bg-green-100 text-green-800"> الإجابة الصحيحة: ${correctText}</div>
                    ${!isCorrect ? `<div class="p-2 rounded bg-red-100 text-red-800"> إجابتك: ${userText}</div>` : ''}
                </div>
            `;
        }
        
        reviewHTML += '</div>';
    });
    
    reviewHTML += `
            <div class="text-center mt-6">
                <button onclick="resetQuiz()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    العودة للبداية
                </button>
            </div>
        </div>
    `;
    
    quizArea.innerHTML = reviewHTML;
}

// Make functions globally available
window.handleLectureSelection = handleLectureSelection;
window.askQuestion = askQuestion;
window.generateQuiz = generateQuiz;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.resetQuiz = resetQuiz;
window.reviewAnswers = reviewAnswers;
window.logout = logout;

// Export for module usage
export {
    getGeminiResponse,
    loadLectures,
    generateQuiz,
    askQuestion,
    resetQuiz
};
