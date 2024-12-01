import { Shader } from "../../types";
import { defaultVertexWithPositionShader } from "../common/defaultVertexWithPosition.js";



const fragmentShader = `
  precision mediump float;
  varying vec2 v_texCoord;
  varying vec2 v_position;
  uniform sampler2D u_texture;
  uniform vec2 u_center;
  uniform float u_radius;
  uniform float u_intensity;
  uniform float u_time;
  uniform float u_startTime;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);

    // Calculate distance from the center
    float dist = distance(v_position, u_center);

    // Calculate the elapsed time since the effect started
    float elapsedTime = u_time - u_startTime;

    // Define the burst duration (2 secsonds)
    float burstDuration = 0.1;

    // Normalize the time (0.0 to 1.0 during the burst)
    float normalizedTime = clamp(elapsedTime / burstDuration, 0.0, 1.0);

    // Compute shine factor based on time and distance
    float shine = u_intensity * (1.0 - normalizedTime) * smoothstep(u_radius * normalizedTime, 0.0, dist);

    // Apply shine effect
    color.rgb += shine;

    gl_FragColor = color;
  }

`;

export const shine: Shader = {
  name: 'shine',
  vertexShader: defaultVertexWithPositionShader,
  fragmentShader: fragmentShader,
  uniforms: {
    u_startTime: { type: 'float', defaultValue: null },
    u_center: { type: 'vec2', defaultValue: [0.0, 0.0] },
    u_radius: { type: 'float', defaultValue: 0.5 },
    u_intensity: { type: 'float', defaultValue: 1.0 },
    u_texture: { type: 'sampler2D', defaultValue: null },
  },
  description: "Adds a shine effect centered on the screen",
  parameters: {
    centerX: {
      min: -1.0,
      max: 1.0,
      description: "X coordinate of the shine center (-1 to 1)"
    },
    centerY: {
      min: -1.0,
      max: 1.0,
      description: "Y coordinate of the shine center (-1 to 1)"
    },
    radius: {
      min: 0.0,
      max: 2.0,
      description: "Radius of the shine effect"
    },
    intensity: {
      min: 0.0,
      max: 5.0,
      description: "Intensity of the shine effect"
    },
  },
};
