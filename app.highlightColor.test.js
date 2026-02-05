/**
 * Unit tests for highlightColor() method
 * Task 7.1: Implement highlightColor() method
 */

// Mock jQuery for Node.js environment
if (typeof $ === 'undefined') {
    global.$ = require('jquery');
    global.jQuery = global.$;
}

const SVGColorAnalyzer = require('./app.js');

describe('SVGColorAnalyzer - highlightColor() method', () => {
    let app;
    let mockSwatches;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" />
            <div id="mainContent"></div>
            <div id="svgPreview"></div>
            <canvas id="highlightCanvas"></canvas>
            <div id="colorPaletteTop">
                <div class="palette-swatch" data-color="#ff0000" style="background-color: #ff0000;"></div>
                <div class="palette-swatch" data-color="#00ff00" style="background-color: #00ff00;"></div>
                <div class="palette-swatch" data-color="#0000ff" style="background-color: #0000ff;"></div>
            </div>
            <div id="colorList"></div>
            <div id="originalColorCount"></div>
            <div id="currentColorCount"></div>
            <input type="range" id="colorCountSlider" value="8" />
            <span id="colorCountValue"></span>
            <button id="reduceBtn"></button>
            <button id="resetBtn"></button>
            <button id="downloadBtn"></button>
            <button id="clearHighlightBtn" style="display: none;"></button>
            <div id="loadingIndicator"></div>
            <div id="errorMessage"></div>
            <canvas id="analysisCanvas"></canvas>
        `;

        // Create app instance
        app = new SVGColorAnalyzer();

        // Mock createHighlightOverlay since it's not implemented yet (task 7.2)
        app.createHighlightOverlay = jest.fn();

        // Get mock swatches
        mockSwatches = {
            red: $('.palette-swatch').eq(0),
            green: $('.palette-swatch').eq(1),
            blue: $('.palette-swatch').eq(2)
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Task 7.1.1: Check for toggle (same color clicked)', () => {
        test('should toggle off when same color is clicked twice', () => {
            // First click - activate
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe('#ff0000');

            // Second click - toggle off
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe(null);
        });

        test('should call clearHighlight when same color is clicked', () => {
            app.clearHighlight = jest.fn();
            
            // First click
            app.highlightColor('#ff0000', mockSwatches.red);
            
            // Reset mock
            app.clearHighlight.mockClear();
            
            // Second click - should call clearHighlight
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.clearHighlight).toHaveBeenCalledTimes(1);
        });
    });

    describe('Task 7.1.2: Update selectedColor state', () => {
        test('should update selectedColor when a color is clicked', () => {
            expect(app.selectedColor).toBe(null);
            
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe('#ff0000');
        });

        test('should update selectedColor when switching to different color', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe('#ff0000');
            
            app.highlightColor('#00ff00', mockSwatches.green);
            expect(app.selectedColor).toBe('#00ff00');
        });
    });

    describe('Task 7.1.3: Update active class on swatches using jQuery', () => {
        test('should add active class to clicked swatch', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(mockSwatches.red.hasClass('active')).toBe(true);
        });

        test('should remove active class from all swatches before adding to new one', () => {
            // Click first swatch
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(mockSwatches.red.hasClass('active')).toBe(true);
            
            // Click second swatch
            app.highlightColor('#00ff00', mockSwatches.green);
            expect(mockSwatches.red.hasClass('active')).toBe(false);
            expect(mockSwatches.green.hasClass('active')).toBe(true);
        });

        test('should only have one active swatch at a time', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            app.highlightColor('#00ff00', mockSwatches.green);
            
            const activeSwatches = $('.palette-swatch.active');
            expect(activeSwatches.length).toBe(1);
            expect(activeSwatches.eq(0).data('color')).toBe('#00ff00');
        });
    });

    describe('Task 7.1.4: Show clear highlight button', () => {
        test('should show clear highlight button when color is selected', () => {
            const $clearBtn = $('#clearHighlightBtn');
            
            // Mock fadeIn to just show the element
            $clearBtn.fadeIn = function() { this.show(); return this; };
            
            expect($clearBtn.css('display')).toBe('none');
            
            app.highlightColor('#ff0000', mockSwatches.red);
            
            // Check if display is not 'none' (visible)
            expect($clearBtn.css('display')).not.toBe('none');
        });

        test('should keep clear button visible when switching colors', () => {
            const $clearBtn = $('#clearHighlightBtn');
            
            // Mock fadeIn to just show the element
            $clearBtn.fadeIn = function() { this.show(); return this; };
            
            app.highlightColor('#ff0000', mockSwatches.red);
            expect($clearBtn.css('display')).not.toBe('none');
            
            app.highlightColor('#00ff00', mockSwatches.green);
            expect($clearBtn.css('display')).not.toBe('none');
        });
    });

    describe('Task 7.1.5: Call createHighlightOverlay()', () => {
        test('should call createHighlightOverlay when color is selected', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.createHighlightOverlay).toHaveBeenCalledTimes(1);
        });

        test('should call createHighlightOverlay when switching colors', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.createHighlightOverlay).toHaveBeenCalledTimes(1);
            
            app.highlightColor('#00ff00', mockSwatches.green);
            expect(app.createHighlightOverlay).toHaveBeenCalledTimes(2);
        });

        test('should not call createHighlightOverlay when toggling off', () => {
            app.highlightColor('#ff0000', mockSwatches.red);
            app.createHighlightOverlay.mockClear();
            
            // Toggle off
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.createHighlightOverlay).not.toHaveBeenCalled();
        });
    });

    describe('Integration tests', () => {
        test('should handle complete highlight workflow', () => {
            const $clearBtn = $('#clearHighlightBtn');
            
            // Mock jQuery animations
            $clearBtn.fadeIn = function() { this.show(); return this; };
            $clearBtn.fadeOut = function() { this.hide(); return this; };
            
            // Initial state
            expect(app.selectedColor).toBe(null);
            expect($('.palette-swatch.active').length).toBe(0);
            expect($clearBtn.css('display')).toBe('none');

            // Select first color
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe('#ff0000');
            expect(mockSwatches.red.hasClass('active')).toBe(true);
            expect($clearBtn.css('display')).not.toBe('none');
            expect(app.createHighlightOverlay).toHaveBeenCalledTimes(1);

            // Switch to second color
            app.highlightColor('#00ff00', mockSwatches.green);
            expect(app.selectedColor).toBe('#00ff00');
            expect(mockSwatches.red.hasClass('active')).toBe(false);
            expect(mockSwatches.green.hasClass('active')).toBe(true);
            expect($clearBtn.css('display')).not.toBe('none');
            expect(app.createHighlightOverlay).toHaveBeenCalledTimes(2);

            // Toggle off
            app.highlightColor('#00ff00', mockSwatches.green);
            expect(app.selectedColor).toBe(null);
            expect($('.palette-swatch.active').length).toBe(0);
        });

        test('should handle multiple color selections', () => {
            const colors = ['#ff0000', '#00ff00', '#0000ff'];
            const swatches = [mockSwatches.red, mockSwatches.green, mockSwatches.blue];

            colors.forEach((color, index) => {
                app.highlightColor(color, swatches[index]);
                expect(app.selectedColor).toBe(color);
                expect(swatches[index].hasClass('active')).toBe(true);
                expect($('.palette-swatch.active').length).toBe(1);
            });
        });
    });

    describe('Edge cases', () => {
        test('should handle empty color hex', () => {
            expect(() => {
                app.highlightColor('', mockSwatches.red);
            }).not.toThrow();
        });

        test('should handle invalid jQuery element', () => {
            expect(() => {
                app.highlightColor('#ff0000', $('<div>'));
            }).not.toThrow();
        });

        test('should handle null selectedColor initially', () => {
            expect(app.selectedColor).toBe(null);
            app.highlightColor('#ff0000', mockSwatches.red);
            expect(app.selectedColor).toBe('#ff0000');
        });
    });
});
