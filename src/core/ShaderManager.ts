// src/core/ShaderManager.ts

import { WebGLContext } from './WebGLContext.js';
import { Shader, ShaderConfig, ShaderConfigMap, WebGLProgramInfo } from '../types/index.js';
import { FramebufferManager } from './FramebufferManager.js';
import { ShaderCollection } from './ShaderCollection.js';

export class ShaderManager {
  private gl: WebGLRenderingContext;
  private glContext: WebGLContext;
  private shadersConfigMap: Map<string, ShaderConfig> = new Map();
  private shaders: Map<keyof ShaderConfigMap, Shader> = new Map();
  private programInfos: Map<string, WebGLProgramInfo> = new Map();
  private framebufferManager: FramebufferManager

  constructor(glContext: WebGLContext, framebufferManager: FramebufferManager) {
    this.glContext = glContext;
    this.gl = glContext.getContext();
    this.framebufferManager = framebufferManager;
    this.setupShaders();
  }

  private setupShaders(): void {
    // Object.keys(ShaderCollection.getAllShaders()).forEach(shaderName => {
    //   this.setupShaderProgram(shaderName);
    // });
  }

  public setupShader(identifier: string, shaderName: keyof ShaderConfigMap): void {
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

    console.log(`identifier: ${identifier}`)
    this.programInfos.set(identifier, {
      program,
      attribLocations: {
        position: this.gl.getAttribLocation(program, 'a_position'),
        texCoord: this.gl.getAttribLocation(program, 'a_texCoord'),
      },
      uniformLocations,
    });
  }

  public setShader<T extends keyof ShaderConfigMap>(
    identifier: string,
    shaderName: T,
    shaderConfig?: ShaderConfigMap[T]
  ): void {
    if (shaderConfig) {
      this.shadersConfigMap.set(identifier, { shaderName, ...shaderConfig });
      const shaderNames = this.getShaderNames();
      console.log(shaderNames);
      this.framebufferManager.setupFramebuffers(shaderNames);
    }
  }

  public deleteShaderProgram(shaderName: string): void {
    console.log(this.programInfos);
    const programInfo = this.programInfos.get(shaderName);
    if (!programInfo) {
      console.warn(`Shader program "${shaderName}" does not exist.`);
      return;
    }

    // Delete the shaders associated with the program
    this.gl.deleteProgram(programInfo.program);

    // Remove the program info and shader config from the maps
    console.log(this.programInfos.delete(shaderName));
    console.log(this.shadersConfigMap.delete(shaderName));
  }

  public deleteAllShaders(): void {
    this.programInfos.forEach((_info, shaderName) => {
      this.deleteShaderProgram(shaderName);
    });
  }

  public getProgramInfo(shaderName: string): WebGLProgramInfo | undefined {
    return this.programInfos.get(shaderName);
  }

  public getShaderConfig(shaderName: string): ShaderConfig | undefined {
    return this.shadersConfigMap.get(shaderName);
  }

  public getShaderNames(): string[] {
    return Array.from(this.shadersConfigMap.keys());
  }
}
