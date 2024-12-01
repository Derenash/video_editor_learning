// shaders/ShaderCollection.ts
import { shine } from "../shaders/effects/shineShader.js";
import { basic } from "../shaders/basicShader.js";
import { Shader } from "../types";

export class ShaderCollection {
  private static shaders: Record<string, Shader> = {
    basic,
    shine
  };

  static getShader(name: string): Shader {
    const shader = this.shaders[name];
    if (!shader) throw new Error(`Shader ${name} not found`);
    return shader;
  }

  static getAllShaders(): Record<string, Shader> {
    return this.shaders;
  }

  static getShaderNames(): string[] {
    return Object.keys(this.shaders);
  }

}