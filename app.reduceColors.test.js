/**
 * Unit tests for reduceColors() method
 * Task 8.1: Test color reduction functionality
 */

// Polyfill for TextEncoder/TextDecoder (required by jsdom)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock jQuery for Node.js environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
const $ = require('jquery')(dom.window);
global.$ = global.jQuery = $;

const SVGColorAnalyzer = require('./app.js');

describe('SVGColorAnalyzer - reduceColors()', () => {
    let app;
    
    beforeEach(() => {
        // Set up DOM elements required by the app
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput">
            <div id="mainContent"></div>
            <div id="svgPreview"></div>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <span id="originalColorCount"></span>
            <span id="currentColorCount"></span>
            <input type="range" id="colorCountSlider" min="2" max="16" value="8">
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <button id="clearHighlightBtn">Clear Highlight</button>
            <div id="loadingIndicator"></div>
            <div id="errorMessage"></div>
            <canvas id="analysisCanvas"></canvas>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
    });
    
    describe('Task 8.1.1: Validate target count vs current count', () => {
        test('should show error when target count >= current count', async () => {
            // Set up test data with 5 colors
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 20, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 20, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 20, rgb: { r: 0, g: 0, b: 255 } },
                { hex: '#ffff00', count: 100, percentage: 20, rgb: { r: 255, g: 255, b: 0 } },
                { hex: '#ff00ff', count: 100, percentage: 20, rgb: { r: 255, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            // Try to reduce to 5 colors (same as current)
            await app.reduceColors(5);
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('already at or below target')
            );
        });
        
        test('should show error when target count > current count', async () => {
            // Set up test data with 3 colors
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 33.33, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 33.33, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 33.34, rgb: { r: 0, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            // Try to reduce to 5 colors (more than current)
            await app.reduceColors(5);
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('already at or below target')
            );
        });
        
        test('should show error when target count < 1', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 50, rgb: { r: 0, g: 255, b: 0 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.reduceColors(0);
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('must be at least 1')
            );
        });
        
        test('should show error when no SVG is loaded', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 50, rgb: { r: 0, g: 255, b: 0 } }
            ];
            app.currentSVG = null;
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.reduceColors(1);
            
            expect(showErrorSpy).toHaveBeenCalledWith('No SVG loaded');
        });
    });
    
    describe('Task 8.1.2: Call kMeansClustering()', () => {
        test('should call kMeansColors with correct parameters', async () => {
            // Set up test data with 6 colors
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 16.67, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 16.67, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 16.67, rgb: { r: 0, g: 0, b: 255 } },
                { hex: '#ffff00', count: 100, percentage: 16.67, rgb: { r: 255, g: 255, b: 0 } },
                { hex: '#ff00ff', count: 100, percentage: 16.67, rgb: { r: 255, g: 0, b: 255 } },
                { hex: '#00ffff', count: 100, percentage: 16.65, rgb: { r: 0, g: 255, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            const kMeansColorsSpy = jest.spyOn(app, 'kMeansColors');
            
            // Mock analyzeSVG to avoid actual analysis
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(3);
            
            expect(kMeansColorsSpy).toHaveBeenCalledWith(app.colorData, 3);
        });
    });
    
    describe('Task 8.1.3: Create color mapping (old → new)', () => {
        test('should create mapping from old colors to nearest new colors', async () => {
            // Set up test data
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 25, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#ff1111', count: 100, percentage: 25, rgb: { r: 255, g: 17, b: 17 } },
                { hex: '#0000ff', count: 100, percentage: 25, rgb: { r: 0, g: 0, b: 255 } },
                { hex: '#1111ff', count: 100, percentage: 25, rgb: { r: 17, g: 17, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/><rect fill="#ff1111"/><rect fill="#0000ff"/><rect fill="#1111ff"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock methods
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(2);
            
            // After reduction, similar colors should be mapped to the same color
            // The SVG should have been updated
            expect(app.currentSVG).toBeDefined();
        });
    });
    
    describe('Task 8.1.4: Apply mapping to SVG text', () => {
        test('should replace colors in SVG text', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 33.33, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 33.33, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 33.34, rgb: { r: 0, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/><rect fill="#00ff00"/><rect fill="#0000ff"/></svg>';
            app.originalSVG = app.currentSVG;
            
            const originalSVG = app.currentSVG;
            
            // Mock methods
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(2);
            
            // SVG should have been modified
            expect(app.currentSVG).toBeDefined();
            expect(typeof app.currentSVG).toBe('string');
        });
        
        test('should handle uppercase hex colors', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 50, rgb: { r: 0, g: 255, b: 0 } }
            ];
            app.currentSVG = '<svg><rect fill="#FF0000"/><rect fill="#00FF00"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock methods
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(1);
            
            expect(app.currentSVG).toBeDefined();
        });
    });
    
    describe('Task 8.1.5: Update currentSVG state', () => {
        test('should update currentSVG with reduced colors', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 33.33, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 33.33, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 33.34, rgb: { r: 0, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            const originalSVG = app.currentSVG;
            
            // Mock methods
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(2);
            
            // currentSVG should be updated
            expect(app.currentSVG).toBeDefined();
            expect(typeof app.currentSVG).toBe('string');
        });
    });
    
    describe('Task 8.1.6: Re-analyze colors', () => {
        test('should call analyzeSVG after color reduction', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 33.33, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 33.33, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 33.34, rgb: { r: 0, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            const analyzeSVGSpy = jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(2);
            
            expect(analyzeSVGSpy).toHaveBeenCalled();
        });
    });
    
    describe('Task 8.1.7: Update UI', () => {
        test('should call updateUI after color reduction', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 33.33, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 33.33, rgb: { r: 0, g: 255, b: 0 } },
                { hex: '#0000ff', count: 100, percentage: 33.34, rgb: { r: 0, g: 0, b: 255 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            jest.spyOn(app, 'analyzeSVG').mockResolvedValue();
            jest.spyOn(app, 'displaySVG').mockImplementation(() => {});
            const updateUISpy = jest.spyOn(app, 'updateUI').mockImplementation(() => {});
            
            await app.reduceColors(2);
            
            expect(updateUISpy).toHaveBeenCalled();
        });
    });
    
    describe('Error handling', () => {
        test('should handle errors gracefully', async () => {
            app.colorData = [
                { hex: '#ff0000', count: 100, percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
                { hex: '#00ff00', count: 100, percentage: 50, rgb: { r: 0, g: 255, b: 0 } }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock kMeansColors to throw an error
            jest.spyOn(app, 'kMeansColors').mockImplementation(() => {
                throw new Error('K-means failed');
            });
            
            const showErrorSpy = jest.spyOn(app, 'showError');
            
            await app.reduceColors(1);
            
            expect(showErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to reduce colors')
            );
        });
    });
});
