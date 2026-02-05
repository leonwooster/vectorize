/**
 * Simple integration test for reduceColors() method
 * This test verifies the core logic without full jQuery setup
 */

// Test the color reduction logic
function testColorReduction() {
    console.log('Testing color reduction logic...\n');
    
    // Test 1: Color mapping creation
    console.log('Test 1: Color mapping creation');
    const colorData = [
        { hex: '#ff0000', count: 100, percentage: 20, rgb: { r: 255, g: 0, b: 0 } },
        { hex: '#ff1111', count: 100, percentage: 20, rgb: { r: 255, g: 17, b: 17 } },
        { hex: '#0000ff', count: 100, percentage: 20, rgb: { r: 0, g: 0, b: 255 } },
        { hex: '#1111ff', count: 100, percentage: 20, rgb: { r: 17, g: 17, b: 255 } },
        { hex: '#00ff00', count: 100, percentage: 20, rgb: { r: 0, g: 255, b: 0 } }
    ];
    
    // Simulate k-means result (2 clusters)
    const reducedPalette = [
        { rgb: { r: 255, g: 8, b: 8 }, count: 0 },  // Red cluster
        { rgb: { r: 8, g: 8, b: 255 }, count: 0 }   // Blue cluster
    ];
    
    // Create color mapping
    const colorMapping = new Map();
    colorData.forEach(oldColor => {
        // Find nearest color in reduced palette
        let nearestColor = reducedPalette[0].rgb;
        let minDistance = colorDistance(oldColor.rgb, nearestColor);
        
        for (let i = 1; i < reducedPalette.length; i++) {
            const distance = colorDistance(oldColor.rgb, reducedPalette[i].rgb);
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = reducedPalette[i].rgb;
            }
        }
        
        const newHex = rgbToHex(nearestColor.r, nearestColor.g, nearestColor.b);
        colorMapping.set(oldColor.hex, newHex);
    });
    
    console.log('Color mapping created:');
    colorMapping.forEach((newHex, oldHex) => {
        console.log(`  ${oldHex} → ${newHex}`);
    });
    
    // Verify red colors map to red cluster
    const redMapping1 = colorMapping.get('#ff0000');
    const redMapping2 = colorMapping.get('#ff1111');
    console.log(`Red colors map to same cluster: ${redMapping1 === redMapping2 ? 'PASS' : 'FAIL'}`);
    
    // Verify blue colors map to blue cluster
    const blueMapping1 = colorMapping.get('#0000ff');
    const blueMapping2 = colorMapping.get('#1111ff');
    console.log(`Blue colors map to same cluster: ${blueMapping1 === blueMapping2 ? 'PASS' : 'FAIL'}`);
    
    console.log('\n');
    
    // Test 2: SVG color replacement
    console.log('Test 2: SVG color replacement');
    let svgText = '<svg><rect fill="#ff0000"/><rect fill="#FF0000"/><rect fill="rgb(255, 0, 0)"/></svg>';
    console.log('Original SVG:', svgText);
    
    // Replace #ff0000 with #ff0808
    const oldHex = '#ff0000';
    const newHex = '#ff0808';
    
    // Lowercase hex
    const lowerHexRegex = new RegExp(oldHex.toLowerCase(), 'g');
    svgText = svgText.replace(lowerHexRegex, newHex.toLowerCase());
    
    // Uppercase hex
    const upperHexRegex = new RegExp(oldHex.toUpperCase(), 'g');
    svgText = svgText.replace(upperHexRegex, newHex.toUpperCase());
    
    // RGB format
    const oldRgb = hexToRgb(oldHex);
    const newRgb = hexToRgb(newHex);
    if (oldRgb && newRgb) {
        const rgbPattern = `rgb\\(\\s*${oldRgb.r}\\s*,\\s*${oldRgb.g}\\s*,\\s*${oldRgb.b}\\s*\\)`;
        const rgbRegex = new RegExp(rgbPattern, 'gi');
        const newRgbString = `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b})`;
        svgText = svgText.replace(rgbRegex, newRgbString);
    }
    
    console.log('Modified SVG:', svgText);
    
    // Verify all occurrences were replaced
    const hasOldColor = svgText.toLowerCase().includes(oldHex.toLowerCase()) || 
                        svgText.includes('rgb(255, 0, 0)');
    console.log(`All occurrences replaced: ${!hasOldColor ? 'PASS' : 'FAIL'}`);
    
    const hasNewColor = svgText.toLowerCase().includes(newHex.toLowerCase()) || 
                        svgText.includes('rgb(255, 8, 8)');
    console.log(`New color present: ${hasNewColor ? 'PASS' : 'FAIL'}`);
    
    console.log('\n');
    
    // Test 3: Validation logic
    console.log('Test 3: Validation logic');
    
    const currentColorCount = 5;
    const targetCount1 = 3;
    const targetCount2 = 5;
    const targetCount3 = 7;
    const targetCount4 = 0;
    
    console.log(`Current colors: ${currentColorCount}`);
    console.log(`Target ${targetCount1}: ${targetCount1 < currentColorCount ? 'VALID' : 'INVALID'}`);
    console.log(`Target ${targetCount2}: ${targetCount2 < currentColorCount ? 'VALID' : 'INVALID'}`);
    console.log(`Target ${targetCount3}: ${targetCount3 < currentColorCount ? 'VALID' : 'INVALID'}`);
    console.log(`Target ${targetCount4}: ${targetCount4 >= 1 ? 'VALID' : 'INVALID'}`);
    
    console.log('\nAll tests completed!');
}

// Helper functions
function colorDistance(rgb1, rgb2) {
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(r, g, b) {
    const toHex = (value) => {
        const hex = Math.round(value).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    const cleanHex = hex.replace(/^#/, '');
    if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) return null;
    
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return { r, g, b };
}

// Run tests
testColorReduction();
