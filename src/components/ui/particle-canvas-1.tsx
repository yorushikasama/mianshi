"use client";

import { useEffect, useRef } from "react";

type ParticleCanvasProps = {
  maxParticles?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  speedScale?: number;
};

type Particle = {
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  time: number;
};

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_color;
  uniform vec2 u_resolution;
  varying vec2 v_color;
  void main(){
    gl_Position = vec4(vec2(1, -1) * ((a_position / u_resolution) * 2.0 - 1.0), 0, 1);
    v_color = a_color;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_color;
  uniform float u_tick;
  float frac = 1.0 / 6.0;
  void main(){
    float hue = abs((v_color.x + u_tick) - floor(v_color.x + u_tick));
    vec4 color = vec4(0, 0, 0, 1);
    if (hue < frac) {
      color.r = 1.0;
      color.g = hue / frac;
    } else if (hue < frac * 2.0) {
      color.r = 1.0 - (hue - frac) / frac;
      color.g = 1.0;
    } else if (hue < frac * 3.0) {
      color.g = 1.0;
      color.b = (hue - frac * 2.0) / frac;
    } else if (hue < frac * 4.0) {
      color.g = 1.0 - (hue - frac * 3.0) / frac;
      color.b = 1.0;
    } else if (hue < frac * 5.0) {
      color.r = (hue - frac * 4.0) / frac;
      color.b = 1.0;
    } else {
      color.r = 1.0;
      color.b = 1.0 - (hue - frac * 5.0) / frac;
    }
    gl_FragColor = vec4(color.rgb * v_color.y, v_color.y);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function pushCircle(triangles: number[], x: number, y: number, radius: number) {
  const inc = (Math.PI * 2) / 6;
  let px = x + radius;
  let py = y;

  for (let i = 0; i <= Math.PI * 2 + inc; i += inc) {
    const nx = x + radius * Math.cos(i);
    const ny = y + radius * Math.sin(i);
    triangles.push(x, y, px, py, nx, ny);
    px = nx;
    py = ny;
  }
}

export function ParticleCanvas({
  maxParticles = 1000,
  particleSizeMin = 2,
  particleSizeMax = 5,
  speedScale = 2
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: true });
    if (!canvas || !gl) return;
    const targetCanvas = canvas;
    const context = gl;

    const program = createProgram(context);
    if (!program) return;

    const positionBuffer = context.createBuffer();
    const colorBuffer = context.createBuffer();
    const positionLocation = context.getAttribLocation(program, "a_position");
    const colorLocation = context.getAttribLocation(program, "a_color");
    const resolutionLocation = context.getUniformLocation(program, "u_resolution");
    const tickLocation = context.getUniformLocation(program, "u_tick");
    if (!positionBuffer || !colorBuffer || !resolutionLocation || !tickLocation) return;

    const dimensions = { width: 0, height: 0, cx: 0, cy: 0 };
    const particles: Particle[] = [];
    let frame = 0;
    let tick = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      dimensions.width = window.innerWidth;
      dimensions.height = window.innerHeight;
      dimensions.cx ||= dimensions.width / 2;
      dimensions.cy ||= dimensions.height / 2;
      targetCanvas.width = dimensions.width * ratio;
      targetCanvas.height = dimensions.height * ratio;
      targetCanvas.style.width = `${dimensions.width}px`;
      targetCanvas.style.height = `${dimensions.height}px`;
      context.viewport(0, 0, targetCanvas.width, targetCanvas.height);
      context.uniform2f(resolutionLocation, dimensions.width, dimensions.height);
    }

    function resetParticle(particle: Particle) {
      particle.size = particleSizeMin + (particleSizeMax - particleSizeMin) * Math.random();
      particle.x = dimensions.cx;
      particle.y = dimensions.cy;
      particle.vx = (Math.random() - 0.5) * 2 * speedScale;
      particle.vy = -2 - speedScale * Math.random();
      particle.time = 1;
    }

    function createParticle() {
      const particle = { size: 0, x: 0, y: 0, vx: 0, vy: 0, time: 1 };
      resetParticle(particle);
      return particle;
    }

    function move(event: MouseEvent) {
      dimensions.cx = event.clientX;
      dimensions.cy = event.clientY;
    }

    context.useProgram(program);
    context.enableVertexAttribArray(positionLocation);
    context.enableVertexAttribArray(colorLocation);
    context.clearColor(0, 0, 0, 0);
    resize();

    function draw() {
      const triangles: number[] = [];
      const colors: number[] = [];

      context.clear(context.COLOR_BUFFER_BIT);
      tick += 1;
      if (particles.length < maxParticles) {
        particles.push(createParticle(), createParticle());
      }

      particles.sort((a, b) => a.time - b.time);
      for (const particle of particles) {
        particle.x += particle.vx *= 0.995;
        particle.y += particle.vy += 0.05;
        particle.time *= 0.99;

        const start = triangles.length;
        pushCircle(triangles, particle.x, particle.y, particle.size * particle.time);
        const hue = particle.vy / 10;
        for (let i = start; i < triangles.length; i += 2) colors.push(hue, particle.time);
        if (particle.y - particle.size > dimensions.height) resetParticle(particle);
      }

      context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array(triangles), context.STATIC_DRAW);
      context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0);
      context.bindBuffer(context.ARRAY_BUFFER, colorBuffer);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array(colors), context.STATIC_DRAW);
      context.vertexAttribPointer(colorLocation, 2, context.FLOAT, false, 0, 0);
      context.uniform1f(tickLocation, tick / 100);
      context.drawArrays(context.TRIANGLES, 0, triangles.length / 2);
      frame = requestAnimationFrame(draw);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("resize", resize);
    };
  }, [maxParticles, particleSizeMax, particleSizeMin, speedScale]);

  return <canvas className="pointer-events-none absolute inset-0 h-full w-full" ref={canvasRef} aria-hidden="true" />;
}
