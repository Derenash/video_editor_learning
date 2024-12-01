import { ShaderManager } from './ShaderManager.js';
import { ShaderCollection } from './ShaderCollection.js';
import { UniformConfig, WebGLProgramInfo } from '../types';

export class UniformManager {
  private gl: WebGLRenderingContext;
  private shaderManager: ShaderManager;

  constructor(gl: WebGLRenderingContext, shaderManager: ShaderManager) {
    this.gl = gl;
    this.shaderManager = shaderManager;
  }

  public setUniforms(shaderName: string, programInfo: WebGLProgramInfo): void {
    const shader = ShaderCollection.getShader(shaderName);
    const config = this.shaderManager.getShaderConfig(shaderName) || {};

    Object.entries(shader.uniforms).forEach(([name, val]) => {
      const uniform = val as UniformConfig;
      const location = programInfo.uniformLocations[name];
      const configKey = name.substring(2) as keyof typeof config;
      const value =
        (config[configKey] !== undefined ? config[configKey] : uniform.defaultValue);

      this.setUniformValue(location, uniform.type, value);
    });

    // Set the default texture sampler to unit 0
    const texLocation = this.gl.getUniformLocation(programInfo.program, 'u_texture');
    this.gl.uniform1i(texLocation, 0);
  }

  public updateUniform(programInfo: WebGLProgramInfo, uniformName: string, type: string, value: any): void {
    const location = programInfo.uniformLocations[uniformName];
    if (location) {
      this.setUniformValue(location, type, value);
    }
  }

  public updateUniformsTime(time: number): void {
    const shaders = this.shaderManager.getShaderNames();
    shaders.forEach(shaderName => {
      const program = this.shaderManager.getProgramInfo(shaderName)?.program;
      const timeLocation = this.gl.getUniformLocation(program!, 'u_time');
      if (timeLocation) {
        this.gl.useProgram(program!);
        this.gl.uniform1f(timeLocation, time);
      }
    });
  }

  public setUniformStartTime(shaderName: string, time: number): void {
    const program = this.shaderManager.getProgramInfo(shaderName)?.program;
    const startTimeLocation = this.gl.getUniformLocation(program!, 'u_startTime');
    if (startTimeLocation) {
      this.gl.useProgram(program!);
      this.gl.uniform1f(startTimeLocation, time);
    }
  }

  private setUniformValue(location: WebGLUniformLocation, type: string, value: any): void {
    switch (type) {
      case 'float':
        this.gl.uniform1f(location, value as number);
        break;
      case 'vec2':
        this.gl.uniform2fv(location, value as number[]);
        break;
      case 'vec3':
        this.gl.uniform3fv(location, value as number[]);
        break;
      case 'vec4':
        this.gl.uniform4fv(location, value as number[]);
        break;
    }
  }
}
