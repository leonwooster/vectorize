/**
 * Unit tests for colorsMatch() helper method
 * Task 7.3: Implement colorsMatch() helper method
 */

// Mock jQuery for Node.js environment
if (typeof $ === 'undefined') {
    global.$ = require('jquery');
    global.jQuery = global.$;
}

const SVGColorAnalyzer = require('./app.js');

describe('SVGColorAnalyzer - colorsMatch() method', () => {
    let app;
    
    beforeEach(() => {
        // Set up minimal DOM structure
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" />
            <div id="mainContent"></div>
            <div id="svgPreview"></div>
            <canvas id="analysisCanvas"></canvas>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop"></div>
            <div id="colorList"></div>
            <button id="clearHighlightBtn"></button>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" value="8" />
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
            <div id="loadingIndicator"></div>
            <div id="errorMessage"></div>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 7.3.1: Compare RGB values with tolerance', () => {
        test('should return true for identical colors', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 100, g: 100, b: 100 };
            
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
        });
        
        test('should return true for colors within tolerance', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 110, g: 105, b: 95 };
            
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
        });
        
        test('should return false for colors outside tolerance', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 120, g: 120, b: 120 };
            
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(false);
        });
        
        test('should handle edge case at exact tolerance boundary', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 115, g: 115, b: 115 };
            
            // Exactly at tolerance (difference of 15)
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
        });
        
        test('should handle edge case just outside tolerance', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 116, g: 100, b: 100 };
            
            // Just outside tolerance (difference of 16)
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(false);
        });
        
        test('should work with different tolerance values', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 125, g: 100, b: 100 };
            
            expect(app.colorsMatch(rgb1, rgb2, 10)).toBe(false);
            expect(app.colorsMatch(rgb1, rgb2, 25)).toBe(true);
            expect(app.colorsMatch(rgb1, rgb2, 30)).toBe(true);
        });
        
        test('should handle black color (0, 0, 0)', () => {
            const black = { r: 0, g: 0, b: 0 };
            const nearBlack = { r: 10, g: 10, b: 10 };
            
            expect(app.colorsMatch(black, nearBlack, 15)).toBe(true);
            expect(app.colorsMatch(black, nearBlack, 5)).toBe(false);
        });
        
        test('should handle white color (255, 255, 255)', () => {
            const white = { r: 255, g: 255, b: 255 };
            const nearWhite = { r: 245, g: 245, b: 245 };
            
            expect(app.colorsMatch(white, nearWhite, 15)).toBe(true);
            expect(app.colorsMatch(white, nearWhite, 5)).toBe(false);
        });
        
        test('should handle pure red', () => {
            const red = { r: 255, g: 0, b: 0 };
            const nearRed = { r: 245, g: 10, b: 10 };
            
            expect(app.colorsMatch(red, nearRed, 15)).toBe(true);
        });
        
        test('should handle pure green', () => {
            const green = { r: 0, g: 255, b: 0 };
            const nearGreen = { r: 10, g: 245, b: 10 };
            
            expect(app.colorsMatch(green, nearGreen, 15)).toBe(true);
        });
        
        test('should handle pure blue', () => {
            const blue = { r: 0, g: 0, b: 255 };
            const nearBlue = { r: 10, g: 10, b: 245 };
            
            expect(app.colorsMatch(blue, nearBlue, 15)).toBe(true);
        });
    });
    
    describe('Task 7.3.2: Return boolean result', () => {
        test('should return boolean type', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 100, g: 100, b: 100 };
            
            const result = app.colorsMatch(rgb1, rgb2, 15);
            expect(typeof result).toBe('boolean');
        });
        
        test('should require all channels to match', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            
            // Only R matches
            expect(app.colorsMatch(rgb1, { r: 100, g: 120, b: 120 }, 15)).toBe(false);
            
            // Only G matches
            expect(app.colorsMatch(rgb1, { r: 120, g: 100, b: 120 }, 15)).toBe(false);
            
            // Only B matches
            expect(app.colorsMatch(rgb1, { r: 120, g: 120, b: 100 }, 15)).toBe(false);
            
            // All match
            expect(app.colorsMatch(rgb1, { r: 100, g: 100, b: 100 }, 15)).toBe(true);
        });
        
        test('should require all channels within tolerance', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            
            // R and G within tolerance, B outside
            expect(app.colorsMatch(rgb1, { r: 110, g: 110, b: 120 }, 15)).toBe(false);
            
            // R and B within tolerance, G outside
            expect(app.colorsMatch(rgb1, { r: 110, g: 120, b: 110 }, 15)).toBe(false);
            
            // G and B within tolerance, R outside
            expect(app.colorsMatch(rgb1, { r: 120, g: 110, b: 110 }, 15)).toBe(false);
            
            // All within tolerance
            expect(app.colorsMatch(rgb1, { r: 110, g: 110, b: 110 }, 15)).toBe(true);
        });
    });
    
    describe('Default tolerance parameter', () => {
        test('should use default tolerance of 15', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 110, g: 110, b: 110 };
            
            // Should use default tolerance of 15
            expect(app.colorsMatch(rgb1, rgb2)).toBe(true);
        });
        
        test('should work without tolerance parameter', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 116, g: 100, b: 100 };
            
            // Should use default tolerance of 15, so this should be false
            expect(app.colorsMatch(rgb1, rgb2)).toBe(false);
        });
    });
    
    describe('Symmetry property', () => {
        test('should be symmetric', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 110, g: 105, b: 95 };
            
            // colorsMatch should be symmetric
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(app.colorsMatch(rgb2, rgb1, 15));
        });
        
        test('should be symmetric for edge cases', () => {
            const rgb1 = { r: 0, g: 0, b: 0 };
            const rgb2 = { r: 255, g: 255, b: 255 };
            
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(app.colorsMatch(rgb2, rgb1, 15));
        });
        
        test('should be symmetric for boundary values', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 115, g: 115, b: 115 };
            
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(app.colorsMatch(rgb2, rgb1, 15));
        });
    });
    
    describe('Tolerance edge cases', () => {
        test('should handle tolerance of 0', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 100, g: 100, b: 100 };
            const rgb3 = { r: 101, g: 100, b: 100 };
            
            expect(app.colorsMatch(rgb1, rgb2, 0)).toBe(true);
            expect(app.colorsMatch(rgb1, rgb3, 0)).toBe(false);
        });
        
        test('should handle large tolerance', () => {
            const rgb1 = { r: 0, g: 0, b: 0 };
            const rgb2 = { r: 255, g: 255, b: 255 };
            
            expect(app.colorsMatch(rgb1, rgb2, 255)).toBe(true);
            expect(app.colorsMatch(rgb1, rgb2, 254)).toBe(false);
        });
        
        test('should handle negative differences', () => {
            const rgb1 = { r: 150, g: 150, b: 150 };
            const rgb2 = { r: 140, g: 140, b: 140 };
            
            // Difference is -10, which should be within tolerance of 15
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
        });
    });
    
    describe('Real-world color matching scenarios', () => {
        test('should match similar shades of red', () => {
            const red1 = { r: 200, g: 0, b: 0 };
            const red2 = { r: 210, g: 5, b: 5 };
            
            expect(app.colorsMatch(red1, red2, 15)).toBe(true);
        });
        
        test('should not match red and green', () => {
            const red = { r: 255, g: 0, b: 0 };
            const green = { r: 0, g: 255, b: 0 };
            
            expect(app.colorsMatch(red, green, 15)).toBe(false);
        });
        
        test('should match grayscale colors within tolerance', () => {
            const gray1 = { r: 128, g: 128, b: 128 };
            const gray2 = { r: 135, g: 135, b: 135 };
            
            expect(app.colorsMatch(gray1, gray2, 15)).toBe(true);
        });
        
        test('should handle skin tone variations', () => {
            const skin1 = { r: 255, g: 219, b: 172 };
            const skin2 = { r: 250, g: 215, b: 170 };
            
            expect(app.colorsMatch(skin1, skin2, 15)).toBe(true);
        });
    });
});
