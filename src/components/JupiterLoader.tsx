import { useEffect, useRef } from 'react';

interface JupiterLoaderProps {
  className?: string;
  size?: number; // Size in pixels
  fullscreen?: boolean;
  text?: string;
}

export default function JupiterLoader({ className = '', size, fullscreen = false, text }: JupiterLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          
          // Technical color palette derived from "Obsidian Orbit"
          vec3 color_bg = vec3(0.05, 0.05, 0.07); // Dark surface
          vec3 color_primary = vec3(0.0, 0.94, 1.0); // Cyan #00f0ff
          vec3 color_secondary = vec3(0.49, 0.0, 1.0); // Indigo/Purple
          
          // Centering
          vec2 p = uv - 0.5;
          p.x *= u_resolution.x / u_resolution.y;
          
          float radius = length(p);
          float angle = atan(p.y, p.x);
          
          // Procedural "Jupiter" Ring Loader
          float ring_width = 0.005;
          float ring_radius = 0.2;
          float ring_speed = u_time * 2.0;
          
          // Main ring
          float ring = smoothstep(ring_width, 0.0, abs(radius - ring_radius));
          
          // "Orbiting" Pulse
          float orbit = smoothstep(0.1, 0.0, abs(angle - mod(ring_speed, 6.2831) + 3.1415));
          float orbit_glow = smoothstep(0.2, 0.0, abs(angle - mod(ring_speed, 6.2831) + 3.1415)) * 0.5;
          
          // Dynamic stripes (Jupiter vibe)
          float stripes = sin(p.y * 50.0 + u_time * 0.5) * 0.1;
          float core_radius = 0.15;
          float core = smoothstep(core_radius, core_radius - 0.01, radius);
          
          // Color composition
          vec3 final_color = color_bg;
          
          // Add glowing ring
          final_color += ring * color_primary * (0.8 + stripes);
          final_color += ring * orbit * color_primary * 2.0;
          final_color += ring * orbit_glow * color_primary;
          
          // Core glow
          final_color += core * color_bg;
          final_color += core * smoothstep(core_radius, 0.0, radius) * color_secondary * 0.3;
          
          // Subtle scanlines
          float scanline = sin(uv.y * 800.0) * 0.02;
          final_color -= scanline;

          gl_FragColor = vec4(final_color, 1.0);
      }
    `;

    function compileShader(type: number, src: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    function syncSize() {
      if (!canvas) return;
      const w = size || canvas.clientWidth || 300;
      const h = size || canvas.clientHeight || 300;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(syncSize)
      : null;

    if (observer) {
      observer.observe(canvas);
    }
    syncSize();

    function render(t: number) {
      if (!canvas) return;
      if (!observer) syncSize();
      gl!.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (observer) {
        observer.disconnect();
      }
      if (gl) {
        gl.deleteProgram(prog);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(buf);
      }
    };
  }, [size]);

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-container-lowest/95 backdrop-blur-md">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
        {text && (
          <p className="mt-6 font-code-snippet text-xs text-primary-fixed uppercase tracking-widest animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  const canvasStyle = size ? { width: `${size}px`, height: `${size}px` } : { width: '100%', height: '100%' };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div style={size ? { width: `${size}px`, height: `${size}px` } : { width: '100%', height: '180px' }} className="relative flex items-center justify-center">
        <canvas ref={canvasRef} style={canvasStyle} className="rounded-md" />
      </div>
      {text && (
        <p className="mt-4 font-code-snippet text-[11px] text-primary-fixed uppercase tracking-widest animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
}
