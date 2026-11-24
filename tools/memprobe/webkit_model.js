// The layer + software-filter part of the WebKit memory model (see README.md). Evaluate in the page (CDP
// Runtime.evaluate, returnByValue) after instr.js has been injected; it returns one sample. Generic: no game names.
// Layers WebKit is CERTAIN to make, each at its LAYOUT box x DPR^2 x 4 - WebKit (GraphicsLayerCA) never scales a
// layer's backing store down for a transform-scaled ancestor; under an ancestor with CSS zoom the box is zoomed,
// hence offsetWidth x currentCSSZoom. Overlap layers are not modelled: a lower bound. Tiled layers capped at 156 MB.
(() => {
  const q = window.__mem ? __mem.quick() : {};
  const z = el => (el && el.currentCSSZoom) || 1;
  // software filters: a drop-shadow that is not the last filter in the list is painted in software
  let swf = 0, swn = 0;
  for (const el of document.querySelectorAll("body *")) {
    const f = getComputedStyle(el).filter;
    if (!f || f === "none") continue;
    const ds = (f.match(/drop-shadow/g) || []).length;
    if (!ds || (ds === 1 && /drop-shadow\((?:[^()]|\([^()]*\))*\)\s*$/.test(f))) continue;
    if (!el.getClientRects().length) continue;
    const k = z(el), w = el.offsetWidth * k, h = el.offsetHeight * k;
    if (!w || !h) continue;
    swn++; swf += (w + 60) * (h + 60) * devicePixelRatio * devicePixelRatio * 4 * (1 + 2 * ds);
  }
  const lay = new Map();
  const want = el => { if (el && el.isConnected && el.tagName !== "CANVAS" && !lay.has(el)) lay.set(el, 1); };
  for (const an of document.getAnimations()) {           // running transform/opacity/filter animations
    if (an.playState !== "running") continue;
    const ef = an.effect, t = ef && ef.target;
    if (!t || !(t instanceof Element)) continue;
    let props = [];
    try { props = ef.getKeyframes().flatMap(k => Object.keys(k)); } catch (e) {}
    if (props.some(p => /^(transform|opacity|filter|translate|rotate|scale)$/.test(p))) want(t);
  }
  for (const el of document.querySelectorAll("body *")) { // 3D, will-change, backdrop-filter, fixed
    if (el.tagName === "CANVAS") continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    if (/matrix3d|perspective/.test(cs.transform) || /transform|opacity/.test(cs.willChange) || cs.transformStyle === "preserve-3d"
        || (cs.backdropFilter && cs.backdropFilter !== "none") || cs.position === "fixed") want(el);
  }
  let layers = 0, nLayers = 0; const top = [];
  for (const el of lay.keys()) {
    if (getComputedStyle(el).display === "none" || !el.getClientRects().length) continue;
    const k = z(el), w = el.offsetWidth * k, h = el.offsetHeight * k;
    if (!w || !h) continue;
    const b = Math.min(w * h * devicePixelRatio * devicePixelRatio * 4, 156 * 1048576);
    nLayers++; layers += b;
    top.push([+(b / 1e6).toFixed(1), (el.id ? "#" + el.id : el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]).slice(0, 40)]);
  }
  top.sort((x, y) => y[0] - x[0]);
  const MB = 1e6;
  const model = ((q.c2d || 0) + (q.cgl || 0) + (q.tex || 0) + (q.bmp || 0) + layers + swf) / MB;   // + decoded pictures: __mem.pics()
  return { modelMBwithoutPictures: +model.toFixed(1), canvas2dMB: +((q.c2d || 0) / MB).toFixed(1), n2d: q.n2d, glBuffersMB: +((q.cgl || 0) / MB).toFixed(1),
           texturesMB: +((q.tex || 0) / MB).toFixed(1), bitmapsMB: +((q.bmp || 0) / MB).toFixed(1), layersMB: +(layers / MB).toFixed(1), nLayers,
           softFiltersMB: +(swf / MB).toFixed(1), audioMB: +((q.aud || 0) / MB).toFixed(1), heapMB: +((q.heap || 0) / MB).toFixed(1),
           topLayers: top.slice(0, 8), nodes: document.getElementsByTagName("*").length, animations: document.getAnimations().length };
})()
