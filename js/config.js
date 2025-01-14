const CONFIG = {
    API_URL: 'https://llm-edge-worker.duckai.workers.dev',
    COLUMNS: [
        { 
            data: 'chapterId', 
            title: 'Chapter', 
            readOnly: true, 
            width: 100 
        },
        { 
            data: 'sectionId', 
            title: 'Section', 
            readOnly: true, 
            width: 100 
        },
        { 
            data: 'question',
            title: 'Question',
            readOnly: true,
            width: 300,
            renderer: 'html'
        },
        { 
            data: 'difficulty', 
            title: 'Difficulty', 
            readOnly: true, 
            width: 100 
        },
        {
            data: 'correctAnswer',
            title: 'Correct Answer',
            readOnly: true,
            width: 200,
            renderer: function(instance, td, row, col, prop, value) {
                if (!value) {
                    td.innerHTML = '';
                    return td;
                }
                td.innerHTML = `<div style="padding: 5px;">
                    <div>${value.text}</div>
                    ${value.explanation ? 
                        `<div style="color: var(--explanation-color); font-size: 0.9em; margin-top: 4px;">
                            → ${value.explanation}
                        </div>` 
                        : ''
                    }
                </div>`;
                return td;
            }
        },
        {
            data: 'wrongAnswer1',
            title: 'Wrong Choice 1',
            readOnly: true,
            width: 200,
            renderer: function(instance, td, row, col, prop, value) {
                if (!value) {
                    td.innerHTML = '';
                    return td;
                }
                td.innerHTML = `<div style="padding: 5px;">
                    <div>${value.text}</div>
                    ${value.explanation ? 
                        `<div style="color: var(--explanation-color); font-size: 0.9em; margin-top: 4px;">
                            → ${value.explanation}
                        </div>` 
                        : ''
                    }
                </div>`;
                return td;
            }
        },
        {
            data: 'wrongAnswer2',
            title: 'Wrong Choice 2',
            readOnly: true,
            width: 200,
            renderer: function(instance, td, row, col, prop, value) {
                if (!value) {
                    td.innerHTML = '';
                    return td;
                }
                td.innerHTML = `<div style="padding: 5px;">
                    <div>${value.text}</div>
                    ${value.explanation ? 
                        `<div style="color: var(--explanation-color); font-size: 0.9em; margin-top: 4px;">
                            → ${value.explanation}
                        </div>` 
                        : ''
                    }
                </div>`;
                return td;
            }
        },
        {
            data: 'wrongAnswer3',
            title: 'Wrong Choice 3',
            readOnly: true,
            width: 200,
            renderer: function(instance, td, row, col, prop, value) {
                if (!value) {
                    td.innerHTML = '';
                    return td;
                }
                td.innerHTML = `<div style="padding: 5px;">
                    <div>${value.text}</div>
                    ${value.explanation ? 
                        `<div style="color: var(--explanation-color); font-size: 0.9em; margin-top: 4px;">
                            → ${value.explanation}
                        </div>` 
                        : ''
                    }
                </div>`;
                return td;
            }
        },
        { 
            data: 'score', 
            title: 'Rating', 
            readOnly: true, 
            width: 80,
            type: 'numeric'
        },
        { 
            data: 'correctAttempts', 
            title: 'Correct', 
            readOnly: true, 
            width: 80,
            type: 'numeric'
        },
        { 
            data: 'incorrectAttempts', 
            title: 'Incorrect', 
            readOnly: true, 
            width: 80,
            type: 'numeric'
        },
        { 
            data: 'id', 
            title: 'ID', 
            readOnly: true, 
            width: 150 
        }
    ],
    HOT_SETTINGS: {
        licenseKey: 'non-commercial-and-evaluation',
        height: 'auto',
        width: '100%',
        rowHeaders: true,
        colHeaders: true,
        filters: true,
        dropdownMenu: true,
        multiColumnSorting: true,
        autoColumnSize: false,
        manualColumnResize: true,
        manualRowResize: true,
        contextMenu: true,
        stretchH: 'all',
        wordWrap: true,
        rowHeights: 150,
        className: 'htMiddle'
    }
}; 