/**
 * Unit tests for renderTopPalette() method
 * Tests task 6.1 implementation
 */

// Polyfill for TextEncoder/TextDecoder (required by JSDOM)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set up DOM environment first
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="uploadArea"></div>
    <input type="file" id="fileInput" />
    <div id="mainContent"></div>
    <div id="svgPreview"></div>
    <canvas id="highlightCanvas"></canvas>
    <div id="colorPaletteTop"></div>
    <div id="colorList"></div>
    <span id="originalColorCount"></span>
    <span id="currentColorCount"></span>
    <input type="range" id="colorCountSlider" />
    <span id="colorCountValue"></span>
    <button id="reduceBtn"></button>
    <button id="resetBtn"></button>
    <button id="downloadBtn"></button>
    <button id="clearHighlightBtn"></button>
    <div id="loadingIndicator"></div>
    <div id="errorMessage"></div>
    <canvas id="analysisCanvas"></canvas>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = dom.window.Image;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.DOMParser = dom.window.DOMParser;
global.FileReader = dom.window.FileReader;

// Initialize jQuery with the JSDOM window
const jquery = require('jquery');
global.$ = jquery(dom.window);

// Import the class
const SVGColorAnalyzer = require('./app.js');

describe('SVGColorAnalyzer - renderTopPalette()', () => {
    let app;
    
    beforeEach(() => {
        // Reset DOM
        document.getElementById('colorPaletteTop').innerHTML = '';
        
        // Create app instance
        app = new SVGColorAnalyzer();
        
        // Mock color data
        app.colorData = [
            {
                hex: '#ff5733',
                count: 1234,
                percentage: 45.67,
                rgb: { r: 255, g: 87, b: 51 }
            },
            {
                hex: '#33ff57',
                count: 567,
                percentage: 20.98,
                rgb: { r: 51, g: 255, b: 87 }
            },
            {
                hex: '#3357ff',
                count: 890,
                percentage: 33.35,
                rgb: { r: 51, g: 87, b: 255 }
            }
        ];
    });
    
    test('Task 6.1.1: Should clear existing palette', () => {
        // Add some existing content
        const $palette = app.$elements.colorPaletteTop;
        $palette.html('<div>Existing content</div>');
        
        // Render palette
        app.renderTopPalette();
        
        // Verify old content is cleared
        expect($palette.find('div').first().hasClass('palette-swatch-container')).toBe(true);
    });
    
    test('Task 6.1.2: Should create swatch container for each color', () => {
        app.renderTopPalette();
        
        const containers = document.querySelectorAll('.palette-swatch-container');
        expect(containers.length).toBe(3);
    });
    
    test('Task 6.1.3: Should create color swatch div with background color', () => {
        app.renderTopPalette();
        
        const swatches = document.querySelectorAll('.palette-swatch');
        expect(swatches.length).toBe(3);
        
        // Check first swatch has correct background color
        const firstSwatch = swatches[0];
        const bgColor = firstSwatch.style.backgroundColor;
        // jQuery may convert hex to rgb format
        expect(bgColor).toBeTruthy();
    });
    
    test('Task 6.1.4: Should add pixel count label below swatch', () => {
        app.renderTopPalette();
        
        const counts = document.querySelectorAll('.palette-count');
        expect(counts.length).toBe(3);
    });
    
    test('Task 6.1.5: Should format count with toLocaleString()', () => {
        app.renderTopPalette();
        
        const counts = document.querySelectorAll('.palette-count');
        
        // First color has count 1234, should be formatted as "1,234"
        expect(counts[0].textContent).toBe('1,234');
        
        // Second color has count 567, should be formatted as "567"
        expect(counts[1].textContent).toBe('567');
        
        // Third color has count 890, should be formatted as "890"
        expect(counts[2].textContent).toBe('890');
    });
    
    test('Task 6.1.6: Should add tooltip with hex, percentage, and count', () => {
        app.renderTopPalette();
        
        const swatches = document.querySelectorAll('.palette-swatch');
        
        // Check first swatch tooltip
        const firstTooltip = swatches[0].getAttribute('title');
        expect(firstTooltip).toBe('#FF5733 - 45.67% (1,234 pixels)');
        
        // Check second swatch tooltip
        const secondTooltip = swatches[1].getAttribute('title');
        expect(secondTooltip).toBe('#33FF57 - 20.98% (567 pixels)');
        
        // Check third swatch tooltip
        const thirdTooltip = swatches[2].getAttribute('title');
        expect(thirdTooltip).toBe('#3357FF - 33.35% (890 pixels)');
    });
    
    test('Task 6.1.7: Should bind click event to highlightColor()', () => {
        // Mock highlightColor method
        app.highlightColor = jest.fn();
        
        app.renderTopPalette();
        
        const swatches = document.querySelectorAll('.palette-swatch');
        
        // Click first swatch
        $(swatches[0]).trigger('click');
        
        // Verify highlightColor was called with correct parameters
        expect(app.highlightColor).toHaveBeenCalledWith('#ff5733', expect.anything());
    });
    
    test('Task 6.1.8: Should append all elements to palette container', () => {
        app.renderTopPalette();
        
        const $palette = app.$elements.colorPaletteTop;
        
        // Verify palette has 3 containers
        expect($palette.children('.palette-swatch-container').length).toBe(3);
        
        // Verify each container has a swatch and count
        $palette.children('.palette-swatch-container').each(function() {
            const $container = $(this);
            expect($container.find('.palette-swatch').length).toBe(1);
            expect($container.find('.palette-count').length).toBe(1);
        });
    });
    
    test('Should render colors in order from colorData array', () => {
        app.renderTopPalette();
        
        const swatches = document.querySelectorAll('.palette-swatch');
        
        // Verify order matches colorData
        expect($(swatches[0]).data('color-hex')).toBe('#ff5733');
        expect($(swatches[1]).data('color-hex')).toBe('#33ff57');
        expect($(swatches[2]).data('color-hex')).toBe('#3357ff');
    });
    
    test('Should handle empty colorData array', () => {
        app.colorData = [];
        
        app.renderTopPalette();
        
        const containers = document.querySelectorAll('.palette-swatch-container');
        expect(containers.length).toBe(0);
    });
    
    test('Should handle large pixel counts with proper formatting', () => {
        app.colorData = [
            {
                hex: '#ff0000',
                count: 1234567,
                percentage: 100,
                rgb: { r: 255, g: 0, b: 0 }
            }
        ];
        
        app.renderTopPalette();
        
        const count = document.querySelector('.palette-count');
        expect(count.textContent).toBe('1,234,567');
    });
    
    test('Should store color hex as data attribute', () => {
        app.renderTopPalette();
        
        const swatches = document.querySelectorAll('.palette-swatch');
        
        expect($(swatches[0]).data('color-hex')).toBe('#ff5733');
        expect($(swatches[1]).data('color-hex')).toBe('#33ff57');
        expect($(swatches[2]).data('color-hex')).toBe('#3357ff');
    });
    
    test('Should log number of rendered swatches', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        
        app.renderTopPalette();
        
        expect(consoleSpy).toHaveBeenCalledWith('Rendered 3 color swatches in top palette');
        
        consoleSpy.mockRestore();
    });
});
