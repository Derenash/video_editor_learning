import { Effect, ShaderConfigMap } from "../types";
import { ShaderManager } from "./ShaderManager";

export class EffectManager {
  private futureEffects: Effect<keyof ShaderConfigMap>[]; // Sorted array of future effects
  private runningEffects: Map<string, Effect<keyof ShaderConfigMap>>;
  private pastEffects: Map<string, Effect<keyof ShaderConfigMap>>;
  private shaderManager: ShaderManager;

  constructor(shaderManager: ShaderManager) {
    this.futureEffects = [];
    this.runningEffects = new Map();
    this.pastEffects = new Map();
    this.shaderManager = shaderManager;
  }

  public addEffect<T extends keyof ShaderConfigMap>(effect: Effect<T>): void {
    // Insert the new effect into futureEffects while keeping it sorted by startTime
    this.futureEffects.push(effect);
    this.futureEffects.sort((a, b) => a.startTime - b.startTime);
    this.shaderManager.setupShader(effect.identifier, effect.shaderName)
  }

  public updateEffects(currentTime: number): void {
    // Move effects from future to running
    while (
      this.futureEffects.length > 0 &&
      this.futureEffects[0].startTime <= currentTime
    ) {
      const effect = this.futureEffects.shift()!;
      this.runningEffects.set(effect.identifier, effect);

      // Add the shader for the effect
      this.shaderManager.setShader(effect.identifier, effect.shaderName, effect.config);
    }

    // Move effects from running to past
    for (const [id, effect] of this.runningEffects) {
      if (!effect.duration) continue
      if (effect.startTime + effect.duration <= currentTime) {
        this.pastEffects.set(id, effect);
        this.runningEffects.delete(id);

        // Delete the shader for the effect
        this.shaderManager.deleteShaderProgram(effect.identifier);
      }
    }
  }

  public getRunningEffects(): Effect<keyof ShaderConfigMap>[] {
    return Array.from(this.runningEffects.values());
  }

  public removeEffect(id: string): boolean {
    // Remove from futureEffects, runningEffects, or pastEffects
    const futureIndex = this.futureEffects.findIndex((e) => e.identifier === id);
    if (futureIndex !== -1) {
      this.futureEffects.splice(futureIndex, 1);
      return true;
    }

    if (this.runningEffects.has(id)) {
      const effect = this.runningEffects.get(id)!;
      this.runningEffects.delete(id);

      // Delete the shader for the running effect
      this.shaderManager.deleteShaderProgram(effect.identifier);
      return true;
    }

    return this.pastEffects.delete(id);
  }

  public clearEffects(): void {
    // Clear all effects and remove associated shaders
    this.futureEffects = [];
    for (const effect of this.runningEffects.values()) {
      this.shaderManager.deleteShaderProgram(effect.identifier);
    }
    this.runningEffects.clear();
    this.pastEffects.clear();
  }


  public resetEffects(): void {
    // Collect all effects
    const allEffects = [...this.futureEffects, ...Array.from(this.runningEffects.values())]

    // Clear existing collections
    this.futureEffects = [];
    this.runningEffects.clear();
    this.pastEffects.clear();

    // Remove all shaders
    for (const effect of allEffects) {
      this.shaderManager.deleteShaderProgram(effect.identifier);
    }

    // Reset all effects to their initial state and add them using addEffect
    console.log(allEffects);
    for (const effect of allEffects) {
      const resetEffect = { ...effect, startTime: effect.startTime };
      this.addEffect(resetEffect);
    }
  }
}
