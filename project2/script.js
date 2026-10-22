"use strict";
const $ = (s) => document.querySelector(s);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }
};

/* ============ 1. CALCULATION ENGINE (no eval) ============ */
const Engine = (() => {
  const PREC = { "+": 1, "−": 1, "×": 2, "÷": 2 };
  function evaluate(tokens) {
    const nums = [], ops = [];
    const apply = () => {
      const b = nums.pop(), a = nums.pop(), o = ops.pop();
      if (o === "÷" && b === 0) throw new Error("Cannot divide by 0");
      nums.push(o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : a / b);
    };
    for (const t of tokens) {
      if (t in PREC) {
        while (ops.length && PREC[ops[ops.length - 1]] >= PREC[t]) apply();
        ops.push(t);
      } else nums.push(parseFloat(t));
    }
    while (ops.length) apply();
    return nums[0];
  }
  function fmt(n) {
    if (!Number.isFinite(n)) return "Error";
    if (n === 0) return "0";
    const a = Math.abs(n);
    const p = parseFloat(n.toPrecision(12));
    return a >= 1e15 || a < 1e-9 ? p.toExponential() : String(p);
  }
  return { evaluate, fmt };
})();

/* ============ 2. CALCULATOR STATE ============ */
const Calc = (() => {
  const S = { expr: [], cur: "0", done: false, err: "", line: "" };
  const reset = () => { S.expr = []; S.cur = "0"; S.done = false; S.err = ""; S.line = ""; };
  const digit = (d) => {
    if (S.err || S.done) reset();
    if (S.cur === "0") S.cur = d;
    else if (S.cur === "-0") S.cur = "-" + d;
    else if (S.cur.replace(/[-.]/g, "").length < 15) S.cur += d;
    else return false;
    return true;
  };
  const dot = () => {
    if (S.err || S.done) reset();
    if (S.cur === "") S.cur = "0.";
    else if (S.cur.includes(".") || /e/.test(S.cur)) return false;
    else S.cur += ".";
    return true;
  };
  const op = (o) => {
    if (S.err) return false;
    if (S.done) { S.expr = [S.cur]; S.done = false; S.cur = ""; S.line = ""; }
    else if (S.cur !== "") { S.expr.push(S.cur); S.cur = ""; }
    else { S.expr[S.expr.length - 1] = o; return true; }
    S.expr.push(o);
    return true;
  };
  const equals = () => {
    if (S.err || S.done || !S.expr.length) return null;
    const t = [...S.expr];
    if (S.cur !== "") t.push(S.cur); else t.pop();
    const line = t.join(" ");
    try {
      const r = Engine.evaluate(t);
      if (!Number.isFinite(r)) throw new Error("Invalid result");
      const res = Engine.fmt(r);
      S.expr = []; S.cur = res; S.done = true; S.line = line + " =";
      return { line, res };
    } catch (e) {
      S.err = e.message; S.line = line; S.expr = []; S.cur = "0"; S.done = false;
      return null;
    }
  };
  const pct = () => {
    if (S.err || S.cur === "") return false;
    const v = parseFloat(S.cur), n = S.expr.length;
    let r = v / 100;
    if (n >= 2 && (S.expr[n - 1] === "+" || S.expr[n - 1] === "−")) r = (parseFloat(S.expr[n - 2]) * v) / 100;
    S.cur = Engine.fmt(r);
    return true;
  };
  const sign = () => {
    if (S.err) return false;
    if (S.cur === "") S.cur = "-0";
    else S.cur = S.cur[0] === "-" ? S.cur.slice(1) : "-" + S.cur;
    return true;
  };
  const del = () => {
    if (S.err || S.done) { reset(); return true; }
    if (S.cur !== "") {
      S.cur = S.cur.slice(0, -1);
      if (S.cur === "" || S.cur === "-") S.cur = S.expr.length ? "" : "0";
    } else if (S.expr.length) { S.expr.pop(); S.cur = S.expr.pop() || "0"; }
    return true;
  };
  const recall = (v) => { reset(); S.cur = v; S.done = true; };
  const raw = () => (S.cur !== "" ? S.cur : S.expr[S.expr.length - 2] || "0");
  return { S, reset, digit, dot, op, equals, pct, sign, del, recall, raw };
})();

/* ============ 3. SOUND (Web Audio API, no files) ============ */
const Sound = (() => {
  let ctx, master, noiseBuf, last = 0;
  let on = store.get("nova-sound") !== "off";
  const r = (x, p) => x * (1 + (Math.random() * 2 - 1) * p);

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }
  function tone(f, { type = "sine", dur = 0.08, vol = 0.15, to = f, delay = 0 } = {}) {
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise({ dur = 0.03, vol = 0.25, freq = 2500, q = 1.2, delay = 0 } = {}) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t = ctx.currentTime + delay, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + dur + 0.01);
  }
  const ui = () => {
    tone(r(1200, 0.05), { dur: 0.07, vol: 0.09 });
    tone(r(1800, 0.05), { dur: 0.09, vol: 0.05, delay: 0.03 });
  };
  const kinds = {
    num: () => { noise({ freq: r(2200, 0.25), vol: r(0.22, 0.2), dur: 0.025 }); tone(r(180, 0.1), { type: "triangle", dur: 0.05, vol: 0.12 }); },
    op: () => { const f = r(620, 0.08); tone(f, { type: "square", dur: 0.09, vol: 0.05, to: f * 1.5 }); tone(f * 2, { dur: 0.12, vol: 0.08, delay: 0.02 }); },
    fn: ui, ui,
    ac: () => { noise({ freq: r(900, 0.1), vol: 0.3, dur: 0.05 }); tone(r(110, 0.05), { type: "triangle", dur: 0.09, vol: 0.2, to: 70 }); },
    del: () => { noise({ freq: r(1400, 0.1), vol: 0.28, dur: 0.035 }); tone(r(150, 0.05), { type: "triangle", dur: 0.06, vol: 0.16, to: 110 }); },
    eq: () => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { dur: 0.35, vol: 0.11, delay: i * 0.045 }));
      tone(130, { type: "sawtooth", dur: 0.2, vol: 0.04, to: 260 }); noise({ freq: 3500, vol: 0.12, dur: 0.04 });
    },
    theme: () => { tone(300, { dur: 0.12, vol: 0.12, to: 900 }); tone(900, { dur: 0.1, vol: 0.07, delay: 0.07, to: 600 }); },
    err: () => { tone(220, { dur: 0.12, vol: 0.13, to: 200 }); tone(165, { dur: 0.18, vol: 0.13, delay: 0.13, to: 140 }); }
  };
  function play(kind) {
    if (!on) return;
    const now = performance.now();
    if (now - last < 18) return; // avoid harsh stacking
    last = now;
    try { if (init() && kinds[kind]) kinds[kind](); } catch { /* audio must never break the calculator */ }
  }
  function setOn(v) { on = v; store.set("nova-sound", v ? "on" : "off"); }
  return { play, setOn, isOn: () => on, unlock: () => { try { init(); } catch { /* ignore */ } } };
})();

/* ============ 4. UI: rendering ============ */
const els = {
  result: $("#result"), expr: $("#expr"), status: $("#status"), dot: $("#dot"), calc: $("#calc"),
  ring: $("#ring"), toast: $("#toast"), list: $("#h-list"), hist: $("#history")
};
const caret = Object.assign(document.createElement("span"), { className: "caret" });
let lastShown = "";

const group = (s) => {
  if (/e/.test(s)) return s;
  const neg = s[0] === "-";
  let [i, d] = s.replace("-", "").split(".");
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + i + (d !== undefined ? "." + d : "");
};
function fit() {
  let s = Calc.S.err ? 26 : innerWidth < 400 || innerHeight < 700 ? 44 : 52;
  els.result.style.fontSize = s + "px";
  while (els.result.scrollWidth > els.result.clientWidth && s > 16) { s -= 2; els.result.style.fontSize = s + "px"; }
}
function render() {
  const S = Calc.S;
  const shown = S.err || group(Calc.raw());
  els.result.classList.toggle("err", !!S.err);
  els.result.replaceChildren(shown, caret);
  caret.classList.toggle("off", S.done || !!S.err);
  if (shown !== lastShown) {
    els.result.classList.remove("pop"); void els.result.offsetWidth; els.result.classList.add("pop");
    lastShown = shown;
  }
  const line = S.err || S.done ? S.line : S.expr.join(" ");
  els.expr.textContent = line.length > 34 ? "…" + line.slice(-33) : line;
  els.status.textContent = S.err ? "Error" : "Ready";
  els.dot.classList.toggle("err", !!S.err);
  fit();
}

/* ============ 5. UI: history, toast, copy ============ */
const History = {
  add(line, res) {
    const li = document.createElement("li"), b = document.createElement("button"), s = document.createElement("small"), v = document.createElement("b");
    b.className = "h-item"; b.setAttribute("aria-label", `${line} equals ${res}. Use this result`);
    s.textContent = line; v.textContent = "= " + group(res);
    b.append(s, v);
    b.addEventListener("click", () => { Calc.recall(res); render(); Sound.play("ui"); });
    li.append(b);
    els.list.prepend(li);
    while (els.list.children.length > 30) els.list.lastElementChild.remove();
  },
  clear() { els.list.replaceChildren(); }
};
let toastTimer;
function toast(msg) {
  els.toast.textContent = msg; els.toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
}
async function copyResult() {
  if (Calc.S.err) return;
  const t = Calc.raw();
  try { await navigator.clipboard.writeText(t); }
  catch {
    const a = Object.assign(document.createElement("textarea"), { value: t });
    a.style.cssText = "position:fixed;opacity:0"; document.body.append(a); a.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
    a.remove();
  }
  const b = $("#btn-copy");
  b.classList.add("ok"); setTimeout(() => b.classList.remove("ok"), 1400);
  toast("Result copied"); Sound.play("ui");
}

/* ============ 6. UI: key handling ============ */
const keys = [...document.querySelectorAll(".key")];
const byId = Object.fromEntries(keys.map((k) => [k.dataset.id, k]));

function run(id) {
  let ok = true, out = null;
  if (/^\d$/.test(id)) ok = Calc.digit(id);
  else switch (id) {
    case ".": ok = Calc.dot(); break;
    case "+": case "−": case "×": case "÷": ok = Calc.op(id); break;
    case "=": out = Calc.equals(); break;
    case "clear": Calc.reset(); break;
    case "del": Calc.del(); break;
    case "%": ok = Calc.pct(); break;
    case "sign": ok = Calc.sign(); break;
  }
  render();
  if (out) { History.add(out.line, out.res); flashRing(); }
  if (Calc.S.err) { shake(); Sound.play("err"); }
  else Sound.play(byId[id].dataset.kind);
  return ok;
}
function flashRing() { els.ring.classList.remove("flash"); void els.ring.offsetWidth; els.ring.classList.add("flash"); }
function shake() { els.calc.classList.remove("shake"); void els.calc.offsetWidth; els.calc.classList.add("shake"); }
function ripple(btn, e) {
  const b = btn.getBoundingClientRect(), s = Math.max(b.width, b.height) * 2.2;
  const x = e ? e.clientX - b.left : b.width / 2, y = e ? e.clientY - b.top : b.height / 2;
  const el = document.createElement("span");
  el.className = "ripple";
  el.style.cssText = `width:${s}px;height:${s}px;left:${x - s / 2}px;top:${y - s / 2}px`;
  btn.append(el);
  el.addEventListener("animationend", () => el.remove());
}
keys.forEach((b) => {
  b.addEventListener("pointerdown", (e) => { if (e.button === 0) { ripple(b, e); run(b.dataset.id); } });
  b.addEventListener("click", (e) => { if (e.detail === 0) { ripple(b); run(b.dataset.id); } }); // keyboard activation
});

const KEYMAP = { "+": "+", "-": "−", "*": "×", x: "×", X: "×", "/": "÷", Enter: "=", "=": "=", Backspace: "del", Escape: "clear", Delete: "clear", ".": ".", ",": ".", "%": "%" };
addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter" && e.target.closest && e.target.closest("#btn-sound,#btn-theme,#btn-history,#btn-copy,.h-item,#btn-hclear")) return;
  const id = /^\d$/.test(e.key) ? e.key : KEYMAP[e.key];
  if (!id) return;
  e.preventDefault();
  if (e.repeat && id !== "del") return;
  const b = byId[id];
  b.classList.add("down"); ripple(b); setTimeout(() => b.classList.remove("down"), 140);
  run(id);
});

/* ============ 7. UI: toolbar (sound, theme, history, copy) ============ */
const btnSound = $("#btn-sound"), btnTheme = $("#btn-theme"), btnHist = $("#btn-history");
function paintSound() {
  const on = Sound.isOn();
  btnSound.classList.toggle("muted", !on);
  btnSound.setAttribute("aria-pressed", String(!on));
  btnSound.setAttribute("aria-label", on ? "Mute sound" : "Unmute sound");
}
btnSound.addEventListener("click", () => {
  const next = !Sound.isOn();
  if (next) { Sound.setOn(true); Sound.unlock(); Sound.play("ui"); } else Sound.setOn(false);
  paintSound(); toast(next ? "Sound on" : "Sound muted");
});
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  btnTheme.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  store.set("nova-theme", t);
}
btnTheme.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  Sound.play("theme");
});
function setHistory(open) {
  els.hist.classList.toggle("open", open);
  btnHist.setAttribute("aria-expanded", String(open));
}
btnHist.addEventListener("click", () => { setHistory(!els.hist.classList.contains("open")); Sound.play("ui"); });
$("#btn-hclear").addEventListener("click", () => { History.clear(); Sound.play("ui"); });
$("#btn-copy").addEventListener("click", copyResult);

/* ============ 8. Visual effects (separate from logic) ============ */
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

addEventListener("pointermove", (e) => {
  document.body.style.setProperty("--mx", e.clientX + "px");
  document.body.style.setProperty("--my", e.clientY + "px");
  if (!finePointer || reduced || e.pointerType !== "mouse") return;
  els.calc.style.setProperty("--rx", (-(e.clientY / innerHeight - 0.5) * 8).toFixed(2) + "deg");
  els.calc.style.setProperty("--ry", ((e.clientX / innerWidth - 0.5) * 8).toFixed(2) + "deg");
});
document.addEventListener("pointerleave", () => { els.calc.style.setProperty("--rx", "0deg"); els.calc.style.setProperty("--ry", "0deg"); });

if (finePointer && !reduced) {
  keys.forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + "px");
      b.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.16).toFixed(1) + "px");
    });
    b.addEventListener("pointerleave", () => { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
  });
}

(function particles() {
  const c = $("#bg"), g = c.getContext("2d");
  let w, h, P = [];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function size() {
    w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
    const n = Math.min(70, Math.floor((innerWidth * innerHeight) / 24000));
    P = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3 * dpr, vy: (Math.random() - 0.5) * 0.3 * dpr,
      r: (Math.random() * 1.6 + 0.6) * dpr, hue: 180 + Math.random() * 140
    }));
  }
  function frame() {
    g.clearRect(0, 0, w, h);
    for (const p of P) {
      if (!reduced) { p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h; }
      g.fillStyle = `hsla(${p.hue},100%,65%,.65)`;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
    }
    const max = 120 * dpr;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
      if (d < max) { g.strokeStyle = `hsla(${P[i].hue},100%,70%,${(1 - d / max) * 0.18})`; g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke(); }
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  size(); frame();
  addEventListener("resize", () => { size(); if (reduced) frame(); render(); });
})();

/* ============ 9. Init ============ */
setTheme(store.get("nova-theme") === "light" ? "light" : "dark");
paintSound();
setHistory(innerWidth > 860);
addEventListener("pointerdown", () => { if (Sound.isOn()) Sound.unlock(); }, { once: true });
render();