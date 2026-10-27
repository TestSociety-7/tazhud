// Generates the editorial starter artwork in public/art.
// These are stylised placeholders so the demo looks finished on first launch;
// replace them with real product photography from the admin panel.
// Usage: node scripts/generate-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "art");
mkdirSync(join(OUT, "products"), { recursive: true });

const W = 800;
const H = 1000;

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}
/** amt > 0 lightens toward white, < 0 darkens toward black. */
function shade(hex, amt) {
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.map((v) => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
}

let uid = 0;
const id = (p) => `${p}${++uid}`;

const grainDef = `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.07"/></feComponentTransfer></filter>
<filter id="soft" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1900" height="2200"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="softer" filterUnits="userSpaceOnUse" x="-300" y="-300" width="1900" height="2200"><feGaussianBlur stdDeviation="34"/></filter>`;

function svg(body, defs = "", w = W, h = H) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${grainDef}${defs}</defs>${body}<rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;
}

// Eight-point star tile used as a faint backdrop motif.
function starPattern(pid, stroke, opacity = 0.18, size = 120) {
  const s = size;
  const c = s / 2;
  const r = s * 0.32;
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * 0.62;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    pts.push(`${(c + rad * Math.cos(a)).toFixed(1)},${(c + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<pattern id="${pid}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><polygon points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="${opacity}"/><circle cx="0" cy="0" r="${s * 0.08}" fill="none" stroke="${stroke}" stroke-width="1" opacity="${opacity}"/><circle cx="${s}" cy="${s}" r="${s * 0.08}" fill="none" stroke="${stroke}" stroke-width="1" opacity="${opacity}"/></pattern>`;
}

function backdrop(bg, { arch = true, pattern = true } = {}) {
  const pid = id("pat");
  const gid = id("bg");
  const defs = `${starPattern(pid, shade(bg, -0.35), 0.12)}<radialGradient id="${gid}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${shade(bg, 0.25)}"/><stop offset="1" stop-color="${shade(bg, -0.06)}"/></radialGradient>`;
  let body = `<rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
  if (pattern) body += `<rect width="${W}" height="${H}" fill="url(#${pid})"/>`;
  if (arch)
    body += `<path d="M150 1000 V430 A250 250 0 0 1 650 430 V1000 Z" fill="${shade(bg, -0.05)}" opacity="0.9"/><path d="M150 1000 V430 A250 250 0 0 1 650 430 V1000" fill="none" stroke="#b8955a" stroke-opacity="0.45" stroke-width="2"/>`;
  return { defs, body };
}

function fabricGradient(color, horizontal = true) {
  const gid = id("fab");
  const dir = horizontal ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  return {
    gid,
    def: `<linearGradient id="${gid}" ${dir}><stop offset="0" stop-color="${shade(color, -0.16)}"/><stop offset="0.28" stop-color="${shade(color, 0.12)}"/><stop offset="0.55" stop-color="${color}"/><stop offset="0.82" stop-color="${shade(color, -0.1)}"/><stop offset="1" stop-color="${shade(color, -0.24)}"/></linearGradient>`,
  };
}

function hanger() {
  return `<path d="M400 205 V170 C400 150 422 146 426 128 C430 108 412 96 398 100" fill="none" stroke="#a88446" stroke-width="7" stroke-linecap="round"/><path d="M228 248 Q400 186 572 248" fill="none" stroke="#8a6a35" stroke-width="11" stroke-linecap="round"/><path d="M228 248 Q400 186 572 248" fill="none" stroke="#d9c49a" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`;
}

function folds(color, lines, clipId) {
  const dark = shade(color, -0.32);
  const light = shade(color, 0.3);
  return `<g clip-path="url(#${clipId})">${lines
    .map(
      ([d, w, kind]) =>
        `<path d="${d}" fill="none" stroke="${kind === "l" ? light : dark}" stroke-width="${w}" stroke-linecap="round" opacity="${kind === "l" ? 0.35 : 0.3}" filter="url(#soft)"/>`,
    )
    .join("")}</g>`;
}

function floorShadow(y = 935, rx = 260) {
  return `<ellipse cx="400" cy="${y}" rx="${rx}" ry="26" fill="#2a2a20" opacity="0.16" filter="url(#soft)"/>`;
}

const GARMENTS = {
  abaya: {
    path: "M330 232 Q400 272 470 232 L560 256 C640 292 690 420 722 640 L640 662 C620 560 602 470 586 420 C602 600 640 780 662 922 Q400 958 138 922 C160 780 198 600 214 420 C198 470 180 560 160 662 L78 640 C110 420 160 292 240 256 Z",
    folds: [
      ["M300 470 C290 640 260 800 240 940", 34, "d"],
      ["M360 440 C360 640 350 800 345 950", 22, "l"],
      ["M450 450 C460 640 470 800 480 950", 26, "d"],
      ["M530 470 C545 640 580 800 600 940", 30, "l"],
      ["M130 520 C140 580 150 620 150 660", 30, "d"],
      ["M670 520 C660 580 655 620 650 660", 30, "d"],
    ],
    trim: true,
  },
  dress: {
    path: "M335 232 Q400 266 465 232 L540 252 C590 272 610 332 620 420 L632 602 L586 607 L570 432 C566 452 546 470 522 482 C572 600 642 780 672 922 Q400 958 128 922 C158 780 228 600 278 482 C254 470 234 452 230 432 L214 607 L168 602 L180 420 C190 332 210 272 260 252 Z",
    folds: [
      ["M300 560 C270 700 230 820 200 940", 30, "d"],
      ["M370 520 C365 700 355 820 350 950", 20, "l"],
      ["M440 520 C450 700 470 820 490 950", 26, "d"],
      ["M500 560 C540 700 580 820 610 940", 26, "l"],
    ],
    belt: true,
  },
  set: {
    path: "M335 232 Q400 266 465 232 L545 252 C600 276 626 340 636 440 L646 562 L598 567 L586 442 C590 500 596 560 592 602 L208 602 C204 560 210 500 214 442 L202 567 L154 562 L164 440 C174 340 200 276 255 252 Z",
    lower:
      "M236 612 L564 612 C578 720 602 840 616 932 L442 936 L406 706 L394 706 L358 936 L184 932 C198 840 222 720 236 612 Z",
    folds: [
      ["M300 330 C295 420 290 500 290 600", 22, "d"],
      ["M500 330 C505 420 510 500 510 600", 22, "l"],
      ["M280 640 C270 760 250 860 240 930", 22, "d"],
      ["M520 640 C530 760 550 860 560 930", 22, "l"],
    ],
  },
  khimar: {
    path: "M300 236 Q400 278 500 236 C620 300 700 520 724 790 Q400 842 76 790 C100 520 180 300 300 236 Z",
    folds: [
      ["M260 360 C220 520 180 660 160 800", 34, "d"],
      ["M340 330 C330 520 320 660 315 820", 22, "l"],
      ["M460 330 C470 520 480 660 485 820", 26, "d"],
      ["M540 360 C580 520 620 660 640 800", 30, "l"],
    ],
    inner: true,
  },
};

function garmentArt(type, color, bg, lowerColor) {
  const g = GARMENTS[type];
  const bd = backdrop(bg);
  const fg = fabricGradient(color);
  const clip = id("clip");
  let defs = bd.defs + fg.def + `<clipPath id="${clip}"><path d="${g.path}"/></clipPath>`;
  let body = bd.body + floorShadow();
  if (g.lower) {
    const lc = lowerColor || color;
    const lg = fabricGradient(lc);
    const clip2 = id("clip");
    defs += lg.def + `<clipPath id="${clip2}"><path d="${g.lower}"/></clipPath>`;
    body += `<path d="${g.lower}" fill="url(#${lg.gid})"/>`;
    body += folds(lc, [["M400 720 C400 800 400 880 400 936", 10, "d"]], clip2);
  }
  body += hanger();
  body += `<path d="${g.path}" fill="url(#${fg.gid})"/>`;
  body += folds(color, g.folds, clip);
  body += `<path d="M330 232 Q400 272 470 232" fill="none" stroke="${shade(color, -0.35)}" stroke-width="5" opacity="0.6"/>`;
  if (g.trim)
    body += `<path d="M400 252 C402 500 404 760 404 944" fill="none" stroke="${shade(color, -0.3)}" stroke-width="4" opacity="0.55"/><path d="M412 252 C414 500 416 760 416 944" fill="none" stroke="#c9a96a" stroke-width="3" opacity="0.55"/>`;
  if (g.belt)
    body += `<path d="M268 470 Q400 498 532 470 L536 494 Q400 522 264 494 Z" fill="${shade(color, -0.22)}"/><rect x="386" y="476" width="28" height="30" rx="5" fill="none" stroke="#c9a96a" stroke-width="4"/>`;
  if (g.inner)
    body += `<path d="M330 250 Q400 360 470 250" fill="${shade(color, -0.3)}" opacity="0.45"/>`;
  return svg(body, defs);
}

function foldedScarf(color, x, y, w, h, opts = {}) {
  const fg = fabricGradient(color);
  const lid = id("lay");
  const defs =
    fg.def +
    `<linearGradient id="${lid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 0.22)}" stop-opacity="0.9"/><stop offset="1" stop-color="${shade(color, -0.05)}" stop-opacity="0"/></linearGradient>`;
  let body = `<ellipse cx="${x + w / 2}" cy="${y + h + 8}" rx="${w * 0.52}" ry="24" fill="#2a2a20" opacity="0.2" filter="url(#soft)"/>`;
  // visible layer edges below the top fold
  for (let i = 3; i >= 1; i--) {
    body += `<rect x="${x + i * 2}" y="${y + i * 7}" width="${w - i * 4}" height="${h}" rx="16" fill="${shade(color, -0.12 - i * 0.05)}"/>`;
  }
  body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="url(#${fg.gid})"/>`;
  body += `<path d="M${x} ${y + 16} Q${x} ${y} ${x + 16} ${y} L${x + w * 0.62} ${y} L${x} ${y + h * 0.7} Z" fill="url(#${lid})"/>`;
  body += `<path d="M${x + w * 0.62} ${y + 4} L${x + 6} ${y + h * 0.7}" stroke="${shade(color, -0.3)}" stroke-width="2.5" opacity="0.35"/>`;
  body += `<rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" rx="10" fill="none" stroke="${shade(color, 0.35)}" stroke-width="1.6" stroke-dasharray="6 7" opacity="0.6"/>`;
  if (opts.fringe) {
    for (let i = 0; i < w - 30; i += 9)
      body += `<line x1="${x + 18 + i}" y1="${y + h}" x2="${x + 16 + i}" y2="${y + h + 16}" stroke="${shade(color, -0.1)}" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  if (opts.tag) {
    body += `<path d="M${x + w - 70} ${y + 20} C${x + w - 40} ${y - 40} ${x + w + 10} ${y - 20} ${x + w + 24} ${y + 30}" fill="none" stroke="#a88446" stroke-width="2"/><rect x="${x + w + 4}" y="${y + 30}" width="56" height="80" rx="8" transform="rotate(12 ${x + w + 32} ${y + 70})" fill="#f7f2e9" stroke="#b8955a" stroke-width="2"/><circle cx="${x + w + 30}" cy="${y + 44}" r="5" fill="none" stroke="#b8955a" stroke-width="2" transform="rotate(12 ${x + w + 32} ${y + 70})"/>`;
  }
  if (opts.ribbed) {
    for (let i = 30; i < h - 20; i += 14)
      body += `<line x1="${x + 10}" y1="${y + i}" x2="${x + w - 10}" y2="${y + i}" stroke="${shade(color, -0.2)}" stroke-width="2" opacity="0.35"/>`;
  }
  return { defs, body };
}

function flatlayArt(color, bg, opts = {}) {
  const bd = backdrop(bg, { arch: false });
  const s = foldedScarf(color, 170, 360, 460, 360, { tag: true, ...opts });
  let body = bd.body;
  body += `<circle cx="400" cy="540" r="330" fill="${shade(bg, -0.06)}" opacity="0.8"/>`;
  body += s.body;
  return svg(body, bd.defs + s.defs);
}

function stackArt(colors, bg) {
  const bd = backdrop(bg, { arch: false });
  let body = bd.body + `<circle cx="400" cy="560" r="340" fill="${shade(bg, -0.06)}" opacity="0.8"/>`;
  let defs = bd.defs;
  const n = colors.length;
  colors.forEach((c, i) => {
    const w = 440 - (n - 1 - i) * 0;
    const y = 700 - (i + 1) * 120 + (n === 3 ? 0 : 60);
    const s = foldedScarf(c, 180 + (i % 2) * 14, y, w, 150, { tag: i === n - 1 });
    defs += s.defs;
    body += s.body;
  });
  return svg(body, defs);
}

function detailArt(color, bg) {
  const fg = fabricGradient(color, false);
  const wid = id("weave");
  const defs =
    fg.def +
    `<pattern id="${wid}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 H6 M3 0 V6" stroke="${shade(color, -0.25)}" stroke-width="0.8" opacity="0.28"/></pattern>`;
  let body = `<rect width="${W}" height="${H}" fill="url(#${fg.gid})"/>`;
  const bands = [
    ["M-100 160 C200 60 500 300 900 140", 130, "l"],
    ["M-100 360 C220 260 520 520 900 360", 150, "d"],
    ["M-100 560 C180 470 560 720 900 560", 120, "l"],
    ["M-100 780 C240 680 520 940 900 780", 160, "d"],
    ["M-100 960 C200 880 560 1080 900 960", 110, "l"],
  ];
  body += bands
    .map(
      ([d, w, k]) =>
        `<path d="${d}" fill="none" stroke="${k === "l" ? shade(color, 0.28) : shade(color, -0.3)}" stroke-width="${w}" opacity="0.5" filter="url(#softer)"/>`,
    )
    .join("");
  body += `<rect width="${W}" height="${H}" fill="url(#${wid})"/>`;
  body += `<g transform="translate(560 790) rotate(-8)"><rect width="170" height="110" rx="10" fill="${bg}" opacity="0.92"/><rect x="10" y="10" width="150" height="90" rx="6" fill="none" stroke="#b8955a" stroke-width="1.5"/><text x="85" y="52" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#1f3a2e">Tazhud</text><text x="85" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" letter-spacing="3" fill="#5e655d">ATELIER</text></g>`;
  return svg(body, defs);
}

function pinsArt(pinColor, bg, { magnets = false } = {}) {
  const bd = backdrop(bg, { arch: false });
  const rid = id("pin");
  const dish = id("dish");
  let defs =
    bd.defs +
    `<radialGradient id="${rid}" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="${shade(pinColor, 0.75)}"/><stop offset="0.5" stop-color="${pinColor}"/><stop offset="1" stop-color="${shade(pinColor, -0.35)}"/></radialGradient>
     <radialGradient id="${dish}" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fbf8f2"/><stop offset="1" stop-color="#e3d8c4"/></radialGradient>`;
  let body = bd.body;
  body += `<ellipse cx="400" cy="560" rx="300" ry="300" fill="#2a2a20" opacity="0.12" filter="url(#softer)"/>`;
  body += `<circle cx="400" cy="540" r="290" fill="url(#${dish})"/><circle cx="400" cy="540" r="250" fill="none" stroke="#b8955a" stroke-width="2" opacity="0.6"/>`;
  const spots = [
    [300, 450], [430, 420], [520, 520], [330, 600], [460, 640], [390, 520],
  ];
  spots.forEach(([cx, cy], i) => {
    if (magnets) {
      body += `<circle cx="${cx + 4}" cy="${cy + 6}" r="34" fill="#2a2a20" opacity="0.18" filter="url(#soft)"/><circle cx="${cx}" cy="${cy}" r="32" fill="url(#${rid})"/><circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="${shade(pinColor, 0.5)}" stroke-width="2" opacity="0.6"/>`;
    } else {
      const ang = (i * 47) % 360;
      body += `<g transform="rotate(${ang} ${cx} ${cy})"><line x1="${cx}" y1="${cy}" x2="${cx + 120}" y2="${cy}" stroke="#9a9a92" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="18" fill="url(#${rid})"/></g>`;
    }
  });
  return svg(body, defs);
}

function heroArt() {
  const w = 1200;
  const h = 1500;
  const pid = id("pat");
  const ab = fabricGradient("#d8c7a8");
  const clip = id("clip");
  const defs = `${starPattern(pid, "#d9c49a", 0.22, 160)}${ab.def}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d221d"/><stop offset="1" stop-color="#0c0e0b"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#f3e6c8" stop-opacity="0.55"/><stop offset="1" stop-color="#f3e6c8" stop-opacity="0"/></radialGradient>
    <clipPath id="${clip}"><path d="M300 232 Q400 272 500 232 L590 256 C670 292 720 420 752 640 L670 662 C650 560 632 470 616 420 C632 600 670 780 692 922 Q400 958 108 922 C130 780 168 600 184 420 C168 470 150 560 130 662 L48 640 C80 420 130 292 210 256 Z"/></clipPath>`;
  let body = `<rect width="${w}" height="${h}" fill="url(#sky)"/><rect width="${w}" height="${h}" fill="url(#${pid})"/><rect width="${w}" height="${h}" fill="url(#glow)"/>`;
  body += `<g transform="translate(130 200) scale(1.18)">`;
  body += `<ellipse cx="400" cy="935" rx="300" ry="30" fill="#000" opacity="0.25" filter="url(#soft)"/>`;
  body += `<path d="M400 205 V170 C400 150 422 146 426 128 C430 108 412 96 398 100" fill="none" stroke="#c9a96a" stroke-width="7" stroke-linecap="round"/><path d="M198 248 Q400 186 602 248" fill="none" stroke="#b8955a" stroke-width="11" stroke-linecap="round"/>`;
  body += `<path d="M300 232 Q400 272 500 232 L590 256 C670 292 720 420 752 640 L670 662 C650 560 632 470 616 420 C632 600 670 780 692 922 Q400 958 108 922 C130 780 168 600 184 420 C168 470 150 560 130 662 L48 640 C80 420 130 292 210 256 Z" fill="url(#${ab.gid})"/>`;
  body += folds(
    "#d8c7a8",
    [
      ["M270 470 C260 640 230 800 210 940", 40, "d"],
      ["M350 440 C350 640 340 800 335 950", 26, "l"],
      ["M460 450 C470 640 480 800 490 950", 30, "d"],
      ["M550 470 C565 640 600 800 620 940", 34, "l"],
    ],
    clip,
  );
  body += `<path d="M400 252 C402 500 404 760 404 944" stroke="#b8955a" stroke-width="4" fill="none" opacity="0.7"/>`;
  body += `</g>`;
  const s1 = foldedScarf("#9aaa8f", 830, 1300, 300, 110, {});
  const s2 = foldedScarf("#e8dcc6", 850, 1195, 270, 100, {});
  const s3 = foldedScarf("#c7a28a", 840, 1095, 280, 95, { tag: false });
  body += s1.body + s2.body + s3.body;
  return svg(body, defs + s1.defs + s2.defs + s3.defs, w, h);
}

function atelierArt() {
  const bd = backdrop("#efe7d8", { arch: false });
  let defs = bd.defs;
  let body = bd.body;
  const sw = ["#1f3a2e", "#9aaa8f", "#d8c7a8", "#c7a28a", "#6b4f3a", "#e8dcc6"];
  sw.forEach((c, i) => {
    const fg = fabricGradient(c);
    defs += fg.def;
    const ang = -40 + i * 16;
    body += `<g transform="rotate(${ang} 400 860)"><rect x="345" y="230" width="110" height="560" rx="14" fill="#2a2a20" opacity="0.12" filter="url(#soft)"/><rect x="340" y="220" width="110" height="560" rx="14" fill="url(#${fg.gid})"/><circle cx="395" cy="260" r="9" fill="#efe7d8" stroke="#b8955a" stroke-width="2"/></g>`;
  });
  body += `<circle cx="400" cy="860" r="30" fill="#b8955a"/><circle cx="400" cy="860" r="12" fill="#efe7d8"/>`;
  return svg(body, defs);
}

const write = (name, content) => writeFileSync(join(OUT, name), content);

// Product jobs: [slug, [images...]] where each image is a generator call.
const IVORY = "#f3ece0";
const SAND = "#ece3d3";
const SAGE_BG = "#e3e8dc";
const BLUSH = "#f1e6df";

const products = {
  "premium-chiffon-hijab": [
    () => flatlayArt("#9aaa8f", IVORY),
    () => detailArt("#9aaa8f", IVORY),
    () => stackArt(["#e8dcc6", "#c7a28a", "#1f3a2e"], SAND),
  ],
  "modal-jersey-hijab": [
    () => flatlayArt("#7a5e4c", SAND),
    () => detailArt("#7a5e4c", SAND),
    () => stackArt(["#3d3a33", "#6f7451", "#b9b0a1"], IVORY),
  ],
  "silk-touch-satin-hijab": [
    () => flatlayArt("#d6c3a0", BLUSH),
    () => detailArt("#d6c3a0", BLUSH),
    () => stackArt(["#2f5c4a", "#6b3f50", "#d6c3a0"], IVORY),
  ],
  "crinkle-cotton-hijab": [
    () => flatlayArt("#d9cdb6", SAGE_BG, { fringe: true }),
    () => detailArt("#d9cdb6", SAGE_BG),
  ],
  "everyday-instant-hijab": [
    () => flatlayArt("#2b2b2e", IVORY),
    () => detailArt("#2b2b2e", IVORY),
  ],
  "noor-open-abaya": [
    () => garmentArt("abaya", "#2f4a3c", IVORY),
    () => detailArt("#2f4a3c", IVORY),
    () => garmentArt("abaya", "#cbb894", SAGE_BG),
  ],
  "layla-pleated-abaya": [
    () => garmentArt("abaya", "#ebe2d2", SAGE_BG),
    () => detailArt("#ebe2d2", SAGE_BG),
    () => garmentArt("abaya", "#a3b096", IVORY),
  ],
  "essential-closed-abaya": [
    () => garmentArt("khimar", "#26262a", SAND),
    () => detailArt("#26262a", SAND),
  ],
  "linen-kimono-abaya": [
    () => garmentArt("abaya", "#d8c9ad", BLUSH),
    () => detailArt("#d8c9ad", BLUSH),
    () => garmentArt("abaya", "#6f7451", IVORY),
  ],
  "amal-maxi-dress": [
    () => garmentArt("dress", "#9aaa8f", IVORY),
    () => detailArt("#9aaa8f", IVORY),
    () => garmentArt("dress", "#b56b4d", SAND),
  ],
  "safa-tiered-dress": [
    () => garmentArt("dress", "#efe6d6", SAGE_BG),
    () => detailArt("#efe6d6", SAGE_BG),
  ],
  "rania-wrap-dress": [
    () => garmentArt("dress", "#1f3a2e", BLUSH),
    () => detailArt("#1f3a2e", BLUSH),
    () => garmentArt("dress", "#7a5e4c", IVORY),
  ],
  "hana-linen-coord": [
    () => garmentArt("set", "#ddd0b8", SAGE_BG, "#cdbfa4"),
    () => detailArt("#ddd0b8", SAGE_BG),
    () => garmentArt("set", "#a3b096", IVORY, "#95a387"),
  ],
  "mariam-knit-set": [
    () => garmentArt("set", "#efe6d6", BLUSH, "#e4d9c6"),
    () => detailArt("#efe6d6", BLUSH),
    () => garmentArt("set", "#45454a", IVORY, "#3b3b40"),
  ],
  "bamboo-underscarf": [
    () => flatlayArt("#3a3a3c", SAND, { ribbed: true }),
    () => stackArt(["#ffffff", "#d9bfa6", "#3a3a3c"], IVORY),
  ],
  "magnetic-hijab-pins": [() => pinsArt("#c9a96a", IVORY, { magnets: true }), () => pinsArt("#e9e4dc", SAGE_BG, { magnets: true })],
  "pearl-hijab-pins": [() => pinsArt("#f4efe6", BLUSH)],
  "two-layer-prayer-khimar": [
    () => garmentArt("khimar", "#9aaa8f", IVORY),
    () => detailArt("#9aaa8f", IVORY),
    () => garmentArt("khimar", "#efe6d6", SAND),
  ],
};

for (const [slug, jobs] of Object.entries(products)) {
  jobs.forEach((job, i) => write(`products/${slug}-${i + 1}.svg`, job()));
}

write("hero.svg", heroArt());
write("atelier.svg", atelierArt());
write("bundle-everyday-trio.svg", stackArt(["#7a5e4c", "#6f7451", "#3d3a33"], IVORY));
write("bundle-eid-edit.svg", garmentArt("abaya", "#2f4a3c", BLUSH));
write("bundle-essentials-kit.svg", pinsArt("#c9a96a", SAGE_BG, { magnets: true }));

console.log("Artwork written to", OUT);
