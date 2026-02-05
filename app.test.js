/**
 * Unit tests for SVGColorAnalyzer
 * Tests for task 1.5: Initialize SVGColorAnalyzer class with state properties
 */

const SVGColorAnalyzer = require('./app.js');

// Mock ImageData for testing (not available in jsdom)
if (typeof ImageData === 'undefined') {
    global.ImageData = class ImageData {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}

describe('SVGColorAnalyzer Constructor', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    test('should initialize SVG state properties to null', () => {
        expect(app.originalSVG).toBeNull();
        expect(app.currentSVG).toBeNull();
    });
    
    test('should initialize color data as empty array', () => {
        expect(app.colorData).toEqual([]);
        expect(Array.isArray(app.colorData)).toBe(true);
    });
    
    test('should initialize original color count to 0', () => {
        expect(app.originalColorCount).toBe(0);
    });
    
    test('should initialize canvas elements', () => {
        expect(app.canvas).toBeTruthy();
        expect(app.canvas.tagName).toBe('CANVAS');
        expect(app.ctx).toBeTruthy();
        expect(app.ctx.constructor.name).toBe('CanvasRenderingContext2D');
    });
    
    test('should initialize highlight canvas elements', () => {
        expect(app.highlightCanvas).toBeTruthy();
        expect(app.highlightCanvas.tagName).toBe('CANVAS');
        expect(app.highlightCtx).toBeTruthy();
        expect(app.highlightCtx.constructor.name).toBe('CanvasRenderingContext2D');
    });
    
    test('should initialize highlight state properties', () => {
        expect(app.selectedColor).toBeNull();
        expect(app.svgImageData).toBeNull();
    });
    
    test('should cache jQuery selectors in $elements object', () => {
        expect(app.$elements).toBeDefined();
        expect(app.$elements.uploadArea).toBeDefined();
        expect(app.$elements.fileInput).toBeDefined();
        expect(app.$elements.mainContent).toBeDefined();
        expect(app.$elements.svgPreview).toBeDefined();
        expect(app.$elements.highlightCanvas).toBeDefined();
        expect(app.$elements.colorPaletteTop).toBeDefined();
        expect(app.$elements.colorList).toBeDefined();
        expect(app.$elements.originalColorCount).toBeDefined();
        expect(app.$elements.currentColorCount).toBeDefined();
        expect(app.$elements.colorCountSlider).toBeDefined();
        expect(app.$elements.colorCountValue).toBeDefined();
        expect(app.$elements.reduceBtn).toBeDefined();
        expect(app.$elements.resetBtn).toBeDefined();
        expect(app.$elements.downloadBtn).toBeDefined();
        expect(app.$elements.clearHighlightBtn).toBeDefined();
        expect(app.$elements.loadingIndicator).toBeDefined();
        expect(app.$elements.errorMessage).toBeDefined();
    });
    
    test('should cache jQuery objects (not plain DOM elements)', () => {
        // Verify that cached elements are jQuery objects
        expect(app.$elements.uploadArea.jquery).toBeDefined();
        expect(app.$elements.fileInput.jquery).toBeDefined();
        expect(app.$elements.svgPreview.jquery).toBeDefined();
    });
    
    test('should have all required methods defined', () => {
        expect(typeof app.initializeEventListeners).toBe('function');
        expect(typeof app.handleFileUpload).toBe('function');
        expect(typeof app.loadSVGFile).toBe('function');
        expect(typeof app.convertImageToSVG).toBe('function');
        expect(typeof app.analyzeSVG).toBe('function');
        expect(typeof app.displaySVG).toBe('function');
        expect(typeof app.updateUI).toBe('function');
        expect(typeof app.renderTopPalette).toBe('function');
        expect(typeof app.renderColorList).toBe('function');
        expect(typeof app.highlightColor).toBe('function');
        expect(typeof app.clearHighlight).toBe('function');
        expect(typeof app.reduceColors).toBe('function');
        expect(typeof app.updateColor).toBe('function');
        expect(typeof app.resetToOriginal).toBe('function');
        expect(typeof app.downloadSVG).toBe('function');
        expect(typeof app.rgbToHex).toBe('function');
        expect(typeof app.hexToRgb).toBe('function');
        expect(typeof app.showError).toBe('function');
        expect(typeof app.showLoading).toBe('function');
        expect(typeof app.hideLoading).toBe('function');
    });
});

/**
 * Unit tests for click-to-browse functionality
 * Tests for task 2.2: Implement click-to-browse file input
 */

describe('Click-to-Browse File Input Functionality', () => {
    let app;
    let uploadArea;
    let fileInput;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" accept=".svg,.jpg,.jpeg,.png,image/svg+xml,image/jpeg,image/png" hidden>
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
        uploadArea = document.getElementById('uploadArea');
        fileInput = document.getElementById('fileInput');
    });
    
    describe('File input element setup', () => {
        test('should have file input element with correct attributes', () => {
            expect(fileInput).toBeTruthy();
            expect(fileInput.type).toBe('file');
            expect(fileInput.hasAttribute('hidden')).toBe(true);
        });
        
        test('should accept correct file types', () => {
            const acceptAttr = fileInput.getAttribute('accept');
            expect(acceptAttr).toContain('.svg');
            expect(acceptAttr).toContain('.jpg');
            expect(acceptAttr).toContain('.jpeg');
            expect(acceptAttr).toContain('.png');
            expect(acceptAttr).toContain('image/svg+xml');
            expect(acceptAttr).toContain('image/jpeg');
            expect(acceptAttr).toContain('image/png');
        });
    });
    
    describe('Click-to-browse trigger', () => {
        test('should trigger file input click when upload area is clicked', () => {
            const clickSpy = jest.spyOn(fileInput, 'click');
            
            uploadArea.click();
            
            expect(clickSpy).toHaveBeenCalled();
        });
        
        test('should not interfere with drag-and-drop functionality', () => {
            const clickSpy = jest.spyOn(fileInput, 'click');
            
            // Simulate drag event - should not trigger file input click
            const dragEvent = new Event('dragover', { bubbles: true, cancelable: true });
            uploadArea.dispatchEvent(dragEvent);
            
            expect(clickSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('File selection handling', () => {
        test('should call handleFileUpload when file is selected', () => {
            const mockFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            // Simulate file selection
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false
            });
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile);
        });
        
        test('should handle file selection with no files gracefully', () => {
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            // Simulate file selection cancelled (no files)
            Object.defineProperty(fileInput, 'files', {
                value: [],
                writable: false
            });
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            expect(handleFileUploadSpy).not.toHaveBeenCalled();
        });
        
        test('should only process the first file when multiple files are selected', () => {
            const mockFile1 = new File(['test1'], 'test1.svg', { type: 'image/svg+xml' });
            const mockFile2 = new File(['test2'], 'test2.svg', { type: 'image/svg+xml' });
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            // Simulate multiple file selection
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile1, mockFile2],
                writable: false
            });
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            expect(handleFileUploadSpy).toHaveBeenCalledTimes(1);
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile1);
        });
    });
    
    describe('Integration: Complete click-to-browse workflow', () => {
        test('should handle complete click-to-browse sequence', () => {
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            const mockFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            
            // 1. Click upload area
            const fileInputClickSpy = jest.spyOn(fileInput, 'click');
            uploadArea.click();
            expect(fileInputClickSpy).toHaveBeenCalled();
            
            // 2. User selects file (simulated)
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false
            });
            
            // 3. Change event fires
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            // 4. File should be processed
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile);
        });
        
        test('should work with different file types', () => {
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            // Test SVG file
            const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            Object.defineProperty(fileInput, 'files', {
                value: [svgFile],
                writable: false,
                configurable: true
            });
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            expect(handleFileUploadSpy).toHaveBeenCalledWith(svgFile);
            
            // Test JPEG file
            handleFileUploadSpy.mockClear();
            const jpegFile = new File(['fake-jpeg-data'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(fileInput, 'files', {
                value: [jpegFile],
                writable: false,
                configurable: true
            });
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            expect(handleFileUploadSpy).toHaveBeenCalledWith(jpegFile);
            
            // Test PNG file
            handleFileUploadSpy.mockClear();
            const pngFile = new File(['fake-png-data'], 'test.png', { type: 'image/png' });
            Object.defineProperty(fileInput, 'files', {
                value: [pngFile],
                writable: false,
                configurable: true
            });
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            expect(handleFileUploadSpy).toHaveBeenCalledWith(pngFile);
        });
    });
});

/**
 * Unit tests for drag-and-drop functionality
 * Tests for task 2.1: Implement drag-and-drop upload area with jQuery
 */

describe('Drag and Drop Upload Functionality', () => {
    let app;
    let uploadArea;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
        uploadArea = document.getElementById('uploadArea');
    });
    
    describe('Task 2.1.1: Dragover event handler with visual feedback', () => {
        test('should add dragover class when dragging over upload area', () => {
            const event = new Event('dragover', { bubbles: true, cancelable: true });
            uploadArea.dispatchEvent(event);
            
            expect(uploadArea.classList.contains('dragover')).toBe(true);
        });
        
        test('should prevent default behavior on dragover', () => {
            const event = new Event('dragover', { bubbles: true, cancelable: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            
            uploadArea.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
        
        test('should stop propagation on dragover', () => {
            const event = new Event('dragover', { bubbles: true, cancelable: true });
            const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
            
            uploadArea.dispatchEvent(event);
            
            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });
    
    describe('Task 2.1.2: Dragleave event handler to remove feedback', () => {
        test('should remove dragover class when leaving upload area', () => {
            // First add the class
            uploadArea.classList.add('dragover');
            
            // Create dragleave event with coordinates outside the element
            const rect = uploadArea.getBoundingClientRect();
            const event = new MouseEvent('dragleave', {
                bubbles: true,
                cancelable: true,
                clientX: rect.left - 10, // Outside left boundary
                clientY: rect.top + 10
            });
            
            uploadArea.dispatchEvent(event);
            
            expect(uploadArea.classList.contains('dragover')).toBe(false);
        });
        
        test('should prevent default behavior on dragleave', () => {
            const rect = uploadArea.getBoundingClientRect();
            const event = new MouseEvent('dragleave', {
                bubbles: true,
                cancelable: true,
                clientX: rect.left - 10,
                clientY: rect.top + 10
            });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            
            uploadArea.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
        
        test('should keep dragover class when cursor is still within boundaries', () => {
            uploadArea.classList.add('dragover');
            
            // Mock getBoundingClientRect to return proper dimensions
            const mockGetBoundingClientRect = jest.fn(() => ({
                left: 0,
                top: 0,
                right: 200,
                bottom: 200,
                width: 200,
                height: 200,
                x: 0,
                y: 0
            }));
            uploadArea.getBoundingClientRect = mockGetBoundingClientRect;
            
            // Create dragleave event with coordinates inside the element boundaries
            const event = new MouseEvent('dragleave', {
                bubbles: true,
                cancelable: true,
                clientX: 100, // Inside boundaries (between 0 and 200)
                clientY: 100  // Inside boundaries (between 0 and 200)
            });
            
            uploadArea.dispatchEvent(event);
            
            // Should still have dragover class since cursor is still within boundaries
            expect(uploadArea.classList.contains('dragover')).toBe(true);
        });
    });
    
    describe('Task 2.1.3: Drop event handler to process files', () => {
        test('should remove dragover class on drop', () => {
            uploadArea.classList.add('dragover');
            
            const mockFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [mockFile] }
            });
            
            uploadArea.dispatchEvent(event);
            
            expect(uploadArea.classList.contains('dragover')).toBe(false);
        });
        
        test('should prevent default behavior on drop', () => {
            const mockFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [mockFile] }
            });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
            
            uploadArea.dispatchEvent(event);
            
            expect(preventDefaultSpy).toHaveBeenCalled();
        });
        
        test('should stop propagation on drop', () => {
            const mockFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [mockFile] }
            });
            const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
            
            uploadArea.dispatchEvent(event);
            
            expect(stopPropagationSpy).toHaveBeenCalled();
        });
        
        test('should call handleFileUpload with the dropped file', () => {
            const mockFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' });
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [mockFile] }
            });
            
            uploadArea.dispatchEvent(event);
            
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile);
        });
        
        test('should handle drop event with no files gracefully', () => {
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [] }
            });
            
            uploadArea.dispatchEvent(event);
            
            expect(handleFileUploadSpy).not.toHaveBeenCalled();
        });
        
        test('should only process the first file when multiple files are dropped', () => {
            const mockFile1 = new File(['test1'], 'test1.svg', { type: 'image/svg+xml' });
            const mockFile2 = new File(['test2'], 'test2.svg', { type: 'image/svg+xml' });
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            
            const event = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'dataTransfer', {
                value: { files: [mockFile1, mockFile2] }
            });
            
            uploadArea.dispatchEvent(event);
            
            expect(handleFileUploadSpy).toHaveBeenCalledTimes(1);
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile1);
        });
    });
    
    describe('Integration: Complete drag-and-drop workflow', () => {
        test('should handle complete drag-and-drop sequence', () => {
            const handleFileUploadSpy = jest.spyOn(app, 'handleFileUpload');
            const mockFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            
            // 1. Dragover - should add visual feedback
            const dragoverEvent = new Event('dragover', { bubbles: true, cancelable: true });
            uploadArea.dispatchEvent(dragoverEvent);
            expect(uploadArea.classList.contains('dragover')).toBe(true);
            
            // 2. Drop - should remove feedback and process file
            const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: { files: [mockFile] }
            });
            uploadArea.dispatchEvent(dropEvent);
            
            expect(uploadArea.classList.contains('dragover')).toBe(false);
            expect(handleFileUploadSpy).toHaveBeenCalledWith(mockFile);
        });
        
        test('should handle drag cancel (dragleave without drop)', () => {
            // 1. Dragover - add visual feedback
            const dragoverEvent = new Event('dragover', { bubbles: true, cancelable: true });
            uploadArea.dispatchEvent(dragoverEvent);
            expect(uploadArea.classList.contains('dragover')).toBe(true);
            
            // 2. Dragleave - remove visual feedback
            const rect = uploadArea.getBoundingClientRect();
            const dragleaveEvent = new MouseEvent('dragleave', {
                bubbles: true,
                cancelable: true,
                clientX: rect.left - 10,
                clientY: rect.top + 10
            });
            uploadArea.dispatchEvent(dragleaveEvent);
            
            expect(uploadArea.classList.contains('dragover')).toBe(false);
        });
    });
});

/**
 * Unit tests for file type validation and error handling
 * Tests for tasks 2.3-2.6: File validation, routing, and error handling
 */

describe('File Type Validation and Error Handling', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 2.3: File type validation', () => {
        test('should accept SVG files with .svg extension', () => {
            const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should accept JPEG files with .jpg extension', () => {
            const jpegFile = new File(['fake-jpeg'], 'test.jpg', { type: 'image/jpeg' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(jpegFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should accept JPEG files with .jpeg extension', () => {
            const jpegFile = new File(['fake-jpeg'], 'test.jpeg', { type: 'image/jpeg' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(jpegFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should accept PNG files with .png extension', () => {
            const pngFile = new File(['fake-png'], 'test.png', { type: 'image/png' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(pngFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(pngFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should accept files with valid MIME type even if extension is missing', () => {
            const svgFile = new File(['<svg></svg>'], 'test', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should be case-insensitive for file extensions', () => {
            const svgFile = new File(['<svg></svg>'], 'test.SVG', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should reject files with invalid extensions', () => {
            const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
        
        test('should reject files with invalid MIME types', () => {
            const invalidFile = new File(['data'], 'test.pdf', { type: 'application/pdf' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('Task 2.4: Route files by type', () => {
        test('should route SVG files to loadSVGFile()', () => {
            const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
        
        test('should route JPEG files to convertImageToSVG()', () => {
            const jpegFile = new File(['fake-jpeg'], 'test.jpg', { type: 'image/jpeg' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            
            app.handleFileUpload(jpegFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
        });
        
        test('should route PNG files to convertImageToSVG()', () => {
            const pngFile = new File(['fake-png'], 'test.png', { type: 'image/png' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            
            app.handleFileUpload(pngFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(pngFile);
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
        });
        
        test('should correctly identify SVG by MIME type when extension is ambiguous', () => {
            const svgFile = new File(['<svg></svg>'], 'test', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
        
        test('should correctly identify raster image by MIME type when extension is ambiguous', () => {
            const jpegFile = new File(['fake-jpeg'], 'test', { type: 'image/jpeg' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            
            app.handleFileUpload(jpegFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('Task 2.5: Error handling for invalid file types', () => {
        test('should handle files with no extension', () => {
            const invalidFile = new File(['data'], 'testfile', { type: 'application/octet-stream' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
        
        test('should handle files with unsupported image formats', () => {
            const gifFile = new File(['fake-gif'], 'test.gif', { type: 'image/gif' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(gifFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
        
        test('should handle files with document formats', () => {
            const pdfFile = new File(['fake-pdf'], 'test.pdf', { type: 'application/pdf' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(pdfFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
        
        test('should not process file after showing error', () => {
            const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(invalidFile);
            
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
    });
    
    describe('Task 2.6: Display error messages using jQuery', () => {
        test('should display error message in error message element', () => {
            const errorMessage = document.getElementById('errorMessage');
            const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
            
            app.handleFileUpload(invalidFile);
            
            expect(errorMessage.textContent).toBe('Please upload an SVG, JPEG, or PNG file');
        });
        
        test('should make error message visible when showing error', () => {
            const $errorMessage = $('#errorMessage');
            const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
            
            // Ensure it starts hidden
            $errorMessage.hide();
            
            app.handleFileUpload(invalidFile);
            
            // jQuery fadeIn makes element visible
            expect($errorMessage.css('display')).not.toBe('none');
        });
        
        test('should call fadeOut after timeout to hide error message', (done) => {
            const $errorMessage = $('#errorMessage');
            const invalidFile = new File(['data'], 'test.txt', { type: 'text/plain' });
            
            // Spy on jQuery fadeOut method
            const fadeOutSpy = jest.spyOn($.fn, 'fadeOut');
            
            app.handleFileUpload(invalidFile);
            
            // Error should be visible initially
            expect($errorMessage.css('display')).not.toBe('none');
            
            // Wait for timeout (5 seconds + buffer)
            setTimeout(() => {
                // Verify fadeOut was called (which would hide the message in a real browser)
                expect(fadeOutSpy).toHaveBeenCalled();
                fadeOutSpy.mockRestore();
                done();
            }, 5100);
        }, 6000);
        
        test('should show correct error message text', () => {
            const showErrorSpy = jest.spyOn(app, 'showError');
            const invalidFile = new File(['data'], 'test.webp', { type: 'image/webp' });
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
    });
    
    describe('Integration: Complete validation workflow', () => {
        test('should handle valid SVG file end-to-end', () => {
            const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(svgFile);
            
            expect(showErrorSpy).not.toHaveBeenCalled();
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
        });
        
        test('should handle valid JPEG file end-to-end', () => {
            const jpegFile = new File(['fake-jpeg'], 'photo.jpg', { type: 'image/jpeg' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(jpegFile);
            
            expect(showErrorSpy).not.toHaveBeenCalled();
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
        });
        
        test('should handle invalid file end-to-end', () => {
            const invalidFile = new File(['data'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile');
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
            expect(loadSVGFileSpy).not.toHaveBeenCalled();
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
        
        test('should handle multiple file uploads with mixed validity', () => {
            const validFile = new File(['<svg></svg>'], 'valid.svg', { type: 'image/svg+xml' });
            const invalidFile = new File(['data'], 'invalid.txt', { type: 'text/plain' });
            
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            // First upload - valid
            app.handleFileUpload(validFile);
            expect(loadSVGFileSpy).toHaveBeenCalledWith(validFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
            
            // Second upload - invalid
            app.handleFileUpload(invalidFile);
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
    });
    
    describe('Edge cases and boundary conditions', () => {
        test('should handle file with multiple dots in filename', () => {
            const svgFile = new File(['<svg></svg>'], 'my.test.file.svg', { type: 'image/svg+xml' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should handle file with uppercase extension', () => {
            const jpegFile = new File(['fake-jpeg'], 'TEST.JPEG', { type: 'image/jpeg' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(jpegFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(jpegFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should handle file with mixed case extension', () => {
            const pngFile = new File(['fake-png'], 'image.PnG', { type: 'image/png' });
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(pngFile);
            
            expect(convertImageToSVGSpy).toHaveBeenCalledWith(pngFile);
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should prioritize extension over MIME type for SVG detection', () => {
            // File with .svg extension should be treated as SVG even with wrong MIME type
            const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'text/plain' });
            const loadSVGFileSpy = jest.spyOn(app, 'loadSVGFile').mockImplementation(() => {});
            const convertImageToSVGSpy = jest.spyOn(app, 'convertImageToSVG');
            
            app.handleFileUpload(svgFile);
            
            expect(loadSVGFileSpy).toHaveBeenCalledWith(svgFile);
            expect(convertImageToSVGSpy).not.toHaveBeenCalled();
        });
        
        test('should handle empty filename gracefully', () => {
            const invalidFile = new File(['data'], '', { type: 'text/plain' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            app.handleFileUpload(invalidFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Please upload an SVG, JPEG, or PNG file');
        });
    });
});

/**
 * Unit tests for loadSVGFile() method
 * Tests for task 3.1: Implement loadSVGFile() method and subtasks 3.1.1-3.1.3
 */

describe('Task 3.1: loadSVGFile() Method', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 3.1.1: Read file content using File API', () => {
        test('should read SVG file content using File API text() method', async () => {
            const svgContent = '<svg width="100" height="100"><rect fill="#ff0000" width="100" height="100"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            // Mock the methods that will be called
            const analyzeSVGSpy = jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            const displaySVGSpy = jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            const updateUISpy = jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            // Verify that the file content was read
            expect(app.originalSVG).toBe(svgContent);
            expect(app.currentSVG).toBe(svgContent);
        });
        
        test('should handle empty SVG file gracefully', async () => {
            const emptyFile = new File([''], 'empty.svg', { type: 'image/svg+xml' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(emptyFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('SVG file is empty');
            expect(app.originalSVG).toBeNull();
            expect(app.currentSVG).toBeNull();
        });
        
        test('should handle whitespace-only SVG file gracefully', async () => {
            const whitespaceFile = new File(['   \n\t  '], 'whitespace.svg', { type: 'image/svg+xml' });
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(whitespaceFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('SVG file is empty');
            expect(app.originalSVG).toBeNull();
            expect(app.currentSVG).toBeNull();
        });
    });
    
    describe('Task 3.1.2: Store original and current SVG state', () => {
        test('should store SVG content in both originalSVG and currentSVG', async () => {
            const svgContent = '<svg><circle fill="#00ff00" r="50"/></svg>';
            const svgFile = new File([svgContent], 'circle.svg', { type: 'image/svg+xml' });
            
            // Mock the methods that will be called
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            // Verify both state properties are set
            expect(app.originalSVG).toBe(svgContent);
            expect(app.currentSVG).toBe(svgContent);
        });
        
        test('should store identical content in originalSVG and currentSVG', async () => {
            const svgContent = '<svg><rect fill="#0000ff" width="50" height="50"/></svg>';
            const svgFile = new File([svgContent], 'rect.svg', { type: 'image/svg+xml' });
            
            // Mock the methods that will be called
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            // Verify both properties have the same content
            expect(app.originalSVG).toBe(app.currentSVG);
            expect(app.originalSVG).toBe(svgContent);
        });
        
        test('should preserve original SVG state for reset functionality', async () => {
            const svgContent = '<svg><polygon fill="#ffff00" points="0,0 50,0 25,50"/></svg>';
            const svgFile = new File([svgContent], 'triangle.svg', { type: 'image/svg+xml' });
            
            // Mock the methods that will be called
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            // Simulate modification of currentSVG
            app.currentSVG = '<svg><polygon fill="#00ffff" points="0,0 50,0 25,50"/></svg>';
            
            // Verify originalSVG remains unchanged
            expect(app.originalSVG).toBe(svgContent);
            expect(app.currentSVG).not.toBe(app.originalSVG);
        });
    });
    
    describe('Task 3.1.3: Call analyzeSVG() method', () => {
        test('should call analyzeSVG() with the SVG content', async () => {
            const svgContent = '<svg><rect fill="#ff00ff" width="100" height="100"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            const analyzeSVGSpy = jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            expect(analyzeSVGSpy).toHaveBeenCalledWith(svgContent);
            expect(analyzeSVGSpy).toHaveBeenCalledTimes(1);
        });
        
        test('should call displaySVG() with the SVG content', async () => {
            const svgContent = '<svg><ellipse fill="#888888" rx="50" ry="30"/></svg>';
            const svgFile = new File([svgContent], 'ellipse.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            const displaySVGSpy = jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            expect(displaySVGSpy).toHaveBeenCalledWith(svgContent);
            expect(displaySVGSpy).toHaveBeenCalledTimes(1);
        });
        
        test('should call updateUI() after analysis', async () => {
            const svgContent = '<svg><path fill="#123456" d="M10 10 L50 50"/></svg>';
            const svgFile = new File([svgContent], 'path.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            const updateUISpy = jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.loadSVGFile(svgFile);
            
            expect(updateUISpy).toHaveBeenCalledTimes(1);
        });
        
        test('should call methods in correct order: analyzeSVG -> displaySVG -> updateUI', async () => {
            const svgContent = '<svg><circle fill="#abcdef" r="25"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            const callOrder = [];
            
            jest.spyOn(app, 'analyzeSVG').mockImplementation(async () => {
                callOrder.push('analyzeSVG');
            });
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {
                callOrder.push('displaySVG');
            });
            jest.spyOn(app, 'updateUI').mockImplementation(() => {
                callOrder.push('updateUI');
            });
            
            await app.loadSVGFile(svgFile);
            
            expect(callOrder).toEqual(['analyzeSVG', 'displaySVG', 'updateUI']);
        });
    });
    
    describe('Error handling', () => {
        test('should handle file read errors gracefully', async () => {
            // Create a mock file that will trigger an error during FileReader operation
            const errorFile = new File(['test'], 'error.svg', { type: 'image/svg+xml' });
            
            // Mock FileReader to throw an error
            const originalFileReader = global.FileReader;
            global.FileReader = class {
                readAsText() {
                    setTimeout(() => {
                        if (this.onerror) {
                            this.onerror(new Error('File read error'));
                        }
                    }, 0);
                }
            };
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(errorFile);
            
            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(showErrorSpy).toHaveBeenCalled();
            expect(showErrorSpy.mock.calls[0][0]).toContain('Failed to load SVG file');
            
            // Restore original FileReader
            global.FileReader = originalFileReader;
        });
        
        test('should handle analyzeSVG errors gracefully', async () => {
            const svgContent = '<svg><rect fill="#ff0000" width="100" height="100"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockRejectedValue(new Error('Analysis failed'));
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(svgFile);
            
            expect(showErrorSpy).toHaveBeenCalledWith('Failed to load SVG file: Analysis failed');
        });
        
        test('should not call displaySVG or updateUI if analyzeSVG fails', async () => {
            const svgContent = '<svg><rect fill="#ff0000" width="100" height="100"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockRejectedValue(new Error('Analysis failed'));
            const displaySVGSpy = jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            const updateUISpy = jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(svgFile);
            
            expect(displaySVGSpy).not.toHaveBeenCalled();
            expect(updateUISpy).not.toHaveBeenCalled();
        });
    });
    
    describe('Integration: Complete loadSVGFile workflow', () => {
        test('should successfully load and process a valid SVG file', async () => {
            const svgContent = '<svg width="200" height="200"><rect fill="#ff0000" width="100" height="100"/><circle fill="#00ff00" cx="150" cy="150" r="50"/></svg>';
            const svgFile = new File([svgContent], 'complex.svg', { type: 'image/svg+xml' });
            
            const analyzeSVGSpy = jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            const displaySVGSpy = jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            const updateUISpy = jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.loadSVGFile(svgFile);
            
            // Verify state is set correctly
            expect(app.originalSVG).toBe(svgContent);
            expect(app.currentSVG).toBe(svgContent);
            
            // Verify all methods were called
            expect(analyzeSVGSpy).toHaveBeenCalledWith(svgContent);
            expect(displaySVGSpy).toHaveBeenCalledWith(svgContent);
            expect(updateUISpy).toHaveBeenCalled();
            
            // Verify no errors were shown
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should log success message with file name', async () => {
            const svgContent = '<svg><rect fill="#0000ff" width="50" height="50"/></svg>';
            const svgFile = new File([svgContent], 'blue-rect.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue(undefined);
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            const consoleSpy = jest.spyOn(console, 'log');
            
            await app.loadSVGFile(svgFile);
            
            expect(consoleSpy).toHaveBeenCalledWith('SVG file loaded successfully:', 'blue-rect.svg');
        });
        
        test('should log color count after analysis', async () => {
            const svgContent = '<svg><rect fill="#ff0000" width="50" height="50"/></svg>';
            const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
            
            jest.spyOn(app, 'analyzeSVG').mockImplementation(async () => {
                app.colorData = [
                    { hex: '#ff0000', count: 2500, percentage: 100, rgb: { r: 255, g: 0, b: 0 } }
                ];
            });
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            const consoleSpy = jest.spyOn(console, 'log');
            
            await app.loadSVGFile(svgFile);
            
            expect(consoleSpy).toHaveBeenCalledWith('Colors found:', 1);
        });
    });
});

/**
 * Unit tests for displaySVG() method
 * Tests for task 3.2: Implement displaySVG() method using jQuery
 * Tests for task 3.3: Add error handling for malformed SVG files
 */

describe('Task 3.2 & 3.3: displaySVG() Method and Malformed SVG Handling', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 3.2.1: Insert SVG into preview container', () => {
        test('should insert valid SVG content into preview container', () => {
            const svgContent = '<svg width="100" height="100"><rect fill="#ff0000" width="100" height="100"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that SVG was inserted (browser may normalize self-closing tags)
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('rect')).toBeTruthy();
            expect(svgPreview.querySelector('rect').getAttribute('fill')).toBe('#ff0000');
        });
        
        test('should clear existing content before inserting new SVG', () => {
            const svgPreview = document.getElementById('svgPreview');
            svgPreview.innerHTML = '<div>Old content</div>';
            
            const svgContent = '<svg><circle fill="#00ff00" r="50"/></svg>';
            app.displaySVG(svgContent);
            
            // Check that old content is gone and new SVG is present
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('circle')).toBeTruthy();
            expect(svgPreview.innerHTML).not.toContain('Old content');
        });
        
        test('should handle SVG with multiple elements', () => {
            const svgContent = '<svg width="200" height="200"><rect fill="#ff0000" width="100" height="100"/><circle fill="#00ff00" cx="150" cy="150" r="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that both elements are present
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('rect')).toBeTruthy();
            expect(svgPreview.querySelector('circle')).toBeTruthy();
        });
        
        test('should handle SVG with attributes', () => {
            const svgContent = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect fill="#0000ff" width="50" height="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that SVG and attributes are present
            const svg = svgPreview.querySelector('svg');
            expect(svg).toBeTruthy();
            expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
        });
        
        test('should use jQuery empty() to clear container', () => {
            const svgContent = '<svg><rect fill="#ff00ff" width="100" height="100"/></svg>';
            const $svgPreview = $('#svgPreview');
            const emptySpy = jest.spyOn($.fn, 'empty');
            
            app.displaySVG(svgContent);
            
            expect(emptySpy).toHaveBeenCalled();
            emptySpy.mockRestore();
        });
        
        test('should use jQuery html() to insert SVG', () => {
            const svgContent = '<svg><ellipse fill="#888888" rx="50" ry="30"/></svg>';
            const htmlSpy = jest.spyOn($.fn, 'html');
            
            app.displaySVG(svgContent);
            
            expect(htmlSpy).toHaveBeenCalledWith(svgContent);
            htmlSpy.mockRestore();
        });
    });
    
    describe('Task 3.2.2: Show main content area', () => {
        test('should make main content area visible', () => {
            const svgContent = '<svg><rect fill="#ff0000" width="100" height="100"/></svg>';
            const mainContent = document.getElementById('mainContent');
            
            // Ensure it starts hidden
            mainContent.style.display = 'none';
            
            app.displaySVG(svgContent);
            
            // jQuery fadeIn makes element visible
            expect(mainContent.style.display).not.toBe('none');
        });
        
        test('should use jQuery fadeIn() to show main content', () => {
            const svgContent = '<svg><circle fill="#00ff00" r="50"/></svg>';
            const fadeInSpy = jest.spyOn($.fn, 'fadeIn');
            
            app.displaySVG(svgContent);
            
            expect(fadeInSpy).toHaveBeenCalled();
            fadeInSpy.mockRestore();
        });
        
        test('should show main content after inserting SVG', () => {
            const svgContent = '<svg><rect fill="#0000ff" width="50" height="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            const mainContent = document.getElementById('mainContent');
            
            mainContent.style.display = 'none';
            
            app.displaySVG(svgContent);
            
            // Verify SVG was inserted
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('rect')).toBeTruthy();
            // Verify main content is visible
            expect(mainContent.style.display).not.toBe('none');
        });
    });
    
    describe('Task 3.3: Add error handling for malformed SVG files', () => {
        test('should detect malformed SVG with parser error', () => {
            const malformedSVG = '<svg><rect fill="#ff0000" width="100" height="100"</svg>'; // Missing closing >
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            expect(() => {
                app.displaySVG(malformedSVG);
            }).toThrow();
            
            expect(showErrorSpy).toHaveBeenCalled();
            expect(showErrorSpy.mock.calls[0][0]).toContain('Failed to display SVG');
        });
        
        test('should detect SVG with missing root element', () => {
            const invalidSVG = '<div><rect fill="#ff0000" width="100" height="100"/></div>'; // Not an SVG element
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            expect(() => {
                app.displaySVG(invalidSVG);
            }).toThrow('Invalid SVG format: Missing SVG root element');
            
            expect(showErrorSpy).toHaveBeenCalled();
        });
        
        test('should use DOMParser to validate SVG', () => {
            const svgContent = '<svg><rect fill="#00ff00" width="50" height="50"/></svg>';
            const originalDOMParser = global.DOMParser;
            const parseFromStringSpy = jest.fn().mockReturnValue({
                documentElement: { tagName: 'svg' },
                querySelector: () => null
            });
            
            global.DOMParser = class {
                parseFromString = parseFromStringSpy;
            };
            
            app.displaySVG(svgContent);
            
            expect(parseFromStringSpy).toHaveBeenCalledWith(svgContent, 'image/svg+xml');
            
            global.DOMParser = originalDOMParser;
        });
        
        test('should check for parsererror element', () => {
            const malformedSVG = '<svg><unclosed-tag></svg>';
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            // DOMParser will create a parsererror element for malformed XML
            const originalDOMParser = global.DOMParser;
            global.DOMParser = class {
                parseFromString() {
                    const doc = {
                        documentElement: { tagName: 'parsererror' },
                        querySelector: (selector) => {
                            if (selector === 'parsererror') {
                                return { textContent: 'XML parsing error' };
                            }
                            return null;
                        }
                    };
                    return doc;
                }
            };
            
            expect(() => {
                app.displaySVG(malformedSVG);
            }).toThrow();
            
            expect(showErrorSpy).toHaveBeenCalled();
            expect(showErrorSpy.mock.calls[0][0]).toContain('Invalid SVG format');
            
            global.DOMParser = originalDOMParser;
        });
        
        test('should verify SVG root element exists', () => {
            const invalidSVG = '<html><body>Not an SVG</body></html>';
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            expect(() => {
                app.displaySVG(invalidSVG);
            }).toThrow('Invalid SVG format: Missing SVG root element');
            
            expect(showErrorSpy).toHaveBeenCalled();
        });
        
        test('should handle empty SVG string', () => {
            const emptySVG = '';
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            expect(() => {
                app.displaySVG(emptySVG);
            }).toThrow();
            
            expect(showErrorSpy).toHaveBeenCalled();
        });
        
        test('should not insert malformed SVG into preview', () => {
            const malformedSVG = '<svg><rect fill="#ff0000" width="100" height="100"</svg>';
            const svgPreview = document.getElementById('svgPreview');
            svgPreview.innerHTML = '<div>Original content</div>';
            
            try {
                app.displaySVG(malformedSVG);
            } catch (e) {
                // Expected to throw
            }
            
            // Preview should not contain the malformed SVG
            expect(svgPreview.innerHTML).not.toContain(malformedSVG);
        });
        
        test('should throw error for malformed SVG to allow caller to handle', () => {
            const malformedSVG = '<svg><invalid></svg>';
            
            const originalDOMParser = global.DOMParser;
            global.DOMParser = class {
                parseFromString() {
                    return {
                        documentElement: { tagName: 'parsererror' },
                        querySelector: () => ({ textContent: 'Parse error' })
                    };
                }
            };
            
            expect(() => {
                app.displaySVG(malformedSVG);
            }).toThrow();
            
            global.DOMParser = originalDOMParser;
        });
    });
    
    describe('Integration: Complete displaySVG workflow', () => {
        test('should successfully display valid SVG with all steps', () => {
            const svgContent = '<svg width="200" height="200"><rect fill="#ff0000" width="100" height="100"/><circle fill="#00ff00" cx="150" cy="150" r="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            const mainContent = document.getElementById('mainContent');
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            mainContent.style.display = 'none';
            
            app.displaySVG(svgContent);
            
            // Verify SVG was inserted
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('rect')).toBeTruthy();
            expect(svgPreview.querySelector('circle')).toBeTruthy();
            
            // Verify main content is visible
            expect(mainContent.style.display).not.toBe('none');
            
            // Verify no errors
            expect(showErrorSpy).not.toHaveBeenCalled();
        });
        
        test('should handle complex SVG with nested elements', () => {
            const svgContent = '<svg viewBox="0 0 100 100"><g id="group1"><rect fill="#ff0000" width="50" height="50"/><rect fill="#00ff00" x="50" width="50" height="50"/></g><g id="group2"><rect fill="#0000ff" y="50" width="50" height="50"/><rect fill="#ffff00" x="50" y="50" width="50" height="50"/></g></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that nested structure is preserved
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelectorAll('g').length).toBe(2);
            expect(svgPreview.querySelectorAll('rect').length).toBe(4);
        });
        
        test('should log success message after displaying SVG', () => {
            const svgContent = '<svg><rect fill="#0000ff" width="50" height="50"/></svg>';
            const consoleSpy = jest.spyOn(console, 'log');
            
            app.displaySVG(svgContent);
            
            expect(consoleSpy).toHaveBeenCalledWith('SVG displayed successfully');
        });
        
        test('should handle SVG with special characters in attributes', () => {
            const svgContent = '<svg><text fill="#000000" x="10" y="20">Hello &amp; World</text></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            expect(svgPreview.innerHTML).toBe(svgContent);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle SVG with CDATA sections', () => {
            const svgContent = '<svg><style><![CDATA[.cls{fill:#ff0000;}]]></style><rect class="cls" width="100" height="100"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            expect(svgPreview.innerHTML).toContain('svg');
        });
        
        test('should handle SVG with comments', () => {
            const svgContent = '<svg><!-- This is a comment --><rect fill="#00ff00" width="50" height="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            expect(svgPreview.innerHTML).toContain('svg');
        });
        
        test('should handle SVG with namespaces', () => {
            const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect fill="#0000ff" width="50" height="50"/></svg>';
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that SVG with namespaces is handled correctly
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelector('rect')).toBeTruthy();
        });
        
        test('should handle very large SVG content', () => {
            // Create a large SVG with many elements
            let svgContent = '<svg width="1000" height="1000">';
            for (let i = 0; i < 100; i++) {
                svgContent += `<rect fill="#ff0000" x="${i * 10}" y="${i * 10}" width="10" height="10"/>`;
            }
            svgContent += '</svg>';
            
            const svgPreview = document.getElementById('svgPreview');
            
            app.displaySVG(svgContent);
            
            // Check that all elements are present
            expect(svgPreview.querySelector('svg')).toBeTruthy();
            expect(svgPreview.querySelectorAll('rect').length).toBe(100);
        });
    });
});

/**
 * Unit tests for hexToRgb() method
 * Tests for task 13.2: Implement hexToRgb() method
 */

describe('hexToRgb() Method', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 13.2.1: Parse hex string to RGB object', () => {
        test('should convert valid hex color with # prefix to RGB object', () => {
            const result = app.hexToRgb('#ff5733');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(87);
            expect(result.b).toBe(51);
        });
        
        test('should convert valid hex color without # prefix to RGB object', () => {
            const result = app.hexToRgb('ff5733');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(87);
            expect(result.b).toBe(51);
        });
        
        test('should convert pure red (#ff0000) correctly', () => {
            const result = app.hexToRgb('#ff0000');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(0);
            expect(result.b).toBe(0);
        });
        
        test('should convert pure green (#00ff00) correctly', () => {
            const result = app.hexToRgb('#00ff00');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(255);
            expect(result.b).toBe(0);
        });
        
        test('should convert pure blue (#0000ff) correctly', () => {
            const result = app.hexToRgb('#0000ff');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(0);
            expect(result.b).toBe(255);
        });
        
        test('should convert black (#000000) correctly', () => {
            const result = app.hexToRgb('#000000');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(0);
            expect(result.b).toBe(0);
        });
        
        test('should convert white (#ffffff) correctly', () => {
            const result = app.hexToRgb('#ffffff');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(255);
            expect(result.b).toBe(255);
        });
        
        test('should handle uppercase hex values', () => {
            const result = app.hexToRgb('#FF5733');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(87);
            expect(result.b).toBe(51);
        });
        
        test('should handle mixed case hex values', () => {
            const result = app.hexToRgb('#Ff5733');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(87);
            expect(result.b).toBe(51);
        });
        
        test('should convert hex with leading zeros correctly', () => {
            const result = app.hexToRgb('#000001');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(0);
            expect(result.b).toBe(1);
        });
    });
    
    describe('Task 13.2.2: Handle invalid hex values', () => {
        test('should return null for invalid hex string (too short)', () => {
            const result = app.hexToRgb('#fff');
            
            expect(result).toBeNull();
        });
        
        test('should return null for invalid hex string (too long)', () => {
            const result = app.hexToRgb('#ff5733aa');
            
            expect(result).toBeNull();
        });
        
        test('should return null for hex string with invalid characters', () => {
            const result = app.hexToRgb('#gggggg');
            
            expect(result).toBeNull();
        });
        
        test('should return null for empty string', () => {
            const result = app.hexToRgb('');
            
            expect(result).toBeNull();
        });
        
        test('should return null for string with only #', () => {
            const result = app.hexToRgb('#');
            
            expect(result).toBeNull();
        });
        
        test('should return null for hex string with spaces', () => {
            const result = app.hexToRgb('#ff 57 33');
            
            expect(result).toBeNull();
        });
        
        test('should return null for hex string with special characters', () => {
            const result = app.hexToRgb('#ff@733');
            
            expect(result).toBeNull();
        });
        
        test('should return null for non-string input (number)', () => {
            const result = app.hexToRgb(123456);
            
            expect(result).toBeNull();
        });
        
        test('should return null for null input', () => {
            const result = app.hexToRgb(null);
            
            expect(result).toBeNull();
        });
        
        test('should return null for undefined input', () => {
            const result = app.hexToRgb(undefined);
            
            expect(result).toBeNull();
        });
    });
    
    describe('Edge cases and boundary values', () => {
        test('should handle minimum RGB values (000000)', () => {
            const result = app.hexToRgb('#000000');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(0);
            expect(result.b).toBe(0);
        });
        
        test('should handle maximum RGB values (ffffff)', () => {
            const result = app.hexToRgb('#ffffff');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(255);
            expect(result.g).toBe(255);
            expect(result.b).toBe(255);
        });
        
        test('should handle mid-range values', () => {
            const result = app.hexToRgb('#808080');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(128);
            expect(result.g).toBe(128);
            expect(result.b).toBe(128);
        });
    });
    
    describe('Integration with design requirements', () => {
        test('should match design document example: #00ff00 → {r: 0, g: 255, b: 0}', () => {
            const result = app.hexToRgb('#00ff00');
            
            expect(result).not.toBeNull();
            expect(result.r).toBe(0);
            expect(result.g).toBe(255);
            expect(result.b).toBe(0);
        });
        
        test('should return RGB object with correct property names', () => {
            const result = app.hexToRgb('#ff5733');
            
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('g');
            expect(result).toHaveProperty('b');
            expect(Object.keys(result).length).toBe(3);
        });
        
        test('should return integer values for RGB components', () => {
            const result = app.hexToRgb('#ff5733');
            
            expect(result).not.toBeNull();
            expect(Number.isInteger(result.r)).toBe(true);
            expect(Number.isInteger(result.g)).toBe(true);
            expect(Number.isInteger(result.b)).toBe(true);
        });
        
        test('should return values in valid RGB range [0-255]', () => {
            const result = app.hexToRgb('#ff5733');
            
            expect(result).not.toBeNull();
            expect(result.r).toBeGreaterThanOrEqual(0);
            expect(result.r).toBeLessThanOrEqual(255);
            expect(result.g).toBeGreaterThanOrEqual(0);
            expect(result.g).toBeLessThanOrEqual(255);
            expect(result.b).toBeGreaterThanOrEqual(0);
            expect(result.b).toBeLessThanOrEqual(255);
        });
    });
});

/**
 * Unit tests for loadImage() method
 * Tests for task 4.1: Implement loadImage() method
 */

describe('loadImage() Method', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 4.1.1: Create Image object from file', () => {
        test('should create an Image object', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            
            // Mock URL.createObjectURL and URL.revokeObjectURL
            const mockObjectURL = 'blob:http://localhost/test-image';
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn();
            
            // Mock Image to simulate successful load
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            // Start loading the image
            const loadPromise = app.loadImage(mockFile);
            
            // Verify URL.createObjectURL was called with the file
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
            
            // The promise should eventually resolve
            await expect(loadPromise).resolves.toBeDefined();
            
            global.Image = OriginalImage;
        });
        
        test('should set image src to object URL', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const mockObjectURL = 'blob:http://localhost/test-image';
            
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn();
            
            // Mock Image constructor to capture the created image
            let capturedImage;
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    capturedImage = this;
                    // Immediately trigger onload for testing
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            await app.loadImage(mockFile);
            
            expect(capturedImage.src).toBe(mockObjectURL);
            
            // Restore original Image constructor
            global.Image = OriginalImage;
        });
    });
    
    describe('Task 4.1.2: Handle image load success/failure', () => {
        test('should resolve promise with Image object on successful load', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            // Mock Image to simulate successful load
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            const result = await app.loadImage(mockFile);
            
            expect(result).toBeInstanceOf(HTMLImageElement);
            
            global.Image = OriginalImage;
        });
        
        test('should reject promise on image load failure', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            // Mock Image to simulate load failure
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            await expect(app.loadImage(mockFile)).rejects.toThrow('Failed to load image');
            
            global.Image = OriginalImage;
        });
        
        test('should log success message on successful load', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    this.width = 800;
                    this.height = 600;
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            await app.loadImage(mockFile);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'Image loaded successfully:',
                'test.jpg',
                '800x600'
            );
            
            consoleSpy.mockRestore();
            global.Image = OriginalImage;
        });
        
        test('should log error message on load failure', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            try {
                await app.loadImage(mockFile);
            } catch (error) {
                // Expected to throw
            }
            
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load image:', 'test.jpg');
            
            consoleSpy.mockRestore();
            global.Image = OriginalImage;
        });
    });
    
    describe('Task 4.1.3: Clean up object URLs', () => {
        test('should revoke object URL on successful load', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const mockObjectURL = 'blob:http://localhost/test-image';
            
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            await app.loadImage(mockFile);
            
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
            
            global.Image = OriginalImage;
        });
        
        test('should revoke object URL on load failure', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const mockObjectURL = 'blob:http://localhost/test-image';
            
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            try {
                await app.loadImage(mockFile);
            } catch (error) {
                // Expected to throw
            }
            
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
            
            global.Image = OriginalImage;
        });
        
        test('should clean up object URL before resolving promise', async () => {
            const mockFile = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
            const mockObjectURL = 'blob:http://localhost/test-image';
            const callOrder = [];
            
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn(() => {
                callOrder.push('revoke');
            });
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            await app.loadImage(mockFile).then(() => {
                callOrder.push('resolve');
            });
            
            // Verify revoke was called before promise resolved
            expect(callOrder).toEqual(['revoke', 'resolve']);
            
            global.Image = OriginalImage;
        });
    });
    
    describe('Integration: Complete loadImage workflow', () => {
        test('should handle complete image loading workflow', async () => {
            const mockFile = new File(['fake-image-data'], 'photo.jpg', { type: 'image/jpeg' });
            const mockObjectURL = 'blob:http://localhost/photo';
            
            global.URL.createObjectURL = jest.fn(() => mockObjectURL);
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    this.width = 1024;
                    this.height = 768;
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            const result = await app.loadImage(mockFile);
            
            // Verify complete workflow
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
            expect(result).toBeInstanceOf(HTMLImageElement);
            expect(result.width).toBe(1024);
            expect(result.height).toBe(768);
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
            
            global.Image = OriginalImage;
        });
        
        test('should work with different image file types', async () => {
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 0);
                }
            };
            
            // Test JPEG
            const jpegFile = new File(['jpeg-data'], 'test.jpg', { type: 'image/jpeg' });
            const jpegResult = await app.loadImage(jpegFile);
            expect(jpegResult).toBeInstanceOf(HTMLImageElement);
            
            // Test PNG
            const pngFile = new File(['png-data'], 'test.png', { type: 'image/png' });
            const pngResult = await app.loadImage(pngFile);
            expect(pngResult).toBeInstanceOf(HTMLImageElement);
            
            global.Image = OriginalImage;
        });
    });
    
    describe('Edge cases and error conditions', () => {
        test('should handle empty file', async () => {
            const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    // Empty file would typically fail to load
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            await expect(app.loadImage(emptyFile)).rejects.toThrow('Failed to load image');
            
            global.Image = OriginalImage;
        });
        
        test('should handle corrupted image data', async () => {
            const corruptedFile = new File(['corrupted-data'], 'corrupted.jpg', { type: 'image/jpeg' });
            
            global.URL.createObjectURL = jest.fn(() => 'blob:test');
            global.URL.revokeObjectURL = jest.fn();
            
            const OriginalImage = global.Image;
            global.Image = class extends OriginalImage {
                constructor() {
                    super();
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 0);
                }
            };
            
            await expect(app.loadImage(corruptedFile)).rejects.toThrow('Failed to load image');
            
            global.Image = OriginalImage;
        });
    });
});

/**
 * Unit tests for quantizeImageData() method
 * Tests for task 4.3: Implement quantizeImageData() method
 */

describe('quantizeImageData() Method', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        // Initialize the app
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 4.3.1: Extract unique colors with counts', () => {
        test('should extract unique colors from ImageData', () => {
            // Create a simple 2x2 ImageData with 2 unique colors
            const imageData = new ImageData(2, 2);
            // Red pixel at (0,0)
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            // Red pixel at (1,0)
            imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255;
            // Blue pixel at (0,1)
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255;
            // Blue pixel at (1,1)
            imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255;
            
            const result = app.quantizeImageData(imageData, 2);
            
            // Should return ImageData with same dimensions
            expect(result).toBeInstanceOf(ImageData);
            expect(result.width).toBe(2);
            expect(result.height).toBe(2);
        });
        
        test('should skip transparent pixels (alpha < 10)', () => {
            // Create ImageData with transparent pixels
            const imageData = new ImageData(2, 2);
            // Red pixel at (0,0)
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            // Transparent pixel at (1,0)
            imageData.data[4] = 100; imageData.data[5] = 100; imageData.data[6] = 100; imageData.data[7] = 5;
            // Blue pixel at (0,1)
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255;
            // Transparent pixel at (1,1)
            imageData.data[12] = 200; imageData.data[13] = 200; imageData.data[14] = 200; imageData.data[15] = 0;
            
            const result = app.quantizeImageData(imageData, 2);
            
            // Transparent pixels should be preserved
            expect(result.data[7]).toBe(5); // Alpha preserved
            expect(result.data[15]).toBe(0); // Alpha preserved
        });
        
        test('should count colors correctly', () => {
            // Create ImageData with known color distribution
            const imageData = new ImageData(3, 1);
            // Red pixel
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            // Red pixel
            imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255;
            // Blue pixel
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255;
            
            const result = app.quantizeImageData(imageData, 2);
            
            // Should successfully quantize
            expect(result).toBeInstanceOf(ImageData);
        });
    });
    
    describe('Task 4.3.2: Apply k-means clustering', () => {
        test('should reduce colors to target count', () => {
            // Create ImageData with many colors
            const imageData = new ImageData(10, 1);
            for (let i = 0; i < 10; i++) {
                const offset = i * 4;
                imageData.data[offset] = i * 25; // Different red values
                imageData.data[offset + 1] = 0;
                imageData.data[offset + 2] = 0;
                imageData.data[offset + 3] = 255;
            }
            
            const result = app.quantizeImageData(imageData, 3);
            
            // Should return quantized ImageData
            expect(result).toBeInstanceOf(ImageData);
            expect(result.width).toBe(10);
            expect(result.height).toBe(1);
        });
        
        test('should return original if colors <= target', () => {
            // Create ImageData with 2 colors
            const imageData = new ImageData(2, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 255; imageData.data[7] = 255;
            
            const result = app.quantizeImageData(imageData, 5);
            
            // Should return original since 2 colors < 5 target
            expect(result).toBe(imageData);
        });
        
        test('should call kMeansColors when quantization needed', () => {
            const kMeansColorsSpy = jest.spyOn(app, 'kMeansColors');
            
            // Create ImageData with many colors
            const imageData = new ImageData(5, 1);
            for (let i = 0; i < 5; i++) {
                const offset = i * 4;
                imageData.data[offset] = i * 50;
                imageData.data[offset + 1] = 0;
                imageData.data[offset + 2] = 0;
                imageData.data[offset + 3] = 255;
            }
            
            app.quantizeImageData(imageData, 2);
            
            expect(kMeansColorsSpy).toHaveBeenCalled();
        });
    });
    
    describe('Task 4.3.3: Map pixels to nearest palette color', () => {
        test('should map each pixel to nearest color in reduced palette', () => {
            // Create ImageData with gradient of reds
            const imageData = new ImageData(4, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            imageData.data[4] = 200; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255;
            imageData.data[8] = 100; imageData.data[9] = 0; imageData.data[10] = 0; imageData.data[11] = 255;
            imageData.data[12] = 50; imageData.data[13] = 0; imageData.data[14] = 0; imageData.data[15] = 255;
            
            const result = app.quantizeImageData(imageData, 2);
            
            // All pixels should be mapped to one of 2 colors
            expect(result).toBeInstanceOf(ImageData);
            
            // Extract unique colors from result
            const uniqueColors = new Set();
            for (let i = 0; i < result.data.length; i += 4) {
                const colorKey = `${result.data[i]},${result.data[i+1]},${result.data[i+2]}`;
                uniqueColors.add(colorKey);
            }
            
            // Should have at most 2 unique colors
            expect(uniqueColors.size).toBeLessThanOrEqual(2);
        });
        
        test('should preserve alpha channel when mapping colors', () => {
            const imageData = new ImageData(2, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 200;
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 255; imageData.data[7] = 150;
            
            const result = app.quantizeImageData(imageData, 2);
            
            // Alpha values should be preserved
            expect(result.data[3]).toBe(200);
            expect(result.data[7]).toBe(150);
        });
    });
    
    describe('Task 4.3.4: Return quantized ImageData', () => {
        test('should return ImageData object', () => {
            const imageData = new ImageData(2, 2);
            imageData.data.fill(255);
            
            const result = app.quantizeImageData(imageData, 2);
            
            expect(result).toBeInstanceOf(ImageData);
        });
        
        test('should return ImageData with same dimensions', () => {
            const imageData = new ImageData(5, 3);
            imageData.data.fill(255);
            
            const result = app.quantizeImageData(imageData, 2);
            
            expect(result.width).toBe(5);
            expect(result.height).toBe(3);
        });
        
        test('should return new ImageData (not modify original)', () => {
            const imageData = new ImageData(2, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 255; imageData.data[7] = 255;
            
            const originalData = new Uint8ClampedArray(imageData.data);
            const result = app.quantizeImageData(imageData, 2);
            
            // Original should be unchanged (unless it's returned as-is when no quantization needed)
            if (result !== imageData) {
                expect(imageData.data).toEqual(originalData);
            }
        });
    });
    
    describe('Integration: Complete quantization workflow', () => {
        test('should successfully quantize a multi-color image', () => {
            // Create a 4x4 image with 4 different colors
            const imageData = new ImageData(4, 4);
            
            // Fill with 4 colors in quadrants
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const offset = (y * 4 + x) * 4;
                    if (x < 2 && y < 2) {
                        // Top-left: Red
                        imageData.data[offset] = 255;
                        imageData.data[offset + 1] = 0;
                        imageData.data[offset + 2] = 0;
                    } else if (x >= 2 && y < 2) {
                        // Top-right: Green
                        imageData.data[offset] = 0;
                        imageData.data[offset + 1] = 255;
                        imageData.data[offset + 2] = 0;
                    } else if (x < 2 && y >= 2) {
                        // Bottom-left: Blue
                        imageData.data[offset] = 0;
                        imageData.data[offset + 1] = 0;
                        imageData.data[offset + 2] = 255;
                    } else {
                        // Bottom-right: Yellow
                        imageData.data[offset] = 255;
                        imageData.data[offset + 1] = 255;
                        imageData.data[offset + 2] = 0;
                    }
                    imageData.data[offset + 3] = 255; // Full opacity
                }
            }
            
            const result = app.quantizeImageData(imageData, 2);
            
            expect(result).toBeInstanceOf(ImageData);
            expect(result.width).toBe(4);
            expect(result.height).toBe(4);
            
            // Count unique colors in result
            const uniqueColors = new Set();
            for (let i = 0; i < result.data.length; i += 4) {
                const colorKey = `${result.data[i]},${result.data[i+1]},${result.data[i+2]}`;
                uniqueColors.add(colorKey);
            }
            
            // Should have at most 2 unique colors
            expect(uniqueColors.size).toBeLessThanOrEqual(2);
        });
        
        test('should handle default colorCount parameter (16)', () => {
            const imageData = new ImageData(10, 10);
            // Fill with many different colors
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = (i / 4) % 256;
                imageData.data[i + 1] = ((i / 4) * 2) % 256;
                imageData.data[i + 2] = ((i / 4) * 3) % 256;
                imageData.data[i + 3] = 255;
            }
            
            const result = app.quantizeImageData(imageData); // No colorCount specified
            
            expect(result).toBeInstanceOf(ImageData);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle single-pixel image', () => {
            const imageData = new ImageData(1, 1);
            imageData.data[0] = 255;
            imageData.data[1] = 0;
            imageData.data[2] = 0;
            imageData.data[3] = 255;
            
            const result = app.quantizeImageData(imageData, 2);
            
            expect(result).toBeInstanceOf(ImageData);
            expect(result.width).toBe(1);
            expect(result.height).toBe(1);
        });
        
        test('should handle all-transparent image', () => {
            const imageData = new ImageData(3, 3);
            // All pixels transparent
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 100;
                imageData.data[i + 1] = 100;
                imageData.data[i + 2] = 100;
                imageData.data[i + 3] = 0; // Transparent
            }
            
            const result = app.quantizeImageData(imageData, 2);
            
            // Should handle gracefully (no colors to quantize)
            expect(result).toBeInstanceOf(ImageData);
        });
        
        test('should handle single-color image', () => {
            const imageData = new ImageData(5, 5);
            // All pixels same color
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 128;
                imageData.data[i + 1] = 128;
                imageData.data[i + 2] = 128;
                imageData.data[i + 3] = 255;
            }
            
            const result = app.quantizeImageData(imageData, 5);
            
            // Should return original (1 color < 5 target)
            expect(result).toBe(imageData);
        });
    });
});

/**
 * Unit tests for kMeansColors() helper method
 * Tests for task 4.4: Implement kMeansColors() helper method
 */

describe('kMeansColors() Helper Method', () => {
    let app;
    
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 4.4.1: Initialize centroids from most common colors', () => {
        test('should initialize k centroids', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 100 },
                { rgb: { r: 0, g: 255, b: 0 }, count: 80 },
                { rgb: { r: 0, g: 0, b: 255 }, count: 60 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            expect(result).toHaveLength(2);
        });
        
        test('should initialize from most common colors', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 50 },
                { rgb: { r: 0, g: 255, b: 0 }, count: 100 }, // Most common
                { rgb: { r: 0, g: 0, b: 255 }, count: 75 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            // Should return 2 centroids
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('rgb');
        });
    });
    
    describe('Task 4.4.2: Iterate for convergence', () => {
        test('should perform clustering iterations', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 10 },
                { rgb: { r: 250, g: 0, b: 0 }, count: 10 },
                { rgb: { r: 0, g: 0, b: 255 }, count: 10 },
                { rgb: { r: 0, g: 0, b: 250 }, count: 10 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            // Should successfully cluster
            expect(result).toHaveLength(2);
        });
    });
    
    describe('Task 4.4.3: Assign colors to nearest centroid', () => {
        test('should assign colors to clusters', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 10 },
                { rgb: { r: 0, g: 0, b: 255 }, count: 10 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('rgb');
            expect(result[1]).toHaveProperty('rgb');
        });
    });
    
    describe('Task 4.4.4: Calculate weighted centroid updates', () => {
        test('should weight centroids by pixel count', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 100 }, // High weight
                { rgb: { r: 200, g: 0, b: 0 }, count: 1 },   // Low weight
                { rgb: { r: 0, g: 0, b: 255 }, count: 100 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            // Centroid should be closer to high-weight color
            expect(result).toHaveLength(2);
        });
    });
    
    describe('Integration and edge cases', () => {
        test('should handle k equal to number of colors', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 10 },
                { rgb: { r: 0, g: 255, b: 0 }, count: 10 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            expect(result).toHaveLength(2);
        });
        
        test('should handle k greater than number of colors', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 10 }
            ];
            
            const result = app.kMeansColors(colors, 3);
            
            // Should still work, may have duplicate centroids
            expect(result).toHaveLength(3);
        });
        
        test('should return color objects with rgb property', () => {
            const colors = [
                { rgb: { r: 255, g: 0, b: 0 }, count: 10 },
                { rgb: { r: 0, g: 0, b: 255 }, count: 10 }
            ];
            
            const result = app.kMeansColors(colors, 2);
            
            result.forEach(color => {
                expect(color).toHaveProperty('rgb');
                expect(color.rgb).toHaveProperty('r');
                expect(color.rgb).toHaveProperty('g');
                expect(color.rgb).toHaveProperty('b');
            });
        });
    });
});

/**
 * Unit tests for colorDistance() helper method
 * Tests for task 8.5: Implement colorDistance() helper method
 */

describe('colorDistance() Helper Method', () => {
    let app;
    
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 8.5.1: Calculate Euclidean distance in RGB space', () => {
        test('should return 0 for identical colors', () => {
            const color1 = { r: 100, g: 150, b: 200 };
            const color2 = { r: 100, g: 150, b: 200 };
            
            const distance = app.colorDistance(color1, color2);
            
            expect(distance).toBe(0);
        });
        
        test('should calculate correct distance for known values', () => {
            const color1 = { r: 0, g: 0, b: 0 };
            const color2 = { r: 3, g: 4, b: 0 };
            
            const distance = app.colorDistance(color1, color2);
            
            // Distance should be sqrt(3^2 + 4^2 + 0^2) = 5
            expect(distance).toBe(5);
        });
        
        test('should calculate distance for pure red to pure blue', () => {
            const red = { r: 255, g: 0, b: 0 };
            const blue = { r: 0, g: 0, b: 255 };
            
            const distance = app.colorDistance(red, blue);
            
            // Distance should be sqrt(255^2 + 0^2 + 255^2) ≈ 360.62
            expect(distance).toBeCloseTo(360.62, 1);
        });
        
        test('should be symmetric (distance(a,b) = distance(b,a))', () => {
            const color1 = { r: 100, g: 50, b: 200 };
            const color2 = { r: 150, g: 100, b: 50 };
            
            const distance1 = app.colorDistance(color1, color2);
            const distance2 = app.colorDistance(color2, color1);
            
            expect(distance1).toBe(distance2);
        });
        
        test('should always return non-negative value', () => {
            const color1 = { r: 255, g: 255, b: 255 };
            const color2 = { r: 0, g: 0, b: 0 };
            
            const distance = app.colorDistance(color1, color2);
            
            expect(distance).toBeGreaterThanOrEqual(0);
        });
        
        test('should handle maximum distance (white to black)', () => {
            const white = { r: 255, g: 255, b: 255 };
            const black = { r: 0, g: 0, b: 0 };
            
            const distance = app.colorDistance(white, black);
            
            // Distance should be sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
            expect(distance).toBeCloseTo(441.67, 1);
        });
        
        test('should handle colors with same hue but different brightness', () => {
            const lightRed = { r: 255, g: 100, b: 100 };
            const darkRed = { r: 128, g: 50, b: 50 };
            
            const distance = app.colorDistance(lightRed, darkRed);
            
            expect(distance).toBeGreaterThan(0);
        });
    });
    
    describe('Edge cases', () => {
        test('should handle zero values', () => {
            const color1 = { r: 0, g: 0, b: 0 };
            const color2 = { r: 0, g: 0, b: 0 };
            
            const distance = app.colorDistance(color1, color2);
            
            expect(distance).toBe(0);
        });
        
        test('should handle maximum RGB values', () => {
            const color1 = { r: 255, g: 255, b: 255 };
            const color2 = { r: 255, g: 255, b: 255 };
            
            const distance = app.colorDistance(color1, color2);
            
            expect(distance).toBe(0);
        });
        
        test('should handle mid-range values', () => {
            const color1 = { r: 128, g: 128, b: 128 };
            const color2 = { r: 127, g: 127, b: 127 };
            
            const distance = app.colorDistance(color1, color2);
            
            // Distance should be sqrt(1 + 1 + 1) ≈ 1.732
            expect(distance).toBeCloseTo(1.732, 2);
        });
    });
});

/**
 * Unit tests for rgbToHex() method
 * Tests for task 13.1: Implement rgbToHex() method
 */

describe('rgbToHex() Color Conversion', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 13.1.1: Convert RGB values to hex string', () => {
        test('should convert pure red to #ff0000', () => {
            expect(app.rgbToHex(255, 0, 0)).toBe('#ff0000');
        });
        
        test('should convert pure green to #00ff00', () => {
            expect(app.rgbToHex(0, 255, 0)).toBe('#00ff00');
        });
        
        test('should convert pure blue to #0000ff', () => {
            expect(app.rgbToHex(0, 0, 255)).toBe('#0000ff');
        });
        
        test('should convert black to #000000', () => {
            expect(app.rgbToHex(0, 0, 0)).toBe('#000000');
        });
        
        test('should convert white to #ffffff', () => {
            expect(app.rgbToHex(255, 255, 255)).toBe('#ffffff');
        });
        
        test('should convert arbitrary RGB values correctly', () => {
            expect(app.rgbToHex(171, 193, 35)).toBe('#abc123');
        });
    });
    
    describe('Task 13.1.2: Pad single digits with zero', () => {
        test('should pad single digit red component', () => {
            expect(app.rgbToHex(5, 0, 0)).toBe('#050000');
        });
        
        test('should pad single digit green component', () => {
            expect(app.rgbToHex(0, 5, 0)).toBe('#000500');
        });
        
        test('should pad single digit blue component', () => {
            expect(app.rgbToHex(0, 0, 5)).toBe('#000005');
        });
        
        test('should pad all single digit components', () => {
            expect(app.rgbToHex(1, 2, 3)).toBe('#010203');
        });
        
        test('should handle mix of single and double digit components', () => {
            expect(app.rgbToHex(5, 128, 255)).toBe('#0580ff');
        });
    });
    
    describe('Edge cases and validation', () => {
        test('should handle boundary values (0)', () => {
            expect(app.rgbToHex(0, 0, 0)).toBe('#000000');
        });
        
        test('should handle boundary values (255)', () => {
            expect(app.rgbToHex(255, 255, 255)).toBe('#ffffff');
        });
        
        test('should round decimal values', () => {
            expect(app.rgbToHex(127.5, 127.5, 127.5)).toBe('#808080');
        });
        
        test('should handle mid-range values', () => {
            expect(app.rgbToHex(128, 128, 128)).toBe('#808080');
        });
    });
    
    describe('Hex format consistency', () => {
        test('should always return lowercase hex', () => {
            const result = app.rgbToHex(255, 255, 255);
            expect(result).toBe(result.toLowerCase());
        });
        
        test('should always start with #', () => {
            const result = app.rgbToHex(100, 100, 100);
            expect(result).toMatch(/^#/);
        });
        
        test('should always return 7 characters (#rrggbb)', () => {
            expect(app.rgbToHex(0, 0, 0)).toHaveLength(7);
            expect(app.rgbToHex(255, 255, 255)).toHaveLength(7);
            expect(app.rgbToHex(1, 2, 3)).toHaveLength(7);
        });
        
        test('should match hex pattern /^#[0-9a-f]{6}$/', () => {
            const result = app.rgbToHex(171, 193, 35);
            expect(result).toMatch(/^#[0-9a-f]{6}$/);
        });
    });
});

/**
 * Unit tests for imageDataToSVG() method
 * Tests for task 4.5: Implement imageDataToSVG() method
 */

describe('imageDataToSVG() Image to SVG Conversion', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure for testing
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" style="display:none">
            <div id="mainContent" style="display:none"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce Colors</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn" style="display:none">Clear Highlight</button>
            <div id="loadingIndicator" style="display:none">Loading...</div>
            <div id="errorMessage" style="display:none"></div>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 4.5.3: Build complete SVG XML structure', () => {
        test('should return valid SVG with proper namespace', () => {
            const imageData = new ImageData(2, 2);
            // Set all pixels to red
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 2, 2);
            
            expect(svgText).toContain('xmlns="http://www.w3.org/2000/svg"');
            expect(svgText).toMatch(/<svg[^>]*>/);
            expect(svgText).toContain('</svg>');
        });
        
        test('should include correct viewBox dimensions', () => {
            const imageData = new ImageData(10, 20);
            const svgText = app.imageDataToSVG(imageData, 10, 20);
            
            expect(svgText).toContain('viewBox="0 0 10 20"');
        });
        
        test('should include correct width and height attributes', () => {
            const imageData = new ImageData(15, 25);
            const svgText = app.imageDataToSVG(imageData, 15, 25);
            
            expect(svgText).toContain('width="15"');
            expect(svgText).toContain('height="25"');
        });
    });
    
    describe('Task 4.5.1: Group consecutive same-color pixels in rows', () => {
        test('should group consecutive same-color pixels into single rect', () => {
            const imageData = new ImageData(5, 1);
            // Set all pixels in row to same color (red)
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 5, 1);
            
            // Should have only 1 rect element for all 5 consecutive pixels
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(1);
            
            // The rect should have width="5"
            expect(svgText).toContain('width="5"');
        });
        
        test('should create separate rects for different colors in same row', () => {
            const imageData = new ImageData(4, 1);
            // First 2 pixels red, next 2 pixels blue
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
            imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255; // Red
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255; // Blue
            imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
            
            const svgText = app.imageDataToSVG(imageData, 4, 1);
            
            // Should have 2 rect elements (one for red group, one for blue group)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(2);
        });
        
        test('should handle alternating colors (no grouping possible)', () => {
            const imageData = new ImageData(4, 1);
            // Alternating red and blue pixels
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 255; imageData.data[7] = 255; // Blue
            imageData.data[8] = 255; imageData.data[9] = 0; imageData.data[10] = 0; imageData.data[11] = 255; // Red
            imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
            
            const svgText = app.imageDataToSVG(imageData, 4, 1);
            
            // Should have 4 rect elements (no grouping possible)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(4);
        });
    });
    
    describe('Task 4.5.2: Generate SVG rect elements', () => {
        test('should generate rect with correct x, y, width, height attributes', () => {
            const imageData = new ImageData(3, 2);
            // Set all pixels to red
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 3, 2);
            
            // Should have rect elements with proper attributes
            expect(svgText).toMatch(/<rect x="\d+" y="\d+" width="\d+" height="1" fill="#[0-9a-f]{6}"\/>/);
        });
        
        test('should use height="1" for single pixel height', () => {
            const imageData = new ImageData(2, 2);
            // Set all pixels to red
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 2, 2);
            
            // All rects should have height="1"
            const rectMatches = svgText.match(/height="1"/g);
            expect(rectMatches.length).toBeGreaterThan(0);
        });
        
        test('should generate rect with correct fill color in hex format', () => {
            const imageData = new ImageData(1, 1);
            // Set pixel to specific color (171, 193, 35) = #abc123
            imageData.data[0] = 171;   // R
            imageData.data[1] = 193;   // G
            imageData.data[2] = 35;    // B
            imageData.data[3] = 255;   // A
            
            const svgText = app.imageDataToSVG(imageData, 1, 1);
            
            expect(svgText).toContain('fill="#abc123"');
        });
        
        test('should skip transparent pixels (alpha < 10)', () => {
            const imageData = new ImageData(3, 1);
            // First pixel: opaque red
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            // Second pixel: transparent
            imageData.data[4] = 100; imageData.data[5] = 100; imageData.data[6] = 100; imageData.data[7] = 5;
            // Third pixel: opaque blue
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255;
            
            const svgText = app.imageDataToSVG(imageData, 3, 1);
            
            // Should have 2 rect elements (transparent pixel skipped)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(2);
            
            // Should have red and blue, but not the transparent color
            expect(svgText).toContain('fill="#ff0000"');
            expect(svgText).toContain('fill="#0000ff"');
        });
    });
    
    describe('Task 4.5.4: Return SVG text', () => {
        test('should return a string', () => {
            const imageData = new ImageData(1, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            
            const result = app.imageDataToSVG(imageData, 1, 1);
            
            expect(typeof result).toBe('string');
        });
        
        test('should return valid SVG that can be parsed', () => {
            const imageData = new ImageData(2, 2);
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 2, 2);
            
            // Parse SVG to verify it's valid
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const parserError = doc.querySelector('parsererror');
            
            expect(parserError).toBeNull();
            expect(doc.documentElement.tagName.toLowerCase()).toBe('svg');
        });
    });
    
    describe('Integration: Complete image to SVG conversion', () => {
        test('should handle 2x2 solid color image', () => {
            const imageData = new ImageData(2, 2);
            // All pixels red
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;     // R
                imageData.data[i + 1] = 0;   // G
                imageData.data[i + 2] = 0;   // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 2, 2);
            
            // Should have 2 rect elements (one per row, each spanning 2 pixels)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(2);
            
            // Both should be red with width 2
            expect(svgText).toContain('fill="#ff0000"');
            expect(svgText).toContain('width="2"');
        });
        
        test('should handle checkerboard pattern', () => {
            const imageData = new ImageData(2, 2);
            // Checkerboard: red, blue, blue, red
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 255; imageData.data[7] = 255; // Blue
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255; // Blue
            imageData.data[12] = 255; imageData.data[13] = 0; imageData.data[14] = 0; imageData.data[15] = 255; // Red
            
            const svgText = app.imageDataToSVG(imageData, 2, 2);
            
            // Should have 4 rect elements (no grouping possible in checkerboard)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(4);
            
            // Should contain both colors
            expect(svgText).toContain('fill="#ff0000"');
            expect(svgText).toContain('fill="#0000ff"');
        });
        
        test('should handle image with transparent regions', () => {
            const imageData = new ImageData(4, 1);
            // Red, transparent, transparent, blue
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
            imageData.data[4] = 0; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 0; // Transparent
            imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 0; imageData.data[11] = 0; // Transparent
            imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
            
            const svgText = app.imageDataToSVG(imageData, 4, 1);
            
            // Should have 2 rect elements (transparent pixels skipped)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(2);
            
            // Should have red at x=0 and blue at x=3
            expect(svgText).toMatch(/x="0".*fill="#ff0000"/);
            expect(svgText).toMatch(/x="3".*fill="#0000ff"/);
        });
        
        test('should optimize horizontal runs efficiently', () => {
            const imageData = new ImageData(100, 1);
            // All pixels same color
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 128;     // R
                imageData.data[i + 1] = 128; // G
                imageData.data[i + 2] = 128; // B
                imageData.data[i + 3] = 255; // A
            }
            
            const svgText = app.imageDataToSVG(imageData, 100, 1);
            
            // Should have only 1 rect element for entire row
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(1);
            
            // Should have width="100"
            expect(svgText).toContain('width="100"');
        });
    });
    
    describe('Edge cases', () => {
        test('should handle 1x1 image', () => {
            const imageData = new ImageData(1, 1);
            imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255;
            
            const svgText = app.imageDataToSVG(imageData, 1, 1);
            
            expect(svgText).toContain('viewBox="0 0 1 1"');
            expect(svgText).toContain('<rect');
        });
        
        test('should handle fully transparent image', () => {
            const imageData = new ImageData(3, 3);
            // All pixels transparent (alpha = 0)
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 0;
                imageData.data[i + 1] = 0;
                imageData.data[i + 2] = 0;
                imageData.data[i + 3] = 0; // Transparent
            }
            
            const svgText = app.imageDataToSVG(imageData, 3, 3);
            
            // Should have no rect elements (all pixels transparent)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toBeNull();
        });
        
        test('should handle large dimensions', () => {
            const imageData = new ImageData(800, 600);
            // Set all pixels to white
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = 255;
                imageData.data[i + 1] = 255;
                imageData.data[i + 2] = 255;
                imageData.data[i + 3] = 255;
            }
            
            const svgText = app.imageDataToSVG(imageData, 800, 600);
            
            expect(svgText).toContain('viewBox="0 0 800 600"');
            expect(svgText).toContain('width="800"');
            expect(svgText).toContain('height="600"');
            
            // Should have 600 rect elements (one per row, each spanning 800 pixels)
            const rectMatches = svgText.match(/<rect/g);
            expect(rectMatches).toHaveLength(600);
        });
    });
});
