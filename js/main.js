document.addEventListener('DOMContentLoaded', () => {
    const api = new APIService(CONFIG.API_URL);
    let hot;
    let allQuestions = [];
    let originalData = [];
    const CHUNK_SIZE = 100;
    let currentChunk = 0;
    let isLoading = false;

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

    function getDataChunk(data, chunkIndex) {
        const start = chunkIndex * CHUNK_SIZE;
        return data.slice(start, start + CHUNK_SIZE);
    }

    function filterData(searchTerm) {
        if (!searchTerm) {
            currentChunk = 0;
            const initialChunk = getDataChunk(originalData, 0);
            hot.loadData(initialChunk);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filteredData = originalData.filter(row => {
            // Check every property in the row
            return Object.entries(row).some(([key, value]) => {
                // Handle nested objects (like answers)
                if (value && typeof value === 'object') {
                    // Search within text and explanation of answers
                    return (value.text?.toLowerCase().includes(searchTermLower) || 
                           value.explanation?.toLowerCase().includes(searchTermLower));
                }
                // Handle direct string/number values
                return String(value).toLowerCase().includes(searchTermLower);
            });
        });

        // When searching, show all results at once for better UX
        hot.loadData(filteredData);
    }

    function handleScroll(event) {
        if (!hot || isLoading) return;

        const target = event.target;
        const scrollPosition = target.scrollTop + target.clientHeight;
        const maxScroll = target.scrollHeight;
        const threshold = 200; // pixels from bottom

        if (maxScroll - scrollPosition < threshold) {
            isLoading = true;
            const nextChunk = getDataChunk(originalData, currentChunk + 1);
            
            if (nextChunk.length > 0) {
                currentChunk++;
                const currentData = hot.getData();
                hot.loadData([...currentData, ...nextChunk]);
            }
            
            setTimeout(() => {
                isLoading = false;
            }, 100);
        }
    }

    async function processAllChapters(data) {
        const flattenedQuestions = [];
        
        data.forEach(chapter => {
            const chapterId = chapter.chapter_id;
            Object.entries(chapter.sections || {}).forEach(([sectionId, section]) => {
                Object.entries(section.difficulties || {}).forEach(([difficulty, difficultyData]) => {
                    (difficultyData.questions || []).forEach(question => {
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

            originalData = questions; // Store complete dataset
            allQuestions = questions; // Store for CSV export
            currentChunk = 0;
            
            // Initialize with first chunk
            const initialChunk = getDataChunk(questions, 0);
            
            hot = new Handsontable(container, {
                ...CONFIG.HOT_SETTINGS,
                data: initialChunk,
                columns: CONFIG.COLUMNS,
                height: window.innerHeight - 100,
                afterRender: () => {
                    // Setup scroll handler after the table is fully rendered
                    const scrollElement = container.querySelector('.wtHolder');
                    if (scrollElement) {
                        scrollElement.removeEventListener('scroll', handleScroll);
                        scrollElement.addEventListener('scroll', handleScroll);
                    }
                }
            });
            
            setLoading(false);
            showMessage('Table initialized successfully', false);
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
            // Use allQuestions for CSV export to include all data
            const exportPlugin = hot.getPlugin('exportFile');
            const csvContent = exportPlugin.exportAsString('csv', {
                data: allQuestions,
                columnHeaders: true,
                rowHeaders: true
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'quiz_questions_' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
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
        }, 300);
    });

    // Initial load
    initializeTable();
}); 