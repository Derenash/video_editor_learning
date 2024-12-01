import { VideoProcessor } from './core/VideoProcessor.js';
import { Effect } from './types/index.js';

function start() {
  const processor = new VideoProcessor();
  const shineEffect: Effect<'shine'> =
  {
    identifier: 'middle-shine-test',
    shaderName: 'shine',
    config: { center: [0, 0], radius: 2, intensity: 2 },
    startTime: 1.0,
    duration: 4
  }
  processor.addEffect(shineEffect);
}

start()
// processor.setShader('contrast', { contrast: 1 });
// processor.setShader('saturation', { saturation: 2 });

// shine: { centerX: number, centerY: number, radius: number, intensity: number };