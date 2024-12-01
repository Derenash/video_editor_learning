import { WebGLContext } from './WebGLContext.js';
import { VideoRecorder } from './MediaRecorder.js';
import { Effect, ShaderConfigMap } from '../types';
import { ShaderManager } from './ShaderManager.js';
import { FramebufferManager } from './FramebufferManager.js';
import { Renderer } from './Renderer.js';
import { UniformManager } from './UniformManager.js';
import { EffectManager } from './EffectManager.js';

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

  private effectManager: EffectManager;

  constructor() {
    this.canvas = this.setupCanvas();
    this.glContext = new WebGLContext(this.canvas);
    this.gl = this.glContext.getContext();
    this.videoRecorder = new VideoRecorder(this.canvas);
    this.framebufferManager = new FramebufferManager(this.gl, this.canvas);
    this.shaderManager = new ShaderManager(this.glContext, this.framebufferManager);
    this.uniformManager = new UniformManager(this.gl, this.shaderManager);
    this.effectManager = new EffectManager(this.shaderManager);

    this.initialize();
  }

  private initialize(): void {
    this.setupBuffers();
    this.setupTexture();
    this.setupVideo();
    this.addEventListeners();
    this.setupInitialEffects();

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

  private setupInitialEffects(): void {
    const initialEffect: Effect<'basic'> = {
      identifier: 'initial-shader',
      shaderName: 'basic',
      config: { brightness: 1.0, contrast: 1.0, saturation: 1.0, sepia: 0 },
      startTime: 0,
    }
    this.addEffect(initialEffect);
  }

  public addEffect<T extends keyof ShaderConfigMap>(
    effect: Effect<T>
  ): void {
    this.effectManager.addEffect(effect)
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
    // this.video.loop = true;
    this.video.muted = true;
    this.video.src = 'wave.mp4';
    this.video.crossOrigin = 'anonymous';
    this.video.play();

  }

  private render = (): void => {
    if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
      this.updateTexture();
      this.renderer.draw();
      this.updateFrame()
    }
    requestAnimationFrame(this.render);
  };

  private updateFrame(): void {
    const videoTime = this.video.currentTime;

    this.uniformManager.updateUniformsTime(videoTime);
    this.effectManager.updateEffects(videoTime)
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
    this.video.addEventListener('playing', () => {
      this.render();
      this.videoRecorder.startRecording()
    })
    this.video.addEventListener('ended', () => {
      this.videoRecorder.stopRecording()
    });
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
}
