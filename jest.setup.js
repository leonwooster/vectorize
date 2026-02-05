// Mock jQuery for testing
global.$ = global.jQuery = require('jquery');

// Mock canvas methods that aren't available in jsdom
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
      })),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      rect: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      constructor: {
        name: 'CanvasRenderingContext2D'
      }
    };
  }
  return null;
};
