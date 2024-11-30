class GrayscaleShader extends BaseShader {
  private intensity: number;

  constructor(gl: WebGLRenderingContext, intensity: number = 1.0) {
    super();
    this.intensity = intensity;
  }

  compile() { /* ... */ }
  apply(uniforms: any) { /* ... */ }
}