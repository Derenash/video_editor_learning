// config/shader-configs.ts
export const shaderConfigs = {
  grayscale: {
    name: 'Grayscale',
    uniforms: {
      intensity: 1.0
    }
  },
  blur: {
    name: 'Blur',
    uniforms: {
      radius: 2.0
    }
  }
};