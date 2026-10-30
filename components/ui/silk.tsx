"use client";

import { useEffect, useRef } from "react";

/**
 * Live silk behind the hero: a small WebGL shader of satin folds that drift slowly,
 * part under the finger or pointer, and catch the light when an Android phone is tilted.
 * Colours come from the season's CSS variables. It renders at a reduced resolution,
 * stops when off screen or in a background tab, and draws one still frame with reduced
 * motion. Without WebGL the CSS gradient under it stays.
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform vec2 m;
uniform vec2 tilt;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
float h(vec2 p){
  float v=sin(p.x*1.5+p.y*0.8+t*0.32)*0.55;
  v+=sin(-p.x*2.2+p.y*1.6+t*0.25+sin(p.y*1.2+t*0.18)*1.3)*0.33;
  v+=sin(p.x*3.6-p.y*2.7+t*0.4)*0.1;
  return v;
}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 p=(gl_FragCoord.xy-0.5*r)/min(r.x,r.y)*2.4;
  vec2 d=p-m;
  float pull=exp(-dot(d,d)*1.4);
  p+=normalize(d+0.0001)*pull*0.28;
  float e=0.02;
  float hc=h(p);
  vec2 g=vec2(h(p+vec2(e,0.))-hc,h(p+vec2(0.,e))-hc)/e;
  vec3 n=normalize(vec3(-g*0.28,1.));
  vec3 L=normalize(vec3(-0.45+tilt.x,0.55+tilt.y,0.75));
  float diff=clamp(dot(n,L),0.,1.);
  float spec=pow(clamp(dot(n,normalize(L+vec3(0.,0.,1.))),0.,1.),36.);
  float rim=pow(1.-n.z,1.4);
  vec3 base=mix(c0,c1,clamp(smoothstep(-1.1,1.1,hc)*0.75+uv.y*0.25,0.,1.));
  vec3 col=base*(0.35+0.85*diff)+c2*spec*0.55+c3*rim*0.45;
  col+=0.05*vec3(sin(hc*5.),sin(hc*5.+2.1),sin(hc*5.+4.2));
  col*=1.-0.38*length(uv-vec2(0.5,0.55));
  gl_FragColor=vec4(col,1.);
}`;

function cssColor(el: Element, name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function Silk({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uR = u("r"), uT = u("t"), uM = u("m"), uTilt = u("tilt");
    const host = canvas.closest("section") ?? canvas.parentElement ?? canvas;
    const setColors = () => {
      gl.uniform3fv(u("c0"), cssColor(host, "--color-ink", [0.05, 0.06, 0.14]));
      gl.uniform3fv(u("c1"), cssColor(host, "--color-forest-2", [0.19, 0.23, 0.47]));
      gl.uniform3fv(u("c2"), cssColor(host, "--color-gold-bright", [0.93, 0.73, 0.65]));
      gl.uniform3fv(u("c3"), cssColor(host, "--color-iris", [0.61, 0.55, 0.95]));
    };
    setColors();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Silk is soft, so a low resolution looks the same and keeps phones cool.
    const scale = Math.min(window.devicePixelRatio || 1, 2) * (window.innerWidth < 640 ? 0.45 : 0.6);
    let w = 0, hgt = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * scale));
      hgt = Math.max(1, Math.round(rect.height * scale));
      canvas.width = w;
      canvas.height = hgt;
      gl.viewport(0, 0, w, hgt);
      gl.uniform2f(uR, w, hgt);
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(8);
    });
    ro.observe(canvas);

    // The finger's position in shader space, eased towards its target.
    const target = { x: 0.6, y: 0.4 }, cur = { x: 0.6, y: 0.4 };
    const tilt = { x: 0, y: 0 }, tiltCur = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const k = 2.4 / Math.min(rect.width, rect.height);
      target.x = (e.clientX - rect.left - rect.width / 2) * k;
      target.y = -(e.clientY - rect.top - rect.height / 2) * k;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tilt.x = Math.max(-1, Math.min(1, e.gamma / 35)) * 0.5;
      tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35)) * 0.4;
    };
    host.addEventListener("pointermove", onPointer, { passive: true });
    host.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });

    function draw(time: number) {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      tiltCur.x += (tilt.x - tiltCur.x) * 0.08;
      tiltCur.y += (tilt.y - tiltCur.y) * 0.08;
      gl!.uniform1f(uT, time / 1000);
      gl!.uniform2f(uM, cur.x, cur.y);
      gl!.uniform2f(uTilt, tiltCur.x, tiltCur.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    let raf = 0, visible = true;
    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!still && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    document.addEventListener("visibilitychange", onVis);

    draw(8000);
    canvas.dataset.ready = "true";
    start();

    // Re-read the colours when the season changes.
    const mo = new MutationObserver(() => {
      setColors();
      if (still) draw(8000);
    });
    const seasonEl = host.closest("[data-season]");
    if (seasonEl) mo.observe(seasonEl, { attributes: true, attributeFilter: ["data-season"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <div className={`silk ${className}`} aria-hidden>
      <canvas ref={ref} />
    </div>
  );
}
