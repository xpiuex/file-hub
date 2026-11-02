/* พื้นหลังจุดของหน้าแรก: ตาราง (grid) ที่ผลักออกจากเมาส์ (เดสก์ท็อป) หรือจุดสัมผัส (มือถือ/แท็บเล็ต) */
(function () {
  const section = document.getElementById("viewHome");
  if (!section) return;

  const canvas = document.createElement("canvas");
  canvas.id = "dotCanvas";
  canvas.setAttribute("aria-hidden", "true");
  section.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const SPACING = 22;      // ระยะห่างระหว่างจุด (px)
  const DOT = 1.3;         // รัศมีจุด (px)
  const R_MOUSE = 120;     // รัศมีอิทธิพลของเมาส์
  const R_TOUCH = 150;     // รัศมีอิทธิพลของการสัมผัส
  const FORCE = 3.2;       // แรงผลัก
  const K = 0.06;          // แรงดึงกลับไปตำแหน่งเดิม (สปริง)
  const DAMP = 0.82;       // แรงหน่วง ทำให้เคลื่อนไหวลื่นและหยุดนิ่ง

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, dots = [];
  let ptr = { active: false, x: 0, y: 0, r: R_MOUSE };
  let visible = false, running = false;

  function build() {
    const rect = section.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
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

  // สีจุดไล่จาก primary ไป tertiary ตามตำแหน่ง ให้หน้าแรกมีสีสัน
  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const a = (cs.getPropertyValue("--c-primary").trim() || "180 197 255").split(/\s+/).map(Number);
    const b = (cs.getPropertyValue("--c-tertiary").trim() || "255 181 150").split(/\s+/).map(Number);
    return { a, b };
  }
  function mix(p, q, t) {
    return `rgb(${Math.round(p[0] + (q[0] - p[0]) * t)} ${Math.round(p[1] + (q[1] - p[1]) * t)} ${Math.round(p[2] + (q[2] - p[2]) * t)} / 0.85)`;
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    const pal = palette();

    const R = ptr.r, R2 = R * R;
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
      // สปริงดึงกลับ + หน่วง
      d.vx += -K * (d.x - d.ox);
      d.vy += -K * (d.y - d.oy);
      d.vx *= DAMP;
      d.vy *= DAMP;
      d.x += d.vx;
      d.y += d.vy;

      ctx.fillStyle = mix(pal.a, pal.b, Math.min(1, Math.max(0, (d.ox / (w || 1) + d.oy / (h || 1)) / 2)));
      ctx.beginPath();
      ctx.arc(d.x, d.y, DOT, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
  }

  // ตำแหน่งของเมาส์/นิ้วเทียบกับพื้นที่หน้าแรก
  function setPointer(e) {
    const r = section.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.r = e.pointerType === "touch" ? R_TOUCH : R_MOUSE;
    ptr.active = true;
  }
  function clearPointer() {
    ptr.active = false;
  }

  section.addEventListener("pointerdown", setPointer);
  section.addEventListener("pointermove", setPointer);
  section.addEventListener("pointerup", clearPointer);
  section.addEventListener("pointercancel", clearPointer);
  section.addEventListener("pointerleave", clearPointer);

  // สร้างตารางใหม่เมื่อขนาดเปลี่ยน (รวมถึงตอนหน้าแรกถูกแสดงครั้งแรก)
  new ResizeObserver(() => {
    build();
  }).observe(section);

  // หยุดการคำนวณเมื่อหน้าแรกไม่ได้แสดงอยู่
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    visible ? startLoop() : stopLoop();
  }).observe(section);

  build();
})();
