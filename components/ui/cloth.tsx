"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A length of cloth hanging from a rod, printed with a photo. It is a small verlet
 * cloth simulation drawn with WebGL: it breathes in a light breeze, billows when the
 * page scrolls and ripples under a finger swiped across it. The `still` photo shows
 * until the cloth is ready, and stays instead of it with reduced motion or no WebGL.
 */
export function Cloth({
  src,
  still,
  hint,
  className = "",
  children,
}: {
  src?: string;
  still: React.ReactNode;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;
    return runCloth(gl, canvas, stage, src, {
      onReady: () => setLive(true),
      onLost: () => setLive(false),
      onTouch: () => setTouched(true),
    });
  }, [src]);

  return (
    <div ref={stageRef} className={`cloth-stage ${className}`} data-live={live} data-touched={touched}>
      <span className="cloth-rod" aria-hidden />
      <div className="cloth-still">{still}</div>
      <canvas ref={canvasRef} className="cloth-canvas" aria-hidden />
      {children}
      {live && hint && (
        <span className="cloth-hint" aria-hidden>
          <i />
          {hint}
        </span>
      )}
    </div>
  );
}

const VS = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aUv;
uniform vec2 uScale;
uniform float uMid;
varying vec2 vUv;
varying vec3 vN;
void main() {
  float p = 1.0 + aPos.z * 0.35;
  vec2 c = vec2(aPos.x, aPos.y - uMid) * p;
  gl_Position = vec4(c.x * uScale.x, -c.y * uScale.y, 0.0, 1.0);
  vUv = aUv;
  vN = aNor;
}`;

const FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec4 uCover;
varying vec2 vUv;
varying vec3 vN;
void main() {
  // Pinking-shear hem along the bottom.
  float tooth = abs(fract(vUv.x * 30.0) - 0.5) * 2.0;
  if (vUv.y > 0.982 + 0.018 * (1.0 - tooth)) discard;
  vec3 n = normalize(vN);
  if (n.z < 0.0) n = -n;
  vec3 col = texture2D(uTex, vUv * uCover.xy + uCover.zw).rgb;
  vec3 L = normalize(vec3(-0.35, -0.55, 0.76));
  float diff = max(dot(n, L), 0.0);
  float shade = 0.5 + 0.62 * diff;
  float sheen = pow(1.0 - n.z, 3.0) * 0.28;
  float weave = sin(vUv.x * 1400.0) * sin(vUv.y * 1700.0) * 0.022;
  col = col * shade + sheen * vec3(1.0, 0.9, 0.94) + weave;
  // Saffron running stitch just under the rod and above the hem.
  float dash = step(0.42, fract(vUv.x * 56.0));
  float s = (step(abs(vUv.y - 0.026), 0.0024) + step(abs(vUv.y - 0.95), 0.0024)) * dash;
  col = mix(col, vec3(0.93, 0.74, 0.3), s * 0.95);
  gl_FragColor = vec4(col, 1.0);
}`;

function runCloth(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  stage: HTMLElement,
  src: string | undefined,
  cb: { onReady: () => void; onLost: () => void; onTouch: () => void },
) {
  const small = window.innerWidth < 640;
  const COLS = small ? 17 : 23;
  const ROWS = small ? 21 : 28;
  const N = COLS * ROWS;
  const W = 1;
  const VW = 1.08; // world width shown across the canvas
  const TOP = -0.012; // world y at the top edge of the canvas (the rod)
  let VH = 1.3;
  let H = 1.2;

  const pos = new Float32Array(N * 3);
  const prev = new Float32Array(N * 3);
  const nor = new Float32Array(N * 3);
  const uv = new Float32Array(N * 2);
  const pinX = new Float32Array(COLS);
  const cons: number[] = [];
  const rest: number[] = [];

  function layout() {
    const rect = stage.getBoundingClientRect();
    VH = (VW * rect.height) / Math.max(rect.width, 1);
    H = VH - 0.07;
    const dx = W / (COLS - 1);
    const dy = H / (ROWS - 1);
    const gather = 0.8; // the rod is shorter than the cloth, so it falls in soft folds
    for (let c = 0; c < COLS; c++) pinX[c] = (-W / 2 + c * dx) * gather;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        pos[i * 3] = prev[i * 3] = pinX[c];
        pos[i * 3 + 1] = prev[i * 3 + 1] = r * dy;
        pos[i * 3 + 2] = prev[i * 3 + 2] = 0.035 * Math.sin(c * 1.9) * Math.min(1, r / 3);
        uv[i * 2] = c / (COLS - 1);
        uv[i * 2 + 1] = r / (ROWS - 1);
      }
    cons.length = 0;
    rest.length = 0;
    const link = (a: number, b: number, l: number) => {
      cons.push(a, b);
      rest.push(l);
    };
    const diag = Math.hypot(dx, dy);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (c < COLS - 1) link(i, i + 1, dx);
        if (r < ROWS - 1) link(i, i + COLS, dy);
        if (c < COLS - 1 && r < ROWS - 1) {
          link(i, i + COLS + 1, diag);
          link(i + 1, i + COLS, diag);
        }
      }
  }

  // ---- GL setup ----
  const prog = gl.createProgram()!;
  for (const [type, code] of [
    [gl.VERTEX_SHADER, VS],
    [gl.FRAGMENT_SHADER, FS],
  ] as const) {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, code);
    gl.compileShader(sh);
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);

  const idx: number[] = [];
  for (let r = 0; r < ROWS - 1; r++)
    for (let c = 0; c < COLS - 1; c++) {
      const i = r * COLS + c;
      idx.push(i, i + 1, i + COLS, i + 1, i + COLS + 1, i + COLS);
    }
  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

  const attr = (name: string, size: number) => {
    const buf = gl.createBuffer();
    const loc = gl.getAttribLocation(prog, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    return buf;
  };
  const posBuf = attr("aPos", 3);
  const norBuf = attr("aNor", 3);
  const uvBuf = attr("aUv", 2);
  const uScale = gl.getUniformLocation(prog, "uScale");
  const uMid = gl.getUniformLocation(prog, "uMid");
  const uCover = gl.getUniformLocation(prog, "uCover");

  const tex = gl.createTexture();
  let texAspect = 0;

  function upload(source: TexImageSource, w: number, h: number) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texAspect = w / h;
  }

  // Plain mulberry cloth, used when the photo can't be printed on the cloth.
  function plainCloth() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 320;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 256, 320);
    g.addColorStop(0, "#85305a");
    g.addColorStop(1, "#4a1630");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 320);
    upload(c, 256, 320);
  }

  let disposed = false;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.onload = () => {
    if (disposed) return;
    try {
      upload(img, img.naturalWidth, img.naturalHeight);
    } catch {
      plainCloth();
    }
    start();
  };
  img.onerror = () => {
    if (disposed) return;
    plainCloth();
    start();
  };
  if (src) img.src = src;
  else {
    plainCloth();
    queueMicrotask(start);
  }

  // ---- sizing ----
  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    layout();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  }
  resize();
  let lastW = stage.clientWidth;
  const ro = new ResizeObserver(() => {
    // Only a real width change resets the cloth (phone toolbars change the height while scrolling).
    if (Math.abs(stage.clientWidth - lastW) < 2) return;
    lastW = stage.clientWidth;
    resize();
  });
  ro.observe(stage);

  // ---- forces from the page ----
  let gust = 0;
  let lastScroll = window.scrollY;
  const onScroll = () => {
    const d = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    gust = Math.max(-0.05, Math.min(0.05, gust + d * 0.0005));
    wake();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  let pointer: { x: number; y: number } | null = null;
  const toWorld = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VW - VW / 2,
      y: ((e.clientY - rect.top) / rect.height) * VH + TOP,
    };
  };
  const nudge = (wx: number, wy: number, mx: number, my: number, poke: number) => {
    const R = 0.2;
    for (let i = COLS; i < N; i++) {
      const dx = pos[i * 3] - wx;
      const dy = pos[i * 3 + 1] - wy;
      const d = Math.hypot(dx, dy);
      if (d > R) continue;
      const f = 1 - d / R;
      pos[i * 3] += mx * f * 0.55;
      pos[i * 3 + 1] += my * f * 0.3;
      pos[i * 3 + 2] -= (Math.hypot(mx, my) * 0.9 + poke) * f;
    }
  };
  const onDown = (e: PointerEvent) => {
    pointer = toWorld(e);
    nudge(pointer.x, pointer.y, 0, 0, 0.05);
    cb.onTouch();
    wake();
  };
  const onMove = (e: PointerEvent) => {
    const p = toWorld(e);
    if (pointer || e.pointerType === "mouse") {
      const from = pointer ?? p;
      nudge(p.x, p.y, Math.max(-0.08, Math.min(0.08, p.x - from.x)), Math.max(-0.08, Math.min(0.08, p.y - from.y)), 0);
      if (pointer) cb.onTouch();
    }
    if (pointer) pointer = p;
    wake();
  };
  const onUp = () => {
    pointer = null;
  };
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onUp);
  stage.addEventListener("pointerleave", onUp);

  // ---- simulation ----
  const G = 2.4;
  const DT = 1 / 60;
  function step(t: number) {
    const dt2 = DT * DT;
    for (let c = 0; c < COLS; c++) {
      pos[c * 3] = pinX[c];
      pos[c * 3 + 1] = 0;
      pos[c * 3 + 2] = 0;
    }
    for (let i = COLS; i < N; i++) {
      const k = i * 3;
      const x = pos[k],
        y = pos[k + 1],
        z = pos[k + 2];
      const depth = y / H;
      const breeze = 0.22 * Math.sin(t * 1.1 + x * 4 + y * 2.2) + 0.12 * Math.sin(t * 0.63 - y * 3.1 + x);
      const g = gust * depth * (0.6 + 0.4 * Math.sin(x * 7 + t * 4));
      pos[k] += (x - prev[k]) * 0.985 + breeze * 0.12 * dt2;
      pos[k + 1] += (y - prev[k + 1]) * 0.985 + G * dt2 - Math.abs(g) * 0.15;
      pos[k + 2] += (z - prev[k + 2]) * 0.985 + breeze * dt2 + g;
      prev[k] = x;
      prev[k + 1] = y;
      prev[k + 2] = z;
    }
    gust *= 0.86;
    for (let it = 0; it < 4; it++) {
      for (let j = 0; j < rest.length; j++) {
        const a = cons[j * 2] * 3;
        const b = cons[j * 2 + 1] * 3;
        const dx = pos[b] - pos[a];
        const dy = pos[b + 1] - pos[a + 1];
        const dz = pos[b + 2] - pos[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const pinnedA = a < COLS * 3;
        const pinnedB = b < COLS * 3;
        const diff = (d - rest[j]) / d;
        const wa = pinnedA ? 0 : pinnedB ? 1 : 0.5;
        const wb = pinnedB ? 0 : pinnedA ? 1 : 0.5;
        pos[a] += dx * diff * wa;
        pos[a + 1] += dy * diff * wa;
        pos[a + 2] += dz * diff * wa;
        pos[b] -= dx * diff * wb;
        pos[b + 1] -= dy * diff * wb;
        pos[b + 2] -= dz * diff * wb;
      }
    }
  }

  function normals() {
    nor.fill(0);
    for (let r = 0; r < ROWS - 1; r++)
      for (let c = 0; c < COLS - 1; c++) {
        const i = r * COLS + c;
        for (const [a, b, d] of [
          [i, i + 1, i + COLS],
          [i + 1, i + COLS + 1, i + COLS],
        ]) {
          const ax = pos[b * 3] - pos[a * 3],
            ay = pos[b * 3 + 1] - pos[a * 3 + 1],
            az = pos[b * 3 + 2] - pos[a * 3 + 2];
          const bx = pos[d * 3] - pos[a * 3],
            by = pos[d * 3 + 1] - pos[a * 3 + 1],
            bz = pos[d * 3 + 2] - pos[a * 3 + 2];
          const nx = ay * bz - az * by,
            ny = az * bx - ax * bz,
            nz = ax * by - ay * bx;
          for (const v of [a, b, d]) {
            nor[v * 3] += nx;
            nor[v * 3 + 1] += ny;
            nor[v * 3 + 2] += nz;
          }
        }
      }
  }

  function draw() {
    normals();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uScale, 2 / VW, 2 / VH);
    gl.uniform1f(uMid, VH / 2 + TOP);
    // Cover-fit the photo, keeping a little more of its top (faces, necklines).
    const clothAspect = W / H;
    if (texAspect > clothAspect) {
      const s = clothAspect / texAspect;
      gl.uniform4f(uCover, s, 1, (1 - s) / 2, 0);
    } else {
      const s = texAspect / clothAspect;
      gl.uniform4f(uCover, 1, s, 0, (1 - s) * 0.3);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, norBuf);
    gl.bufferData(gl.ARRAY_BUFFER, nor, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  }

  // ---- loop: runs only while the cloth is on screen ----
  let raf = 0;
  let visible = true;
  let started = false;
  let first = true;
  let t0 = 0;
  let acc = 0;
  let last = 0;
  function frame(now: number) {
    raf = 0;
    if (!visible || disposed) return;
    if (!t0) {
      t0 = now;
      last = now;
      // Let the folds settle before the first picture.
      for (let s = 0; s < 90; s++) step(s * DT);
    }
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= DT) {
      step((now - t0) / 1000);
      acc -= DT;
    }
    draw();
    if (first) {
      first = false;
      cb.onReady();
    }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (started && visible && !raf && !disposed) raf = requestAnimationFrame(frame);
  }
  function start() {
    started = true;
    wake();
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !document.hidden;
    if (visible) {
      last = performance.now();
      wake();
    }
  });
  io.observe(stage);
  const onVis = () => {
    visible = !document.hidden;
    last = performance.now();
    wake();
  };
  document.addEventListener("visibilitychange", onVis);

  const onLost = (e: Event) => {
    e.preventDefault();
    disposed = true;
    cb.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return () => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    img.onload = img.onerror = null;
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVis);
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerup", onUp);
    stage.removeEventListener("pointercancel", onUp);
    stage.removeEventListener("pointerleave", onUp);
    canvas.removeEventListener("webglcontextlost", onLost);
    gl.deleteBuffer(posBuf);
    gl.deleteBuffer(norBuf);
    gl.deleteBuffer(uvBuf);
    gl.deleteBuffer(ibuf);
    gl.deleteTexture(tex);
    gl.deleteProgram(prog);
  };
}
