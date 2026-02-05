/**
 * Unit tests for analyzeSVG() method and related helpers
 * Tests for task 5.1: Implement analyzeSVG() method
 * Tests for task 5.2: Implement analyzePixels() method
 * Tests for task 5.3: Implement getSVGBoundingBox() helper method
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

describe('getSVGBoundingBox() Helper Method', () => {
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
    
    test('should extract dimensions from viewBox attribute', () => {
        const svgText = '<svg viewBox="0 0 200 150"></svg>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        const { width, height } = app.getSVGBoundingBox(svgElement);
        
        expect(width).toBe(200);
        expect(height).toBe(150);
    });
    
    test('should extract dimensions from width/height attributes', () => {
        const svgText = '<svg width="300" height="200"></svg>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        const { width, height } = app.getSVGBoundingBox(svgElement);
        
        expect(width).toBe(300);
        expect(height).toBe(200);
    });
    
    test('should prefer viewBox over width/height attributes', () => {
        const svgText = '<svg viewBox="0 0 100 100" width="300" height="200"></svg>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        const { width, height } = app.getSVGBoundingBox(svgElement);
        
        expect(width).toBe(100);
        expect(height).toBe(100);
    });
    
    test('should handle width/height with units (px)', () => {
        const svgText = '<svg width="250px" height="180px"></svg>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        const { width, height } = app.getSVGBoundingBox(svgElement);
        
        expect(width).toBe(250);
        expect(height).toBe(180);
    });
    
    test('should use default dimensions when no dimensions specified', () => {
        const svgText = '<svg></svg>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.documentElement;
        
        const { width, height } = app.getSVGBoundingBox(svgElement);
        
        expect(width).toBe(300); // Default SVG width
        expect(height).toBe(150); // Default SVG height
    });
});

describe('analyzePixels() Method', () => {
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
    
    test('should count colors correctly in single-color image', () => {
        const imageData = new ImageData(2, 2);
        // All pixels red
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255;     // R
            imageData.data[i + 1] = 0;   // G
            imageData.data[i + 2] = 0;   // B
            imageData.data[i + 3] = 255; // A
        }
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(1);
        expect(colorData[0].hex).toBe('#ff0000');
        expect(colorData[0].count).toBe(4);
        expect(colorData[0].percentage).toBe(100);
    });
    
    test('should count colors correctly in multi-color image', () => {
        const imageData = new ImageData(2, 2);
        // 2 red, 2 blue pixels
        imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
        imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255; // Red
        imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 255; imageData.data[11] = 255; // Blue
        imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(2);
        // Should be sorted by count (descending), so both have same count
        expect(colorData[0].count).toBe(2);
        expect(colorData[1].count).toBe(2);
        expect(colorData[0].percentage).toBe(50);
        expect(colorData[1].percentage).toBe(50);
    });
    
    test('should skip transparent pixels (alpha < 10)', () => {
        const imageData = new ImageData(2, 2);
        // 2 red, 2 transparent
        imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
        imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255; // Red
        imageData.data[8] = 0; imageData.data[9] = 0; imageData.data[10] = 0; imageData.data[11] = 0; // Transparent
        imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 0; imageData.data[15] = 5; // Transparent
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(1);
        expect(colorData[0].hex).toBe('#ff0000');
        expect(colorData[0].count).toBe(2);
        expect(colorData[0].percentage).toBe(100); // 100% of non-transparent pixels
    });
    
    test('should sort colors by count in descending order', () => {
        const imageData = new ImageData(4, 1);
        // 1 red, 2 green, 1 blue
        imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
        imageData.data[4] = 0; imageData.data[5] = 255; imageData.data[6] = 0; imageData.data[7] = 255; // Green
        imageData.data[8] = 0; imageData.data[9] = 255; imageData.data[10] = 0; imageData.data[11] = 255; // Green
        imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(3);
        expect(colorData[0].hex).toBe('#00ff00'); // Green (most common)
        expect(colorData[0].count).toBe(2);
        expect(colorData[1].count).toBe(1);
        expect(colorData[2].count).toBe(1);
    });
    
    test('should calculate percentages correctly', () => {
        const imageData = new ImageData(4, 1);
        // 3 red, 1 blue
        imageData.data[0] = 255; imageData.data[1] = 0; imageData.data[2] = 0; imageData.data[3] = 255; // Red
        imageData.data[4] = 255; imageData.data[5] = 0; imageData.data[6] = 0; imageData.data[7] = 255; // Red
        imageData.data[8] = 255; imageData.data[9] = 0; imageData.data[10] = 0; imageData.data[11] = 255; // Red
        imageData.data[12] = 0; imageData.data[13] = 0; imageData.data[14] = 255; imageData.data[15] = 255; // Blue
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(2);
        expect(colorData[0].hex).toBe('#ff0000');
        expect(colorData[0].percentage).toBe(75);
        expect(colorData[1].hex).toBe('#0000ff');
        expect(colorData[1].percentage).toBe(25);
    });
    
    test('should return ColorInfo objects with correct structure', () => {
        const imageData = new ImageData(1, 1);
        imageData.data[0] = 128; imageData.data[1] = 64; imageData.data[2] = 32; imageData.data[3] = 255;
        
        const colorData = app.analyzePixels(imageData);
        
        expect(colorData).toHaveLength(1);
        expect(colorData[0]).toHaveProperty('hex');
        expect(colorData[0]).toHaveProperty('count');
        expect(colorData[0]).toHaveProperty('percentage');
        expect(colorData[0]).toHaveProperty('rgb');
        expect(colorData[0].rgb).toHaveProperty('r');
        expect(colorData[0].rgb).toHaveProperty('g');
        expect(colorData[0].rgb).toHaveProperty('b');
    });
});
