interface WebGLProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    position: number;
    texCoord: number;
  };
}

class WebGLVideoProcessor {
  private canvas!: HTMLCanvasElement;
  private gl!: WebGLRenderingContext;
  private programInfo!: WebGLProgramInfo;
  private buffers!: {
    position: WebGLBuffer;
    texCoord: WebGLBuffer;
  };
  private texture!: WebGLTexture;
  private video!: HTMLVideoElement;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.initialize();
  }


  private initialize(): void {
    this.setupCanvas();
    this.setupWebGL();
    this.setupShaders();
    this.setupBuffers();
    this.setupTexture();
    this.setupVideo();
    this.setupRecordingButtons();
    this.addEventListeners();
  }

  private setupCanvas(): void {
    this.canvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
  }

  private setupWebGL(): void {
    this.gl = this.canvas.getContext('webgl') ||
      this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    if (!this.gl) {
      throw new Error('WebGL not supported in this browser');
    }
  }

  private getShaderSources(): { vertex: string; fragment: string } {
    return {
      vertex: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0, 1);
            v_texCoord = a_texCoord;
        }
      `,
      fragment: `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_texture;
        void main() {
            vec4 color = texture2D(u_texture, v_texCoord);
            color.rgb *= 0.5;
            gl_FragColor = color;
        }
      `
    };
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  private setupShaders(): void {
    const shaderSources = this.getShaderSources();
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, shaderSources.vertex);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, shaderSources.fragment);

    const program = this.createProgram(vertexShader, fragmentShader);

    this.programInfo = {
      program,
      attribLocations: {
        position: this.gl.getAttribLocation(program, 'a_position'),
        texCoord: this.gl.getAttribLocation(program, 'a_texCoord')
      }
    };
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Program linking failed');
    }

    return program;
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
      position: this.createBuffer(positions),
      texCoord: this.createBuffer(texCoords)
    };
  }

  private createBuffer(data: Float32Array): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    return buffer;
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

  private startRecording(): void {
    this.recordedChunks = [];
    const stream = this.canvas.captureStream(30);
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  private stopRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.onstop = () => this.downloadRecording();
    }
  }

  private downloadRecording(): void {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'output-video.webm';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  }

  private setupRecordingButtons(): void {
    this.createButton('Start Recording', '10px', '10px', () => this.startRecording());
    this.createButton('Stop Recording', '10px', '150px', () => this.stopRecording());
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
      this.draw();
    }
    requestAnimationFrame(this.render);
  };

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

  private draw(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.programInfo.program);
    this.setVertexAttributes();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private setVertexAttributes(): void {
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.position);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.position,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.texCoord);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.texCoord);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.texCoord,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
  }

  private addEventListeners(): void {
    window.addEventListener('resize', () => this.resizeCanvas());
    this.video.addEventListener('playing', () => this.render());
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
}

// Initialize the application
new WebGLVideoProcessor();