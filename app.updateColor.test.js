/**
 * Unit tests for updateColor() and replaceColorInSVG() methods
 * Tests Task 9.1 and Task 9.2 implementations
 */

const SVGColorAnalyzer = require('./app.js');

// Mock jQuery
global.$ = require('jquery');
global.jQuery = global.$;

describe('SVGColorAnalyzer - Color Editing', () => {
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
    
    describe('updateColor()', () => {
        test('should update color in colorData', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 50 },
                { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, count: 100, percentage: 50 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Update first color from red to blue
            app.updateColor(0, '#0000ff');
            
            // Verify colorData was updated
            expect(app.colorData[0].hex).toBe('#0000ff');
            expect(app.colorData[0].rgb).toEqual({ r: 0, g: 0, b: 255 });
            
            // Verify displaySVG and updateUI were called
            expect(app.displaySVG).toHaveBeenCalled();
            expect(app.updateUI).toHaveBeenCalled();
        });
        
        test('should update currentSVG with new color', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Update color
            app.updateColor(0, '#0000ff');
            
            // Verify SVG was updated
            expect(app.currentSVG).toContain('#0000ff');
            expect(app.currentSVG).not.toContain('#ff0000');
        });
        
        test('should handle invalid index gracefully', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Try to update with invalid index
            app.updateColor(-1, '#0000ff');
            app.updateColor(10, '#0000ff');
            
            // Verify nothing was changed
            expect(app.colorData[0].hex).toBe('#ff0000');
            expect(app.displaySVG).not.toHaveBeenCalled();
            expect(app.updateUI).not.toHaveBeenCalled();
        });
        
        test('should handle invalid hex color gracefully', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Try to update with invalid hex
            app.updateColor(0, null);
            app.updateColor(0, '');
            app.updateColor(0, 'invalid');
            
            // Verify nothing was changed
            expect(app.colorData[0].hex).toBe('#ff0000');
        });
        
        test('should not update if color is the same', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Update with same color
            app.updateColor(0, '#ff0000');
            
            // Verify displaySVG and updateUI were not called
            expect(app.displaySVG).not.toHaveBeenCalled();
            expect(app.updateUI).not.toHaveBeenCalled();
        });
        
        test('should normalize hex to lowercase', () => {
            // Set up initial state
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = '<svg><rect fill="#ff0000"/></svg>';
            app.originalSVG = app.currentSVG;
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Update with uppercase hex
            app.updateColor(0, '#0000FF');
            
            // Verify hex was normalized to lowercase
            expect(app.colorData[0].hex).toBe('#0000ff');
        });
    });
    
    describe('replaceColorInSVG()', () => {
        test('should replace lowercase hex format', () => {
            const svgText = '<svg><rect fill="#ff0000"/><circle stroke="#ff0000"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            expect(result).toContain('#0000ff');
            expect(result).not.toContain('#ff0000');
            expect(result).toContain('fill="#0000ff"');
            expect(result).toContain('stroke="#0000ff"');
        });
        
        test('should replace uppercase hex format', () => {
            const svgText = '<svg><rect fill="#FF0000"/><circle stroke="#FF0000"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#FF0000', '#0000ff');
            
            expect(result).toContain('#0000ff');
            expect(result).not.toContain('#FF0000');
        });
        
        test('should replace mixed case hex format', () => {
            const svgText = '<svg><rect fill="#Ff0000"/><circle stroke="#fF0000"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            expect(result).toContain('#0000ff');
            expect(result).not.toContain('#Ff0000');
            expect(result).not.toContain('#fF0000');
        });
        
        test('should replace RGB format with spaces', () => {
            const svgText = '<svg><rect fill="rgb(255, 0, 0)"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            expect(result).toContain('#0000ff');
            expect(result).not.toContain('rgb(255, 0, 0)');
        });
        
        test('should replace RGB format without spaces', () => {
            const svgText = '<svg><rect fill="rgb(255,0,0)"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            expect(result).toContain('#0000ff');
            expect(result).not.toContain('rgb(255,0,0)');
        });
        
        test('should replace multiple occurrences', () => {
            const svgText = `
                <svg>
                    <rect fill="#ff0000"/>
                    <circle stroke="#ff0000"/>
                    <path fill="rgb(255, 0, 0)"/>
                    <ellipse fill="#FF0000"/>
                </svg>
            `;
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            // Count occurrences of new color
            const matches = result.match(/#0000ff/g);
            expect(matches).not.toBeNull();
            expect(matches.length).toBeGreaterThanOrEqual(4);
            
            // Verify old color is gone
            expect(result).not.toContain('#ff0000');
            expect(result).not.toContain('#FF0000');
            expect(result).not.toContain('rgb(255, 0, 0)');
        });
        
        test('should handle SVG with no matching colors', () => {
            const svgText = '<svg><rect fill="#00ff00"/></svg>';
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            // Should return unchanged SVG
            expect(result).toBe(svgText);
            expect(result).toContain('#00ff00');
        });
        
        test('should handle invalid inputs gracefully', () => {
            // Test with null/undefined SVG
            expect(app.replaceColorInSVG(null, '#ff0000', '#0000ff')).toBeNull();
            expect(app.replaceColorInSVG(undefined, '#ff0000', '#0000ff')).toBeUndefined();
            
            // Test with empty SVG
            expect(app.replaceColorInSVG('', '#ff0000', '#0000ff')).toBe('');
            
            // Test with invalid colors
            const svgText = '<svg><rect fill="#ff0000"/></svg>';
            expect(app.replaceColorInSVG(svgText, null, '#0000ff')).toBe(svgText);
            expect(app.replaceColorInSVG(svgText, '#ff0000', null)).toBe(svgText);
        });
        
        test('should preserve SVG structure', () => {
            const svgText = `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="10" width="80" height="80" fill="#ff0000"/>
                </svg>
            `;
            const result = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            
            // Verify structure is preserved
            expect(result).toContain('viewBox="0 0 100 100"');
            expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
            expect(result).toContain('x="10"');
            expect(result).toContain('y="10"');
            expect(result).toContain('width="80"');
            expect(result).toContain('height="80"');
        });
        
        test('should handle colors with # prefix or without', () => {
            const svgText = '<svg><rect fill="#ff0000"/></svg>';
            
            // Test with # prefix
            const result1 = app.replaceColorInSVG(svgText, '#ff0000', '#0000ff');
            expect(result1).toContain('#0000ff');
            
            // Test without # prefix (should still work)
            const result2 = app.replaceColorInSVG(svgText, 'ff0000', '0000ff');
            expect(result2).toContain('#0000ff');
        });
    });
    
    describe('Integration: updateColor() with replaceColorInSVG()', () => {
        test('should update color throughout entire SVG', () => {
            // Set up complex SVG with multiple color formats
            app.colorData = [
                { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, count: 100, percentage: 100 }
            ];
            app.currentSVG = `
                <svg>
                    <rect fill="#ff0000"/>
                    <circle stroke="#FF0000"/>
                    <path fill="rgb(255, 0, 0)"/>
                </svg>
            `;
            app.originalSVG = app.currentSVG;
            
            // Mock displaySVG and updateUI
            app.displaySVG = jest.fn();
            app.updateUI = jest.fn();
            
            // Update color
            app.updateColor(0, '#0000ff');
            
            // Verify all formats were replaced
            expect(app.currentSVG).toContain('#0000ff');
            expect(app.currentSVG).not.toContain('#ff0000');
            expect(app.currentSVG).not.toContain('#FF0000');
            expect(app.currentSVG).not.toContain('rgb(255, 0, 0)');
        });
    });
});
