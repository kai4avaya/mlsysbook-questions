document.addEventListener('DOMContentLoaded', () => {
    const api = new APIService(CONFIG.API_URL);
    let hot;
    let allQuestions = [];
    let originalData = [];

    function setLoading(isLoading, message = '') {
        const refreshBtn = document.getElementById('refreshData');
        const downloadBtn = document.getElementById('downloadCSV');
        const container = document.getElementById('hot-container');
        const loader = document.getElementById('loader');
        const loaderText = document.querySelector('.loader-text');
        
        if (isLoading) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Loading...';
            downloadBtn.disabled = true;
            container.style.opacity = '0.6';
            loader.classList.add('visible');
            if (loaderText) {
                loaderText.textContent = message;
            }
        } else {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh Data';
            downloadBtn.disabled = false;
            container.style.opacity = '1';
            loader.classList.remove('visible');
        }
    }

    function showMessage(message, isError = false) {
        const errorContainer = document.getElementById('error-container');
        if (!errorContainer) return;

        errorContainer.textContent = message;
        errorContainer.classList.toggle('visible', true);
        errorContainer.classList.toggle('error', isError);
        errorContainer.classList.toggle('success', !isError);

        setTimeout(() => {
            errorContainer.classList.toggle('visible', false);
            errorContainer.classList.toggle('error', false);
            errorContainer.classList.toggle('success', false);
        }, 3000);
    }

    function filterData(searchTerm) {
        if (!searchTerm) {
            hot.loadData(originalData);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filteredData = originalData.filter(row => {
            return (
                row.question.toLowerCase().includes(searchTermLower) ||
                row.correctAnswer?.text.toLowerCase().includes(searchTermLower) ||
                row.wrongAnswer1?.text.toLowerCase().includes(searchTermLower) ||
                row.wrongAnswer2?.text.toLowerCase().includes(searchTermLower) ||
                row.wrongAnswer3?.text.toLowerCase().includes(searchTermLower) ||
                row.chapterId.toLowerCase().includes(searchTermLower) ||
                row.sectionId.toLowerCase().includes(searchTermLower) ||
                row.difficulty.toLowerCase().includes(searchTermLower)
            );
        });

        hot.loadData(filteredData);
    }

    async function processAllChapters(data) {
        const flattenedQuestions = [];
        
        data.forEach(chapter => {
            const chapterId = chapter.chapter_id;
            Object.entries(chapter.sections || {}).forEach(([sectionId, section]) => {
                Object.entries(section.difficulties || {}).forEach(([difficulty, difficultyData]) => {
                    (difficultyData.questions || []).forEach(question => {
                        // Split answers into correct and wrong answers
                        const correctAnswer = question.answers.find(a => a.correct);
                        const wrongAnswers = question.answers.filter(a => !a.correct);

                        flattenedQuestions.push({
                            id: question.id,
                            chapterId: chapterId,
                            sectionId: sectionId,
                            difficulty: difficulty,
                            question: question.question,
                            correctAnswer: correctAnswer,
                            wrongAnswer1: wrongAnswers[0] || null,
                            wrongAnswer2: wrongAnswers[1] || null,
                            wrongAnswer3: wrongAnswers[2] || null,
                            score: question.score || 0,
                            correctAttempts: question.correctAttempts || 0,
                            incorrectAttempts: question.incorrectAttempts || 0
                        });
                    });
                });
            });
        });
        
        return flattenedQuestions;
    }

    async function initializeTable() {
        setLoading(true, 'Loading questions...');
        try {
            const response = await fetch(`${CONFIG.API_URL}/chapters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({})
            });
            
            if (!response.ok) throw new Error(`Failed to fetch chapters: ${response.status} ${response.statusText}`);
            
            const data = await response.json();
            if (!data.success || !data.data) throw new Error('Invalid response format');
            
            const questions = await processAllChapters(data.data);
            if (!questions.length) throw new Error('No questions found in any chapter');
            
            const container = document.getElementById('hot-container');
            if (hot) {
                hot.destroy();
            }
            
            hot = new Handsontable(container, {
                ...CONFIG.HOT_SETTINGS,
                data: questions,
                columns: CONFIG.COLUMNS,
                height: window.innerHeight - 100
            });
            
            originalData = questions; // Store original data for filtering
            allQuestions = questions; // Store questions for CSV export
            setLoading(false);
            showMessage('Table initialized successfully');
        } catch (error) {
            console.error('Failed to initialize table:', error);
            setLoading(false);
            showMessage(`Failed to initialize table: ${error.message}`, true);
        }
    }

    function downloadCSV() {
        if (!hot || !allQuestions.length) {
            showMessage('No data available to download', true);
            return;
        }

        try {
            const exportPlugin = hot.getPlugin('exportFile');
            exportPlugin.downloadFile('csv', {
                filename: 'quiz_questions_' + new Date().toISOString().split('T')[0],
                columnHeaders: true,
                rowHeaders: true
            });
        } catch (error) {
            console.error('Failed to download CSV:', error);
            showMessage('Failed to download CSV. Please try again.', true);
        }
    }

    // Event Listeners
    document.getElementById('refreshData').addEventListener('click', initializeTable);
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterData(e.target.value.trim());
        }, 300); // Debounce search for better performance
    });

    // Initial load
    initializeTable();
}); 