/**
 * Unit tests for resetToOriginal() method
 * Tests Task 12.1 and 12.2 implementations
 */

const SVGColorAnalyzer = require('./app.js');

// Mock jQuery
global.$ = require('jquery');
global.jQuery = global.$;

describe('SVGColorAnalyzer - Reset to Original', () => {
    let app;
    
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
        
        app = new SVGColorAnalyzer();
    });
    
    describe('resetToOriginal()', () => {
        test('should restore currentSVG from originalSVG', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            const modifiedSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            app.originalSVG = originalSVG;
            app.currentSVG = modifiedSVG;
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify currentSVG was restored
            expect(app.currentSVG).toBe(originalSVG);
            expect(app.currentSVG).not.toBe(modifiedSVG);
        });
        
        test('should clear highlight when resetting', async () => {
            // Set up initial state
            app.originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            app.selectedColor = '#0000ff';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify clearHighlight was called
            expect(app.clearHighlight).toHaveBeenCalled();
        });
        
        test('should re-analyze original SVG', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = originalSVG;
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify analyzeSVG was called with original SVG
            expect(app.analyzeSVG).toHaveBeenCalledWith(originalSVG);
        });
        
        test('should display original SVG', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = originalSVG;
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify displaySVG was called with original SVG
            expect(app.displaySVG).toHaveBeenCalledWith(originalSVG);
        });
        
        test('should update UI after reset', async () => {
            // Set up initial state
            app.originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify updateUI was called
            expect(app.updateUI).toHaveBeenCalled();
        });
        
        test('should execute steps in correct order', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = originalSVG;
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Track call order
            const callOrder = [];
            
            // Mock dependencies with call tracking
            app.clearHighlight = jest.fn(() => callOrder.push('clearHighlight'));
            app.analyzeSVG = jest.fn(() => {
                callOrder.push('analyzeSVG');
                return Promise.resolve();
            });
            app.displaySVG = jest.fn(() => callOrder.push('displaySVG'));
            app.updateUI = jest.fn(() => callOrder.push('updateUI'));
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify correct order: restore -> clear -> analyze -> display -> update
            expect(callOrder).toEqual([
                'clearHighlight',
                'analyzeSVG',
                'displaySVG',
                'updateUI'
            ]);
        });
        
        test('should handle missing originalSVG gracefully', async () => {
            // Set originalSVG to null
            app.originalSVG = null;
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock showError
            app.showError = jest.fn();
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify error was shown
            expect(app.showError).toHaveBeenCalledWith('No original SVG to restore');
            
            // Verify other methods were not called
            expect(app.clearHighlight).not.toHaveBeenCalled();
            expect(app.analyzeSVG).not.toHaveBeenCalled();
            expect(app.displaySVG).not.toHaveBeenCalled();
            expect(app.updateUI).not.toHaveBeenCalled();
        });
        
        test('should handle analyzeSVG errors gracefully', async () => {
            // Set up initial state
            app.originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockRejectedValue(new Error('Analysis failed'));
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            app.showError = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify error was handled
            expect(app.showError).toHaveBeenCalled();
            expect(app.showError).toHaveBeenCalledWith(expect.stringContaining('Failed to reset to original'));
        });
        
        test('should handle displaySVG errors gracefully', async () => {
            // Set up initial state
            app.originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.analyzeSVG = jest.fn().mockResolvedValue();
            app.displaySVG = jest.fn(() => {
                throw new Error('Display failed');
            });
            app.updateUI = jest.fn();
            app.showError = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify error was handled
            expect(app.showError).toHaveBeenCalled();
            expect(app.showError).toHaveBeenCalledWith(expect.stringContaining('Failed to reset to original'));
        });
        
        test('should restore color data to original state', async () => {
            // Set up initial state
            app.originalSVG = '<svg><rect fill="#ff0000"/><rect fill="#00ff00"/></svg>';
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Set up modified color data
            app.colorData = [
                { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, count: 100, percentage: 100 }
            ];
            app.originalColorCount = 2;
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Mock analyzeSVG to restore original colors
            app.analyzeSVG = jest.fn().mockImplementation(() => {
                app.colorData = [
                    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 50, percentage: 50 },
                    { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, count: 50, percentage: 50 }
                ];
                return Promise.resolve();
            });
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify color data was restored
            expect(app.colorData.length).toBe(2);
            expect(app.colorData[0].hex).toBe('#ff0000');
            expect(app.colorData[1].hex).toBe('#00ff00');
        });
    });
    
    describe('Reset button handler', () => {
        test('should call resetToOriginal when reset button is clicked', () => {
            // Mock resetToOriginal
            app.resetToOriginal = jest.fn();
            
            // Simulate button click
            $('#resetBtn').trigger('click');
            
            // Verify resetToOriginal was called
            expect(app.resetToOriginal).toHaveBeenCalled();
        });
    });
    
    describe('Integration: Complete reset flow', () => {
        test('should successfully reset SVG with all steps', async () => {
            // Set up initial state with modified SVG
            const originalSVG = '<svg><rect fill="#ff0000"/><rect fill="#00ff00"/></svg>';
            const modifiedSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            app.originalSVG = originalSVG;
            app.currentSVG = modifiedSVG;
            app.selectedColor = '#0000ff';
            
            // Set up modified color data
            app.colorData = [
                { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, count: 100, percentage: 100 }
            ];
            app.originalColorCount = 2;
            
            // Mock clearHighlight to actually clear the selected color
            const originalClearHighlight = app.clearHighlight.bind(app);
            app.clearHighlight = jest.fn(() => {
                app.selectedColor = null;
            });
            
            // Mock analyzeSVG to restore original colors
            app.analyzeSVG = jest.fn().mockImplementation(async (svgText) => {
                // Simulate re-analysis
                app.colorData = [
                    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 50, percentage: 50 },
                    { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, count: 50, percentage: 50 }
                ];
            });
            
            // Mock displaySVG
            app.displaySVG = jest.fn();
            
            // Mock updateUI
            app.updateUI = jest.fn();
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify complete reset
            expect(app.currentSVG).toBe(originalSVG);
            expect(app.selectedColor).toBeNull();
            expect(app.colorData.length).toBe(2);
            expect(app.clearHighlight).toHaveBeenCalled();
            expect(app.analyzeSVG).toHaveBeenCalledWith(originalSVG);
            expect(app.displaySVG).toHaveBeenCalledWith(originalSVG);
            expect(app.updateUI).toHaveBeenCalled();
        });
        
        test('should reset after color reduction', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/><rect fill="#00ff00"/><rect fill="#0000ff"/></svg>';
            app.originalSVG = originalSVG;
            app.originalColorCount = 3;
            
            // Simulate color reduction
            app.currentSVG = '<svg><rect fill="#ff0000"/><rect fill="#ff0000"/><rect fill="#ff0000"/></svg>';
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 300, percentage: 100 }
            ];
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Mock analyzeSVG to restore original colors
            app.analyzeSVG = jest.fn().mockImplementation(() => {
                app.colorData = [
                    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 33.33 },
                    { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, count: 100, percentage: 33.33 },
                    { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, count: 100, percentage: 33.33 }
                ];
                return Promise.resolve();
            });
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify reset restored original state
            expect(app.currentSVG).toBe(originalSVG);
            expect(app.colorData.length).toBe(3);
        });
        
        test('should reset after color editing', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = originalSVG;
            
            // Simulate color editing
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            app.colorData = [
                { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, count: 100, percentage: 100 }
            ];
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Mock analyzeSVG to restore original colors
            app.analyzeSVG = jest.fn().mockImplementation(() => {
                app.colorData = [
                    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
                ];
                return Promise.resolve();
            });
            
            // Call resetToOriginal
            await app.resetToOriginal();
            
            // Verify reset restored original state
            expect(app.currentSVG).toBe(originalSVG);
            expect(app.colorData[0].hex).toBe('#ff0000');
        });
    });
    
    describe('Property: Reset Idempotence', () => {
        test('calling reset multiple times should produce same result', async () => {
            // Set up initial state
            const originalSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = originalSVG;
            app.currentSVG = '<svg><rect fill="#0000ff"/></svg>';
            
            // Mock dependencies
            app.clearHighlight = jest.fn();
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            app.analyzeSVG = jest.fn().mockImplementation(() => {
                app.colorData = [
                    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
                ];
                return Promise.resolve();
            });
            
            // Call resetToOriginal first time
            await app.resetToOriginal();
            const firstResetSVG = app.currentSVG;
            const firstResetColors = [...app.colorData];
            
            // Call resetToOriginal second time
            await app.resetToOriginal();
            const secondResetSVG = app.currentSVG;
            const secondResetColors = [...app.colorData];
            
            // Verify both resets produce same result
            expect(firstResetSVG).toBe(secondResetSVG);
            expect(firstResetSVG).toBe(originalSVG);
            expect(firstResetColors).toEqual(secondResetColors);
        });
    });
});
