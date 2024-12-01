import { VideoProcessor } from './core/VideoProcessor.js';

const processor = new VideoProcessor();
processor.setShader('basic', { brightness: 1, contrast: 1, saturation: 1, sepia: 1 });
// processor.setShader('contrast', { contrast: 1 });
processor.setShader('shine', { center: [0, 0], radius: 2, intensity: 2 });
// processor.setShader('saturation', { saturation: 2 });

// shine: { centerX: number, centerY: number, radius: number, intensity: number };