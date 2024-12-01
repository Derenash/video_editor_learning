import { WebGLContext } from './WebGLContext.js';
import { VideoRecorder } from './MediaRecorder.js';
import { ShaderConfigMap } from '../types';
import { ShaderManager } from './ShaderManager.js';
import { FramebufferManager } from './FramebufferManager.js';
import { Renderer } from './Renderer.js';
import { UniformManager } from './UniformManager.js';

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private glContext: WebGLContext;
  private buffers!: {
    position: WebGLBuffer;
    texCoord: WebGLBuffer;
  };
  private texture!: WebGLTexture;
  private video!: HTMLVideoElement;
  private videoRecorder: VideoRecorder;
  private uniformManager: UniformManager;

  private shaderManager: ShaderManager;
  private framebufferManager: FramebufferManager;
  private renderer!: Renderer;

  constructor() {
    this.canvas = this.setupCanvas();
    this.glContext = new WebGLContext(this.canvas);
    this.gl = this.glContext.getContext();
    this.videoRecorder = new VideoRecorder(this.canvas);
    this.shaderManager = new ShaderManager(this.glContext);
    this.framebufferManager = new FramebufferManager(this.gl, this.canvas);
    this.uniformManager = new UniformManager(this.gl, this.shaderManager);

    this.initialize();
  }

  private initialize(): void {
    this.setupBuffers();
    this.setupTexture();
    this.setupVideo();
    this.setupRecordingButtons();
    this.addEventListeners();

    // Setup framebuffers after shaders are initialized
    const shaderNames = this.shaderManager.getShaderNames();
    this.framebufferManager.setupFramebuffers(shaderNames);

    // Initialize renderer
    this.renderer = new Renderer(
      this.gl,
      this.shaderManager,
      this.framebufferManager,
      this.uniformManager,
      this.buffers,
      this.texture
    );
  }

  public setShader<T extends keyof ShaderConfigMap>(
    shaderName: T,
    config?: ShaderConfigMap[T]
  ): void {
    this.shaderManager.setShader(shaderName, config);
    // Setup framebuffers after shaders are initialized
    const shaderNames = this.shaderManager.getShaderNames();
    this.framebufferManager.setupFramebuffers(shaderNames);
  }

  // ##################################
  // Other methods
  // ##################################

  private setupCanvas(): HTMLCanvasElement {
    const canvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    return canvas;
  }

  private setupBuffers(): void {
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);

    const texCoords = new Float32Array([
      0, 1, 1, 1, 0, 0,
      0, 0, 1, 1, 1, 0,
    ]);

    this.buffers = {
      position: this.glContext.createBuffer(positions),
      texCoord: this.glContext.createBuffer(texCoords)
    };
  }

  private setupTexture(): void {
    this.texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
  }

  private setupVideo(): void {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.loop = true;
    this.video.muted = true;
    this.video.src = 'video.mp4';
    this.video.crossOrigin = 'anonymous';
    this.video.play();
  }

  private setupRecordingButtons(): void {
    this.createButton('Start Recording', '10px', '10px',
      () => this.videoRecorder.startRecording());
    this.createButton('Stop Recording', '10px', '150px',
      () => this.videoRecorder.stopRecording());
  }

  private createButton(text: string, top: string, left: string, onClick: () => void): void {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.position = 'absolute';
    button.style.top = top;
    button.style.left = left;
    button.addEventListener('click', onClick);
    document.body.appendChild(button);
  }

  private render = (): void => {
    if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      this.updateTexture();
      this.renderer.draw();
      this.updateTime()
    }
    requestAnimationFrame(this.render);
  };

  private updateTime(): void {
    const videoTime = this.video.currentTime;

    this.uniformManager.updateUniformsTime(videoTime);
  }

  private updateTexture(): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.video
    );
  }

  private addEventListeners(): void {
    // window.addEventListener('resize', () => this.resizeCanvas());
    this.video.addEventListener('playing', () => this.render());
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
}
