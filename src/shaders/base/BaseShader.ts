abstract class BaseShader {
  protected gl: WebGLRenderingContext;
  protected program: WebGLProgram;

  abstract compile(): void;
  abstract apply(uniforms: any): void;
}