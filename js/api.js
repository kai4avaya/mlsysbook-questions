class APIService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async getAllChapters() {
        try {
            const response = await fetch(`${this.baseUrl}/chapters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const chapters = data.data || [];
            
            // Process all chapters at once instead of making separate calls
            return this.processAllChapters(chapters);
        } catch (error) {
            console.error('Error fetching chapters:', error);
            throw new Error('Failed to fetch chapters. Please check your network connection and try again.');
        }
    }

    processAllChapters(chapters) {
        const allQuestions = [];
        
        chapters.forEach(chapter => {
            if (!chapter.sections) return;
            
            Object.entries(chapter.sections).forEach(([sectionId, sectionData]) => {
                if (!sectionData.difficulties) return;
                
                Object.entries(sectionData.difficulties).forEach(([difficulty, difficultyData]) => {
                    if (!difficultyData.questions) return;
                    
                    difficultyData.questions.forEach(question => {
                        allQuestions.push({
                            chapterId: chapter.chapter_id,
                            sectionId: sectionId,
                            difficulty: difficulty,
                            ...question
                        });
                    });
                });
            });
        });
        
        return allQuestions;
    }

    // Remove the getChapterQuestions method since we're processing all data at once
} 