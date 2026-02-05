/**
 * Unit tests for downloadSVG() method
 * Tests Task 11.1, 11.2, and 11.3 implementations
 */

const SVGColorAnalyzer = require('./app.js');

// Mock jQuery
global.$ = require('jquery');
global.jQuery = global.$;

describe('SVGColorAnalyzer - Download SVG', () => {
    let app;
    let createElementSpy;
    let createObjectURLSpy;
    let revokeObjectURLSpy;
    
    beforeEach(() => {
        // Set up DOM elements
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
        
        // Mock URL.createObjectURL and URL.revokeObjectURL (they don't exist in JSDOM)
        if (!global.URL.createObjectURL) {
            global.URL.createObjectURL = jest.fn();
        }
        if (!global.URL.revokeObjectURL) {
            global.URL.revokeObjectURL = jest.fn();
        }
        
        createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
        revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
        
        // Mock document.createElement to track anchor creation
        createElementSpy = jest.spyOn(document, 'createElement');
        
        app = new SVGColorAnalyzer();
    });
    
    afterEach(() => {
        if (createObjectURLSpy) createObjectURLSpy.mockRestore();
        if (revokeObjectURLSpy) revokeObjectURLSpy.mockRestore();
        if (createElementSpy) createElementSpy.mockRestore();
        jest.clearAllTimers();
    });
    
    describe('downloadSVG()', () => {
        test('should create Blob from currentSVG', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Mock Blob constructor
            const blobSpy = jest.spyOn(global, 'Blob');
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify Blob was created with correct content and type
            expect(blobSpy).toHaveBeenCalledWith(
                [app.currentSVG],
                { type: 'image/svg+xml;charset=utf-8' }
            );
            
            blobSpy.mockRestore();
        });
        
        test('should generate object URL from Blob', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify URL.createObjectURL was called
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
        });
        
        test('should create temporary anchor element with correct attributes', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify anchor element was created
            expect(createElementSpy).toHaveBeenCalledWith('a');
        });
        
        test('should set default filename to "optimized.svg"', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Spy on createElement to verify anchor is created with download attribute
            const createElementCalls = [];
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const element = originalCreateElement(tag);
                createElementCalls.push({ tag, element });
                return element;
            });
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Find the anchor element that was created
            const anchorCall = createElementCalls.find(call => call.tag === 'a');
            expect(anchorCall).toBeDefined();
            expect(anchorCall.element.download).toBe('optimized.svg');
        });
        
        test('should trigger download by clicking anchor', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Spy on createElement and mock click
            let clickWasCalled = false;
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const element = originalCreateElement(tag);
                if (tag === 'a') {
                    const originalClick = element.click.bind(element);
                    element.click = () => {
                        clickWasCalled = true;
                        // Don't call original to avoid actual download
                    };
                }
                return element;
            });
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify click was called
            expect(clickWasCalled).toBe(true);
        });
        
        test('should clean up object URL after download', (done) => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Use fake timers
            jest.useFakeTimers();
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify URL.revokeObjectURL was not called immediately
            expect(revokeObjectURLSpy).not.toHaveBeenCalled();
            
            // Fast-forward time by 100ms
            jest.advanceTimersByTime(100);
            
            // Verify URL.revokeObjectURL was called after timeout
            expect(revokeObjectURLSpy).toHaveBeenCalled();
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
            
            jest.useRealTimers();
            done();
        });
        
        test('should remove anchor element from document after download', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Get initial anchor count
            const initialAnchorCount = document.querySelectorAll('a').length;
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify anchor was removed (count should be same as before)
            const finalAnchorCount = document.querySelectorAll('a').length;
            expect(finalAnchorCount).toBe(initialAnchorCount);
        });
        
        test('should handle missing currentSVG gracefully', () => {
            // Set currentSVG to null
            app.currentSVG = null;
            
            // Mock showError
            app.showError = jest.fn();
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify error was shown
            expect(app.showError).toHaveBeenCalledWith('No SVG to download');
            
            // Verify no Blob or URL was created
            expect(createObjectURLSpy).not.toHaveBeenCalled();
        });
        
        test('should handle empty currentSVG gracefully', () => {
            // Set currentSVG to empty string
            app.currentSVG = '';
            
            // Mock showError
            app.showError = jest.fn();
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify error was shown
            expect(app.showError).toHaveBeenCalledWith('No SVG to download');
        });
        
        test('should handle Blob creation errors', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Mock Blob to throw error
            const originalBlob = global.Blob;
            global.Blob = jest.fn(() => {
                throw new Error('Blob creation failed');
            });
            
            // Mock showError
            app.showError = jest.fn();
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify error was handled
            expect(app.showError).toHaveBeenCalled();
            expect(app.showError).toHaveBeenCalledWith(expect.stringContaining('Failed to download SVG'));
            
            // Restore Blob
            global.Blob = originalBlob;
        });
        
        test('should set correct href on anchor element', () => {
            // Set up SVG content
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Spy on createElement to verify anchor href
            const createElementCalls = [];
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const element = originalCreateElement(tag);
                createElementCalls.push({ tag, element });
                return element;
            });
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Find the anchor element that was created
            const anchorCall = createElementCalls.find(call => call.tag === 'a');
            expect(anchorCall).toBeDefined();
            expect(anchorCall.element.href).toContain('blob:mock-url');
        });
    });
    
    describe('Download button handler', () => {
        test('should call downloadSVG when download button is clicked', () => {
            // Mock downloadSVG
            app.downloadSVG = jest.fn();
            
            // Simulate button click
            $('#downloadBtn').trigger('click');
            
            // Verify downloadSVG was called
            expect(app.downloadSVG).toHaveBeenCalled();
        });
    });
    
    describe('Integration: Complete download flow', () => {
        test('should successfully download SVG with all steps', () => {
            // Set up SVG content
            app.currentSVG = '<svg viewBox="0 0 100 100"><rect fill="#ff0000"/></svg>';
            
            // Track anchor click
            let clickWasCalled = false;
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const element = originalCreateElement(tag);
                if (tag === 'a') {
                    const originalClick = element.click.bind(element);
                    element.click = () => {
                        clickWasCalled = true;
                        // Don't call original to avoid actual download
                    };
                }
                return element;
            });
            
            // Use fake timers
            jest.useFakeTimers();
            
            // Call downloadSVG
            app.downloadSVG();
            
            // Verify all steps were executed
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(clickWasCalled).toBe(true);
            
            // Fast-forward time
            jest.advanceTimersByTime(100);
            
            expect(revokeObjectURLSpy).toHaveBeenCalled();
            
            jest.useRealTimers();
        });
    });
});
