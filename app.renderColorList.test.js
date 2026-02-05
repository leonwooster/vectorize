/**
 * Unit tests for renderColorList() method
 * Task 6.2: Implement renderColorList() method using jQuery
 */

const SVGColorAnalyzer = require('./app.js');

describe('SVGColorAnalyzer - renderColorList()', () => {
    let app;
    let $colorList;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
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
        `;

        // Initialize app
        app = new SVGColorAnalyzer();
        $colorList = $('#colorList');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should clear existing list before rendering', () => {
        // Add some existing content
        $colorList.html('<div>Existing content</div>');
        
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should not contain the old content
        expect($colorList.find('div').first().text()).not.toBe('Existing content');
    });

    test('should create color item for each color', () => {
        // Set up color data with 3 colors
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
            { hex: '#00ff00', percentage: 30, rgb: { r: 0, g: 255, b: 0 } },
            { hex: '#0000ff', percentage: 20, rgb: { r: 0, g: 0, b: 255 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should have 3 color items
        const $items = $colorList.find('.color-item');
        expect($items.length).toBe(3);
    });

    test('should add HTML5 color picker input for each color', () => {
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } },
            { hex: '#00ff00', percentage: 30, rgb: { r: 0, g: 255, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should have 2 color picker inputs
        const $swatches = $colorList.find('input[type="color"]');
        expect($swatches.length).toBe(2);
        
        // Check values
        expect($swatches.eq(0).val()).toBe('#ff0000');
        expect($swatches.eq(1).val()).toBe('#00ff00');
        
        // Check data-index attributes
        expect($swatches.eq(0).attr('data-index')).toBe('0');
        expect($swatches.eq(1).attr('data-index')).toBe('1');
    });

    test('should display hex code in uppercase', () => {
        // Set up color data with lowercase hex
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should display uppercase
        const $hexDisplay = $colorList.find('.color-hex');
        expect($hexDisplay.text()).toBe('#FF0000');
    });

    test('should display percentage with 2 decimal places', () => {
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 33.333333, rgb: { r: 255, g: 0, b: 0 } },
            { hex: '#00ff00', percentage: 66.666666, rgb: { r: 0, g: 255, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Check percentage display
        const $percentages = $colorList.find('.color-percentage');
        expect($percentages.eq(0).text()).toBe('33.33%');
        expect($percentages.eq(1).text()).toBe('66.67%');
    });

    test('should add percentage bar visualization', () => {
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 75, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should have percentage bar
        const $bar = $colorList.find('.percentage-bar');
        expect($bar.length).toBe(1);
        
        // Should have percentage fill
        const $fill = $bar.find('.percentage-fill');
        expect($fill.length).toBe(1);
        
        // Check width
        expect($fill.css('width')).toBe('75%');
    });

    test('should cap percentage bar at 100%', () => {
        // Set up color data with percentage > 100 (edge case)
        app.colorData = [
            { hex: '#ff0000', percentage: 150, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Should cap at 100%
        const $fill = $colorList.find('.percentage-fill');
        expect($fill.css('width')).toBe('100%');
    });

    test('should bind change event to color picker', () => {
        // Mock updateColor method
        app.updateColor = jest.fn();
        
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Trigger change event
        const $swatch = $colorList.find('input[type="color"]').first();
        $swatch.val('#00ff00').trigger('change');
        
        // Should call updateColor with correct parameters
        expect(app.updateColor).toHaveBeenCalledWith(0, '#00ff00');
    });

    test('should handle empty color data', () => {
        // Set up empty color data
        app.colorData = [];
        
        // Render
        app.renderColorList();
        
        // Should have no color items
        const $items = $colorList.find('.color-item');
        expect($items.length).toBe(0);
    });

    test('should create proper DOM structure', () => {
        // Set up color data
        app.colorData = [
            { hex: '#ff0000', percentage: 50, rgb: { r: 255, g: 0, b: 0 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Check structure
        const $item = $colorList.find('.color-item').first();
        expect($item.length).toBe(1);
        
        // Should have color swatch
        expect($item.find('.color-swatch').length).toBe(1);
        
        // Should have color info container
        const $info = $item.find('.color-info');
        expect($info.length).toBe(1);
        
        // Should have hex, percentage, and bar inside info
        expect($info.find('.color-hex').length).toBe(1);
        expect($info.find('.color-percentage').length).toBe(1);
        expect($info.find('.percentage-bar').length).toBe(1);
    });

    test('should handle multiple colors with different percentages', () => {
        // Set up color data with various percentages
        app.colorData = [
            { hex: '#ff0000', percentage: 45.67, rgb: { r: 255, g: 0, b: 0 } },
            { hex: '#00ff00', percentage: 23.45, rgb: { r: 0, g: 255, b: 0 } },
            { hex: '#0000ff', percentage: 15.89, rgb: { r: 0, g: 0, b: 255 } },
            { hex: '#ffff00', percentage: 10.12, rgb: { r: 255, g: 255, b: 0 } },
            { hex: '#ff00ff', percentage: 4.87, rgb: { r: 255, g: 0, b: 255 } }
        ];
        
        // Render
        app.renderColorList();
        
        // Check all items rendered
        const $items = $colorList.find('.color-item');
        expect($items.length).toBe(5);
        
        // Check percentages
        const $percentages = $colorList.find('.color-percentage');
        expect($percentages.eq(0).text()).toBe('45.67%');
        expect($percentages.eq(1).text()).toBe('23.45%');
        expect($percentages.eq(2).text()).toBe('15.89%');
        expect($percentages.eq(3).text()).toBe('10.12%');
        expect($percentages.eq(4).text()).toBe('4.87%');
    });
});
