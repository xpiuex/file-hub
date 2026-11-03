/* พื้นหลังจุดของหน้าแรก: ตาราง (grid) ที่ผลักออกจากเมาส์ (เดสก์ท็อป) หรือจุดสัมผัส (มือถือ/แท็บเล็ต)
   ปรับให้เบาลง: วาดด้วย fillRect, อ่านสีไม่บ่อย, และหยุดคำนวณเมื่อจุดกลับนิ่งแล้ว */
(function () {
  const section = document.getElementById("viewHome");
  if (!section) return;

  const canvas = document.createElement("canvas");
  canvas.id = "dotCanvas";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const SPACING = 22;
  const DOT = 1.4;
  const R_MOUSE = 120;
  const R_TOUCH = 150;
  const FORCE = 3.2;
  const K = 0.06;
  const DAMP = 0.82;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, dots = [];
  let color = "#888";
  let tick = 0;
  const ptr = { active: false, x: 0, y: 0, r: R_MOUSE };
  let visible = false, running = false;

  function build() {
    const rect = section.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = [];
    const cols = Math.ceil(w / SPACING) + 1;
    const rows = Math.ceil(h / SPACING) + 1;
    const offX = (w - (cols - 1) * SPACING) / 2;
    const offY = (h - (rows - 1) * SPACING) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offX + c * SPACING;
        const y = offY + r * SPACING;
        dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
      }
    }
  }

  function readColor() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim();
    color = v ? `rgb(${v} / 0.75)` : "#888";
  }

  function frame() {
    if (!running) return;
    if (tick++ % 60 === 0) readColor();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;

    const R = ptr.r, R2 = R * R;
    let moving = false;
    for (const d of dots) {
      if (ptr.active && !reduceMotion) {
        const dx = d.x - ptr.x, dy = d.y - ptr.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < R2) {
          const dist = Math.sqrt(dist2) || 0.001;
          const f = 1 - dist / R;
          const push = FORCE * f * f;
          d.vx += (dx / dist) * push;
          d.vy += (dy / dist) * push;
        }
      }
      d.vx += -K * (d.x - d.ox);
      d.vy += -K * (d.y - d.oy);
      d.vx *= DAMP;
      d.vy *= DAMP;
      d.x += d.vx;
      d.y += d.vy;

      if (Math.abs(d.vx) + Math.abs(d.vy) > 0.02 || Math.abs(d.x - d.ox) + Math.abs(d.y - d.oy) > 0.05) {
        moving = true;
      }
      ctx.fillRect(d.x - DOT / 2, d.y - DOT / 2, DOT, DOT);
    }

    // หยุดคำนวณเมื่อไม่มีการสัมผัสและจุดกลับนิ่งแล้ว (จะเริ่มใหม่เมื่อมีการสัมผัส)
    if (ptr.active || moving) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function startLoop() {
    if (running || !visible) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function setPointer(e) {
    const r = section.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.r = e.pointerType === "touch" ? R_TOUCH : R_MOUSE;
    ptr.active = true;
    startLoop();
  }
  function clearPointer() {
    ptr.active = false;
  }

  section.addEventListener("pointerdown", setPointer);
  section.addEventListener("pointermove", setPointer);
  section.addEventListener("pointerup", clearPointer);
  section.addEventListener("pointercancel", clearPointer);
  section.addEventListener("pointerleave", clearPointer);

  new ResizeObserver(() => {
    build();
    startLoop();
  }).observe(section);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) startLoop();
    else running = false;
  }).observe(section);

  build();
  readColor();
})();
