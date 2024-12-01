// src/core/Renderer.ts

import { ShaderManager } from './ShaderManager.js';
import { FramebufferManager } from './FramebufferManager.js';
import { WebGLProgramInfo } from '../types';
import { UniformManager } from './UniformManager.js';

export class Renderer {
  private gl: WebGLRenderingContext;
  private shaderManager: ShaderManager;
  private framebufferManager: FramebufferManager;
  private uniformManager: UniformManager;
  private buffers: {
    position: WebGLBuffer;
    texCoord: WebGLBuffer;
  };
  private texture: WebGLTexture;

  constructor(
    gl: WebGLRenderingContext,
    shaderManager: ShaderManager,
    framebufferManager: FramebufferManager,
    uniformManager: UniformManager,
    buffers: {
      position: WebGLBuffer;
      texCoord: WebGLBuffer;
    },
    texture: WebGLTexture
  ) {
    this.gl = gl;
    this.shaderManager = shaderManager;
    this.framebufferManager = framebufferManager;
    this.uniformManager = uniformManager;
    this.buffers = buffers;
    this.texture = texture;
  }

  public draw(): void {
    const shaderNames = this.shaderManager.getShaderNames();

    shaderNames.forEach((shaderName, index) => {
      const isLastShader = index === shaderNames.length - 1;
      const framebuffer = this.framebufferManager.getFramebuffer(shaderName);

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, isLastShader ? null : framebuffer!);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      const programInfo = this.shaderManager.getProgramInfo(shaderName)!;
      this.gl.useProgram(programInfo.program);

      this.gl.activeTexture(this.gl.TEXTURE0);
      if (index === 0) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      } else {
        const prevTexture = this.framebufferManager.getFramebufferTexture(
          shaderNames[index - 1]
        )!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, prevTexture);
      }

      this.uniformManager.setUniforms(shaderName, programInfo);
      this.setVertexAttributes(programInfo);

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    });
  }

  private setVertexAttributes(programInfo: WebGLProgramInfo): void {
    this.gl.enableVertexAttribArray(programInfo.attribLocations.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.vertexAttribPointer(
      programInfo.attribLocations.position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
    this.gl.vertexAttribPointer(
      programInfo.attribLocations.texCoord,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
  }
}
