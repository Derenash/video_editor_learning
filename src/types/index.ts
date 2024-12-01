export interface WebGLProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    position: number;
    texCoord: number;
  };
  uniformLocations: Record<string, WebGLUniformLocation>;
}
export interface ShaderConfig {
  shaderName: keyof ShaderConfigMap;
  brightness?: number;  // 0.0 to 2.0
  contrast?: number;    // 0.0 to 2.0
  saturation?: number; // 0.0 to 2.0
  center?: number[];    // [x, y] coordinates, 0.0 to 1.0
  radius?: number;     // 0.0 to 1.0
  intensity?: number;  // 0.0 to 1.0
}

export type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'sampler2D';

export interface UniformConfig {
  type: UniformType;
  defaultValue: number | number[] | null;
}

export interface Shader {
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, UniformConfig>;
  description?: string;  // Documentation for the shader
  parameters?: {         // Documentation for parameters
    [key: string]: {
      min?: number;
      max?: number;
      description: string;
    }
  };
}

export interface Effect<T extends keyof ShaderConfigMap> {
  identifier: string;
  shaderName: T;
  config?: ShaderConfigMap[T];
  startTime: number;
  duration?: number;
}

// Add type safety for shader configurations
export type ShaderConfigMap = {
  basic: { brightness: number; contrast: number; saturation: number; sepia: number };
  shine: { center: number[]; radius: number; intensity: number };
  // Add more as needed
};

