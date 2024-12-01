import { Shader } from "../types";
import { defaultVertexShader } from "./common/defaultVertex.js";

export const basic: Shader = {
  name: 'basic',
  vertexShader: defaultVertexShader,
  fragmentShader: `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform float u_brightness;
    uniform float u_contrast;
    uniform float u_saturation;
    uniform float u_sepia;
    uniform float u_time;
    
    vec3 adjustBrightness(vec3 color, float brightness) {
      return color * brightness;
    }
    
    vec3 adjustContrast(vec3 color, float contrast) {
      return (color - 0.5) * contrast + 0.5;
    }
    
    vec3 adjustSaturation(vec3 color, float saturation) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, saturation);
    }
    
    vec3 applySepiaEffect(vec3 color, float intensity) {
      vec3 sepia = vec3(
        dot(color, vec3(0.393, 0.769, 0.189)),
        dot(color, vec3(0.349, 0.686, 0.168)),
        dot(color, vec3(0.272, 0.534, 0.131))
      );
      return mix(color, sepia, intensity);
    }
    
    void main() {
      vec4 texColor = texture2D(u_texture, v_texCoord);
      vec3 color = texColor.rgb;
      
      color = adjustBrightness(color, u_brightness);
      color = adjustContrast(color, u_contrast);
      color = adjustSaturation(color, u_saturation);
      color = applySepiaEffect(color, u_sepia);
      
      gl_FragColor = vec4(color, texColor.a);
    }
  `,
  uniforms: {
    u_brightness: { type: 'float', defaultValue: 1.0 },
    u_contrast: { type: 'float', defaultValue: 1.0 },
    u_saturation: { type: 'float', defaultValue: 1.0 },
    u_sepia: { type: 'float', defaultValue: 0.0 }
  },
  description: "Applies multiple adjustments to the image: brightness, contrast, saturation, and sepia",
  parameters: {
    brightness: {
      min: 0.0,
      max: 2.0,
      description: "Brightness multiplier (1.0 = normal brightness)"
    },
    contrast: {
      min: 0.0,
      max: 2.0,
      description: "Contrast adjustment (1.0 = normal contrast)"
    },
    saturation: {
      min: 0.0,
      max: 2.0,
      description: "Saturation level (0 = grayscale, 1 = normal, 2 = super saturated)"
    },
    sepia: {
      min: 0.0,
      max: 1.0,
      description: "Sepia effect intensity (0 = no effect, 1 = full sepia)"
    }
  }
};
