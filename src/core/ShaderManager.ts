// src/core/ShaderManager.ts

import { WebGLContext } from './WebGLContext.js';
import { Shader, ShaderConfig, ShaderConfigMap, WebGLProgramInfo } from '../types/index.js';
import { ShaderCollection } from './ShaderCollection.js';

export class ShaderManager {
  private gl: WebGLRenderingContext;
  private glContext: WebGLContext;
  private shaders: Map<string, ShaderConfig> = new Map();
  private programInfos: Map<string, WebGLProgramInfo> = new Map();

  constructor(glContext: WebGLContext) {
    this.glContext = glContext;
    this.gl = glContext.getContext();
    this.setupShaders();
    this.initializeShaderConfigs();
  }

  private setupShaders(): void {
    Object.keys(ShaderCollection.getAllShaders()).forEach(shaderName => {
      this.setupShaderProgram(shaderName);
    });
  }

  private initializeShaderConfigs(): void {
    this.setShader('basic', { brightness: 1.0, contrast: 1.0, saturation: 1.0, sepia: 0.0 });
  }

  public setupShaderProgram(shaderName: string): void {
    const shader: Shader = ShaderCollection.getShader(shaderName);
    const vertexShader = this.glContext.createShader(
      this.gl.VERTEX_SHADER,
      shader.vertexShader
    );
    const fragmentShader = this.glContext.createShader(
      this.gl.FRAGMENT_SHADER,
      shader.fragmentShader
    );
    const program = this.glContext.createProgram(vertexShader, fragmentShader);

    const uniformLocations: Record<string, WebGLUniformLocation> = {};
    Object.keys(shader.uniforms).forEach(uniformName => {
      const location = this.gl.getUniformLocation(program, uniformName);
      if (location !== null) {
        uniformLocations[uniformName] = location;
      }
    });

    this.programInfos.set(shaderName, {
      program,
      attribLocations: {
        position: this.gl.getAttribLocation(program, 'a_position'),
        texCoord: this.gl.getAttribLocation(program, 'a_texCoord'),
      },
      uniformLocations,
    });
  }

  public setShader<T extends keyof ShaderConfigMap>(
    shaderName: T,
    config?: ShaderConfigMap[T]
  ): void {
    if (config) {
      this.shaders.set(shaderName, config);
    }
  }

  public getProgramInfo(shaderName: string): WebGLProgramInfo | undefined {
    return this.programInfos.get(shaderName);
  }

  public getShaderConfig(shaderName: string): ShaderConfig | undefined {
    return this.shaders.get(shaderName);
  }

  public getShaderNames(): string[] {
    return Array.from(this.shaders.keys());
  }
}
