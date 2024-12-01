export class FramebufferManager {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private framebufferTextures: Map<string, WebGLTexture> = new Map();

  constructor(gl: WebGLRenderingContext, canvas: HTMLCanvasElement) {
    this.gl = gl;
    this.canvas = canvas;
  }

  public setupFramebuffers(shaderNames: string[]): void {
    shaderNames.slice(0, -1).forEach(shaderName => {
      const framebuffer = this.gl.createFramebuffer()!;
      const texture = this.gl.createTexture()!;

      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.canvas.width,
        this.canvas.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        null
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texture,
        0
      );

      this.framebuffers.set(shaderName, framebuffer);
      this.framebufferTextures.set(shaderName, texture);
    });
  }

  public getFramebuffer(shaderName: string): WebGLFramebuffer | undefined {
    return this.framebuffers.get(shaderName);
  }

  public getFramebufferTexture(shaderName: string): WebGLTexture | undefined {
    return this.framebufferTextures.get(shaderName);
  }
}
