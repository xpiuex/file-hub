import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ===== ตั้งค่า ===== */
const SUPABASE_URL = "https://qxatfxjaemqumxhgqlgu.supabase.co";
const SUPABASE_KEY = "sb_publishable_kFK1TySyqbOldG1X2FcijA_aFi9Udpk";
/* ================== */

const BUCKET = "project-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_PROJECT_NAME = "ไฟล์ทั่วไป";
const DB_LIMIT = 500 * 1024 * 1024;
const STORAGE_LIMIT = 1024 * 1024 * 1024;
const DOWNLOAD_LINK_SECONDS = 60;
const SHARE_LINK_SECONDS = 3600;
const RECENT_DAYS = 7;

const TYPE_LABELS = { PDF: "PDF", IMAGE: "Image", DOCUMENT: "Document", ARCHIVE: "Archive", DESIGN: "Design", VIDEO: "Video", OTHER: "Other" };
const NAV_VIEWS = { Files: "files", Shared: "shared", Recent: "recent", Trash: "trash" };
const NAV_ACTIVE = "text-on-surface font-label-md text-label-md border-b-2 border-primary-container pb-1 transition-colors";
const NAV_INACTIVE = "text-on-surface-variant font-label-md text-label-md transition-colors hover:text-on-surface";
const COL_KEYS = { 2: "category", 3: "size", 4: "date" };

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let projects = [];
let files = [];
let shareRows = [];
let shown = [];
let view = "files";
let typeFilter = "all";
let searchQ = "";
let page = 1;
let perPage = 10;
let selected = new Set();
let cols = { category: true, size: true, date: true };
let activity = [];
let canDelete = false;
let pendingAction = null;
let openPop = null;
let typeBtn = null;

/* ---------- Utilities ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtSize = (b) => {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 4);
  return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + u[i];
};
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function fileType(name) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "PDF";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "IMAGE";
  if (["doc", "docx", "txt", "md", "xlsx", "csv"].includes(ext)) return "DOCUMENT";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "ARCHIVE";
  if (["fig", "sketch", "xd"].includes(ext)) return "DESIGN";
  if (["mp4", "mov", "webm"].includes(ext)) return "VIDEO";
  return "OTHER";
}

const fileInfo = (name) => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return { label: "PDF Document", icon: "picture_as_pdf", cls: "bg-error-container/20 border-error-container/40 text-error" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { label: "Raster Image", icon: "image", cls: "bg-primary-container/20 border-primary-container/30 text-primary" };
  if (ext === "svg") return { label: "SVG Vector Graphic", icon: "brush", cls: "bg-secondary-container/30 border-secondary-container/50 text-secondary" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { label: "Compressed Archive", icon: "folder_zip", cls: "bg-tertiary-container/30 border-tertiary-container/40 text-tertiary" };
  if (["doc", "docx", "txt", "md"].includes(ext)) return { label: "Document", icon: "description", cls: "bg-surface-container-high border-outline-variant text-outline" };
  if (["fig", "sketch", "xd"].includes(ext)) return { label: "Design File", icon: "dashboard_customize", cls: "bg-primary-container/20 border-primary-container/30 text-primary" };
  if (["mp4", "mov", "webm"].includes(ext)) return { label: "Video", icon: "movie", cls: "bg-primary-container/15 border-primary-container/25 text-primary-fixed" };
  return { label: ext ? ext.toUpperCase() + " File" : "File", icon: "description", cls: "bg-surface-container-high border-outline-variant text-outline" };
};

const projectName = (id) => projects.find((p) => p.id === id)?.name ?? "-";

function showToast(msg, icon = "check_circle") {
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  document.getElementById("toastIcon").textContent = icon;
  t.classList.remove("hidden"); t.classList.add("flex");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.classList.add("hidden"); t.classList.remove("flex"); }, 2800);
}
window.showToast = showToast;

function logActivity(msg) {
  activity.unshift({ msg, time: new Date() });
  activity = activity.slice(0, 30);
}

/* ---------- เมนูลอย (อยู่ใน body จึงไม่ถูกตัดหรือทับ) ---------- */
function closePop() {
  if (openPop) openPop.remove();
  openPop = null;
}
window.addEventListener("scroll", closePop, true);
window.addEventListener("resize", closePop);

function positionPop(el, anchor) {
  const r = anchor.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight;
  let top = r.bottom + 4;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
  let left = r.right - w;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  el.style.top = top + "px";
  el.style.left = left + "px";
}

function openPopover(anchor, html, key, width = "w-44") {
  if (openPop && openPop.dataset.key === key) return closePop();
  closePop();
  const el = document.createElement("div");
  el.id = "floatingMenu";
  el.dataset.key = key;
  el.className = `fixed z-[60] ${width} rounded-lg bg-surface-container-highest border border-outline-variant shadow-xl p-1 text-on-surface`;
  el.innerHTML = html;
  document.body.appendChild(el);
  positionPop(el, anchor);
  openPop = el;
}

const item = (act, icon, label, id, extra = "") =>
  `<button type="button" data-act="${act}" data-id="${esc(id)}" class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container transition-colors ${extra}">
     <span class="material-symbols-outlined !text-[15px]">${icon}</span><span>${label}</span>
   </button>`;

const divider = `<div class="h-px bg-outline-variant my-1"></div>`;

function rowMenuHtml(f) {
  if (view === "trash") {
    return item("restore", "restore_from_trash", "Restore", f.id) +
           item("purge", "delete_forever", "Delete permanently", f.id, "text-error");
  }
  return item("download", "download", "Download", f.id) +
         item("share", "link", "Share link", f.id) +
         item("rename", "edit", "Rename", f.id) +
         divider +
         item("delete", "delete", "Move to trash", f.id, "text-error");
}

function typeMenuHtml() {
  const opts = [["all", "All Types"], ...Object.entries(TYPE_LABELS).map(([v, l]) => [v, l])];
  return opts.map(([v, l]) => `
    <button type="button" data-act="type" data-val="${v}" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container transition-colors ${typeFilter === v ? "text-primary" : ""}">
      <span>${l}</span>${typeFilter === v ? '<span class="material-symbols-outlined !text-[15px]">check</span>' : ""}
    </button>`).join("");
}

function colsMenuHtml() {
  const row = (key, label) => `
    <button type="button" data-act="col" data-val="${key}" class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container transition-colors">
      <span class="material-symbols-outlined !text-[15px]">${cols[key] ? "check_box" : "check_box_outline_blank"}</span><span>${label}</span>
    </button>`;
  return `<div class="px-2.5 py-1 text-[11px] text-outline">คอลัมน์ที่แสดง</div>` +
    row("category", "Category") + row("size", "File Size") + row("date", "Uploaded Date");
}

function notifyHtml() {
  const list = activity.slice(0, 15).map((a) => `
    <div class="px-2.5 py-2 border-b border-outline-variant last:border-0">
      <div class="text-body-sm text-on-surface">${esc(a.msg)}</div>
      <div class="text-[11px] text-outline">${a.time.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>`).join("");
  return list || `<div class="px-2.5 py-3 text-body-sm text-outline">ยังไม่มีการแจ้งเตือนในเซสชันนี้</div>`;
}

function syncTypeLabel() {
  if (!typeBtn) return;
  typeBtn.querySelectorAll("span")[1].textContent = typeFilter === "all" ? "All Types" : TYPE_LABELS[typeFilter];
}

/* ---------- สิทธิ์และการล็อกอิน ---------- */
const loginScreen = document.getElementById("loginScreen");
const logoutBtn = document.getElementById("logoutBtn");

function showLogin(msg = "") {
  loginScreen.classList.remove("hidden");
  loginScreen.classList.add("flex");
  document.getElementById("loginMsg").textContent = msg;
}

function hideLogin() {
  loginScreen.classList.add("hidden");
  loginScreen.classList.remove("flex");
}

async function refreshPermission() {
  const { data: { session } } = await sb.auth.getSession();
  logoutBtn.textContent = session ? "ออกจากระบบ" : "เข้าสู่ระบบ";
  if (!session) {
    canDelete = false;
    return;
  }
  const { data, error } = await sb.rpc("is_allowed");
  canDelete = !error && data === true;
}

sb.auth.onAuthStateChange(() => {
  setTimeout(refreshPermission, 0);
});

// ทำงานเฉพาะเมื่อมีสิทธิ์ ถ้าไม่มีจะแสดงหน้าล็อกอินแล้วทำงานต่อหลังล็อกอิน
async function requireAdmin(action) {
  await refreshPermission();
  if (canDelete) return action();
  pendingAction = action;
  showLogin("เข้าสู่ระบบด้วยอีเมลที่ได้รับสิทธิ์เพื่อดำเนินการนี้");
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return showLogin("เข้าสู่ระบบไม่สำเร็จ: " + error.message);

  await refreshPermission();
  if (!canDelete) {
    await sb.auth.signOut();
    pendingAction = null;
    return showLogin("อีเมลนี้ไม่มีสิทธิ์ดำเนินการนี้");
  }

  hideLogin();
  document.getElementById("loginPassword").value = "";
  showToast("เข้าสู่ระบบแล้ว");

  const action = pendingAction;
  pendingAction = null;
  if (action) await action();
});

document.getElementById("loginCancel")?.addEventListener("click", () => {
  pendingAction = null;
  hideLogin();
});

logoutBtn.addEventListener("click", async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await sb.auth.signOut();
    showToast("ออกจากระบบแล้ว");
  } else {
    showLogin("");
  }
});

/* ---------- ขนาดพื้นที่ ---------- */
async function loadUsage() {
  const { data, error } = await sb.rpc("get_storage_usage");
  if (error) {
    document.getElementById("dbText").textContent = "อ่านไม่สำเร็จ";
    document.getElementById("stText").textContent = "อ่านไม่สำเร็จ";
    return;
  }
  const pct = (v, l) => Math.min(100, (v / l) * 100);
  const db = Number(data.db_bytes || 0);
  const st = Number(data.storage_bytes || 0);

  document.getElementById("dbText").textContent = `${fmtSize(db)} / ${fmtSize(DB_LIMIT)}`;
  document.getElementById("dbBar").style.width = pct(db, DB_LIMIT) + "%";
  document.getElementById("dbPct").textContent = `ใช้แล้ว ${pct(db, DB_LIMIT).toFixed(1)}% ของโควต้า`;

  document.getElementById("stText").textContent = `${fmtSize(st)} / ${fmtSize(STORAGE_LIMIT)}`;
  document.getElementById("stBar").style.width = pct(st, STORAGE_LIMIT) + "%";
  document.getElementById("stPct").textContent = `ใช้แล้ว ${pct(st, STORAGE_LIMIT).toFixed(1)}% ของโควต้า`;
}
document.getElementById("usageRefreshBtn").addEventListener("click", loadUsage);

/* ---------- โหลดและแสดงข้อมูล ---------- */
async function loadAll() {
  const [p, f, s] = await Promise.all([
    sb.from("projects").select("*").order("created_at", { ascending: false }),
    sb.from("files").select("*").order("uploaded_at", { ascending: false }),
    sb.from("share_links").select("file_id, expires_at").gt("expires_at", new Date().toISOString()),
  ]);
  const err = p.error || f.error;
  if (err) return showToast(err.message, "error");
  if (s.error) console.warn("อ่านรายการแชร์ไม่สำเร็จ (ยังไม่ได้รัน SQL?):", s.error.message);

  projects = p.data;
  files = f.data;
  shareRows = s.error ? [] : s.data;
  const ids = new Set(files.map((x) => x.id));
  selected = new Set([...selected].filter((id) => ids.has(id)));
  render();
  loadUsage();
}

function computeShown() {
  const q = searchQ.toLowerCase();
  const now = Date.now();
  const sharedIds = new Set(shareRows.map((r) => r.file_id));

  let list;
  if (view === "trash") {
    list = files.filter((f) => f.deleted_at);
  } else {
    list = files.filter((f) => !f.deleted_at);
    if (view === "recent") list = list.filter((f) => now - new Date(f.uploaded_at).getTime() <= RECENT_DAYS * 864e5);
    if (view === "shared") list = list.filter((f) => sharedIds.has(f.id));
  }
  if (typeFilter !== "all") list = list.filter((f) => fileType(f.file_name) === typeFilter);
  if (q) list = list.filter((f) =>
    f.file_name.toLowerCase().includes(q) || projectName(f.project_id).toLowerCase().includes(q));
  return list;
}

function emptyMessage() {
  return {
    files: "ไม่พบไฟล์ที่ตรงกับตัวกรอง",
    shared: "ยังไม่มีไฟล์ที่แชร์ (ลิงก์ที่ยังไม่หมดอายุ)",
    recent: `ไม่มีไฟล์ที่อัปโหลดใน ${RECENT_DAYS} วันที่ผ่านมา`,
    trash: "ถังขยะว่างเปล่า",
  }[view];
}

function rowHtml(f) {
  const info = fileInfo(f.file_name);
  const id = esc(f.id);
  return `
  <tr class="bg-transparent hover:bg-surface-container/40 transition-colors group">
    <td class="px-4 py-3 text-center">
      <input class="row-checkbox w-4 h-4 rounded bg-surface border-outline-variant text-primary-container focus:ring-primary-container focus:ring-offset-surface cursor-pointer" data-id="${id}" type="checkbox" ${selected.has(f.id) ? "checked" : ""}/>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${info.cls}">
          <span class="material-symbols-outlined !text-[18px]">${info.icon}</span>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-medium text-on-surface truncate group-hover:text-primary transition-colors">${esc(f.file_name)}</span>
          <span class="font-body-sm text-body-sm text-outline truncate">${esc(info.label)}</span>
        </div>
      </div>
    </td>
    <td class="px-4 py-3">
      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-label-md font-medium bg-surface-container-high text-on-surface border border-outline-variant">${esc(projectName(f.project_id))}</span>
    </td>
    <td class="px-4 py-3 font-code-inline text-code-inline text-on-surface-variant tabular-nums">${fmtSize(f.file_size)}</td>
    <td class="px-4 py-3 text-on-surface-variant font-body-sm text-body-sm">${fmtDate(f.uploaded_at)}</td>
    <td class="px-4 py-3 text-right">
      <button type="button" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-act="menu" data-id="${id}" title="More options">
        <span class="material-symbols-outlined !text-[18px] pointer-events-none">more_horiz</span>
      </button>
    </td>
  </tr>`;
}

function applyColumns() {
  document.querySelectorAll("table tr").forEach((tr) => {
    [...tr.children].forEach((cell, i) => {
      const key = COL_KEYS[i];
      if (key) cell.style.display = cols[key] ? "" : "none";
    });
  });
}

function render() {
  shown = computeShown();

  const showEmpty = view === "files" && files.filter((f) => !f.deleted_at).length === 0;
  const es = document.getElementById("emptyState");
  es.classList.toggle("hidden", !showEmpty);
  es.classList.toggle("flex", showEmpty);
  document.getElementById("tableCard").classList.toggle("hidden", showEmpty);

  const pages = Math.max(1, Math.ceil(shown.length / perPage));
  page = Math.min(page, pages);
  const slice = shown.slice((page - 1) * perPage, page * perPage);

  document.getElementById("tableBody").innerHTML = slice.length
    ? slice.map(rowHtml).join("")
    : `<tr><td colspan="6" class="px-4 py-10 text-center text-outline font-body-sm">${emptyMessage()}</td></tr>`;

  document.getElementById("pageInfo").textContent = `Page ${page} of ${pages}`;
  document.getElementById("firstPage").disabled = page <= 1;
  document.getElementById("prevPage").disabled = page <= 1;
  document.getElementById("nextPage").disabled = page >= pages;
  document.getElementById("lastPage").disabled = page >= pages;
  document.getElementById("totalCount").textContent = shown.length;
  document.getElementById("selCount").textContent = selected.size;

  applyColumns();
  updateSelectAll();
}

function updateSelectAll() {
  const boxes = [...document.querySelectorAll("#tableBody .row-checkbox")];
  const checked = boxes.filter((b) => b.checked).length;
  const master = document.getElementById("selectAll");
  master.checked = boxes.length > 0 && checked === boxes.length;
  master.indeterminate = checked > 0 && checked < boxes.length;
}

/* ---------- เปลี่ยนมุมมอง (Files / Shared / Recent / Trash) ---------- */
function setView(v) {
  view = v;
  page = 1;
  selected.clear();
  document.querySelectorAll("header nav a").forEach((a) => {
    a.className = NAV_VIEWS[a.textContent.trim()] === v ? NAV_ACTIVE : NAV_INACTIVE;
  });
  render();
}

/* ---------- Checkbox ---------- */
document.getElementById("tableBody").addEventListener("change", (e) => {
  if (!e.target.classList.contains("row-checkbox")) return;
  const id = e.target.dataset.id;
  e.target.checked ? selected.add(id) : selected.delete(id);
  document.getElementById("selCount").textContent = selected.size;
  updateSelectAll();
});

document.getElementById("selectAll").addEventListener("change", (e) => {
  document.querySelectorAll("#tableBody .row-checkbox").forEach((cb) => {
    cb.checked = e.target.checked;
    e.target.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id);
  });
  document.getElementById("selCount").textContent = selected.size;
});

/* ---------- คลิกทุกปุ่มที่มี data-act (จุดเดียว) ---------- */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) {
    if (!e.target.closest("#floatingMenu")) closePop();
    return;
  }

  const act = el.dataset.act;
  const f = files.find((x) => x.id === el.dataset.id);

  switch (act) {
    case "menu":
      if (f) openPopover(el, rowMenuHtml(f), "row-" + f.id, "w-44");
      return;
    case "open-type":
      return openPopover(el, typeMenuHtml(), "type", "w-44");
    case "open-cols":
      return openPopover(el, colsMenuHtml(), "cols", "w-52");
    case "open-notify":
      return openPopover(el, notifyHtml(), "notify", "w-80");
    case "type":
      typeFilter = el.dataset.val;
      closePop();
      syncTypeLabel();
      page = 1;
      render();
      return;
    case "col":
      cols[el.dataset.val] = !cols[el.dataset.val];
      if (openPop) openPop.innerHTML = colsMenuHtml();
      applyColumns();
      return;
    case "import-url":
      closePop();
      return importFromUrl();
  }

  closePop();
  if (!f) return;
  if (act === "download") return downloadFile(f);
  if (act === "share") return shareFile(f);
  if (act === "rename") return requireAdmin(() => renameFile(f));
  if (act === "delete") return requireAdmin(() => trashFile(f));
  if (act === "restore") return requireAdmin(() => restoreFile(f));
  if (act === "purge") return requireAdmin(() => purgeFile(f));
});

/* ---------- แถบความคืบหน้า ---------- */
function ensureTransferPanel() {
  let panel = document.getElementById("transferPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "transferPanel";
    panel.className = "fixed bottom-6 left-6 w-80 max-w-[calc(100vw-3rem)] flex flex-col gap-2 z-50";
    document.body.appendChild(panel);
  }
  return panel;
}

function addTransfer(name) {
  const el = document.createElement("div");
  el.className = "rounded-lg bg-surface-container-high border border-outline-variant shadow-xl p-3 space-y-2";
  el.innerHTML = `
    <div class="flex items-center justify-between gap-2">
      <span class="font-label-md text-label-md text-on-surface truncate" data-name></span>
      <span class="font-code-inline text-code-inline text-on-surface-variant shrink-0" data-pct>0%</span>
    </div>
    <div class="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
      <div class="bg-primary-container h-full rounded-full transition-all duration-150" data-bar style="width: 0%"></div>
    </div>
    <div class="flex items-center justify-between font-body-sm text-body-sm text-outline gap-2">
      <span data-size>เริ่มดาวน์โหลด...</span>
      <span data-status>กำลังดำเนินการ</span>
    </div>`;
  el.querySelector("[data-name]").textContent = name;
  ensureTransferPanel().appendChild(el);
  return { el };
}

function updateTransfer(t, received, total) {
  const bar = t.el.querySelector("[data-bar]");
  if (total > 0) {
    const pct = Math.min(100, (received / total) * 100);
    bar.style.width = pct + "%";
    t.el.querySelector("[data-pct]").textContent = pct.toFixed(0) + "%";
    t.el.querySelector("[data-size]").textContent = `${fmtSize(received)} / ${fmtSize(total)}`;
  } else {
    bar.style.width = "100%";
    bar.classList.add("animate-pulse");
    t.el.querySelector("[data-pct]").textContent = "—";
    t.el.querySelector("[data-size]").textContent = fmtSize(received);
  }
}

function finishTransfer(t, ok, msg = "") {
  const bar = t.el.querySelector("[data-bar]");
  bar.classList.remove("animate-pulse");
  if (ok) {
    bar.style.width = "100%";
    t.el.querySelector("[data-pct]").textContent = "100%";
    t.el.querySelector("[data-status]").textContent = "เสร็จแล้ว";
    setTimeout(() => t.el.remove(), 4000);
  } else {
    bar.classList.replace("bg-primary-container", "bg-error");
    const st = t.el.querySelector("[data-status]");
    st.textContent = "ไม่สำเร็จ" + (msg ? ": " + msg : "");
    st.classList.add("text-error");
    setTimeout(() => t.el.remove(), 8000);
  }
}

// อ่านข้อมูลทีละส่วนพร้อมอัปเดตความคืบหน้า
async function readWithProgress(res, t, fallbackTotal) {
  const total = Number(res.headers.get("content-length")) || fallbackTotal || 0;
  if (!res.body) {
    const b = await res.blob();
    updateTransfer(t, b.size, b.size);
    return b;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    updateTransfer(t, received, total);
  }
  return new Blob(chunks, { type: res.headers.get("content-type") || "application/octet-stream" });
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* ---------- ดาวน์โหลด (มีเปอร์เซ็นต์) ---------- */
async function downloadFile(f) {
  const { data, error } = await sb.storage.from(BUCKET)
    .createSignedUrl(f.storage_path, DOWNLOAD_LINK_SECONDS);
  if (error) return showToast(error.message, "error");

  const t = addTransfer(f.file_name);
  try {
    const res = await fetch(data.signedUrl);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await readWithProgress(res, t, Number(f.file_size) || 0);
    saveBlob(blob, f.file_name);
    finishTransfer(t, true);
    logActivity(`ดาวน์โหลด "${f.file_name}"`);
  } catch (err) {
    // ถ้าอ่านแบบมีความคืบหน้าไม่ได้ (เช่น CORS) ให้เปิดลิงก์ตรงแทน
    finishTransfer(t, false, err.message);
    window.open(data.signedUrl, "_blank");
  }
}

/* ---------- นำเข้าจาก URL ---------- */
async function importFromUrl() {
  const input = prompt("วาง URL ของไฟล์ (ต้องเป็น https:// และเข้าถึงจากเบราว์เซอร์ได้)");
  if (!input) return;

  let u;
  try { u = new URL(input.trim()); } catch { return showToast("URL ไม่ถูกต้อง", "error"); }
  if (u.protocol !== "https:") return showToast("รองรับเฉพาะ https://", "error");

  let name = "imported-file";
  try { name = decodeURIComponent(u.pathname.split("/").pop() || "") || name; } catch {}

  const t = addTransfer(name);
  try {
    const res = await fetch(u.href);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await readWithProgress(res, t, 0);
    finishTransfer(t, true);
    await uploadFileObject(new File([blob], name, { type: blob.type }));
  } catch (err) {
    finishTransfer(t, false, err.message);
  }
}

/* ---------- แชร์ลิงก์ (ใช้ได้ 1 ชั่วโมง) ---------- */
async function shareFile(f) {
  const { data, error } = await sb.storage.from(BUCKET)
    .createSignedUrl(f.storage_path, SHARE_LINK_SECONDS);
  if (error) return showToast(error.message, "error");

  const expires = new Date(Date.now() + SHARE_LINK_SECONDS * 1000).toISOString();
  const { error: shErr } = await sb.from("share_links").insert({ file_id: f.id, expires_at: expires });
  if (shErr) console.warn("บันทึกรายการแชร์ไม่สำเร็จ:", shErr.message);

  try {
    await navigator.clipboard.writeText(data.signedUrl);
    showToast("คัดลอกลิงก์แล้ว (ใช้ได้ 1 ชั่วโมง)", "link");
  } catch {
    prompt("คัดลอกลิงก์นี้ (ใช้ได้ 1 ชั่วโมง)", data.signedUrl);
  }
  logActivity(`แชร์ "${f.file_name}"`);
  loadAll();
}

/* ---------- เปลี่ยนชื่อ (ต้องมีสิทธิ์) ---------- */
async function renameFile(f) {
  const newName = prompt("ชื่อไฟล์ใหม่", f.file_name);
  if (!newName || !newName.trim() || newName.trim() === f.file_name) return;

  const { data, error } = await sb.from("files")
    .update({ file_name: newName.trim() })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast("ไม่มีสิทธิ์เปลี่ยนชื่อไฟล์นี้", "error");

  logActivity(`เปลี่ยนชื่อเป็น "${newName.trim()}"`);
  showToast("เปลี่ยนชื่อแล้ว");
  loadAll();
}

/* ---------- ย้ายไปถังขยะ / กู้คืน / ลบถาวร (ต้องมีสิทธิ์) ---------- */
async function trashFile(f) {
  if (!confirm("ย้ายไฟล์นี้ไปถังขยะ?")) return;
  const { data, error } = await sb.from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast("ไม่มีสิทธิ์ย้ายไฟล์นี้", "error");

  logActivity(`ย้าย "${f.file_name}" ไปถังขยะ`);
  showToast("ย้ายไปถังขยะแล้ว");
  loadAll();
}

async function restoreFile(f) {
  const { data, error } = await sb.from("files")
    .update({ deleted_at: null })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast("ไม่มีสิทธิ์กู้คืนไฟล์นี้", "error");

  logActivity(`กู้คืน "${f.file_name}"`);
  showToast("กู้คืนแล้ว");
  loadAll();
}

async function purgeFile(f) {
  if (!confirm("ลบถาวร? กู้คืนไม่ได้")) return;
  const { data, error } = await sb.from("files").delete().eq("id", f.id).select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast("ไม่มีสิทธิ์ลบไฟล์นี้", "error");

  await sb.storage.from(BUCKET).remove([f.storage_path]);
  logActivity(`ลบถาวร "${f.file_name}"`);
  showToast("ลบถาวรแล้ว");
  loadAll();
}

/* ---------- อัปโหลด (ไม่ต้องล็อกอิน) ---------- */
async function getDefaultProjectId() {
  if (projects.length) return projects[0].id;

  const { data: found, error: findErr } = await sb.from("projects")
    .select("*").eq("name", DEFAULT_PROJECT_NAME).limit(1).maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (found) {
    projects.unshift(found);
    return found.id;
  }

  const { data: created, error } = await sb.from("projects")
    .insert({ name: DEFAULT_PROJECT_NAME, category: "General" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  projects.unshift(created);
  return created.id;
}

async function uploadFileObject(file) {
  if (file.size > MAX_FILE_SIZE) return showToast("ไฟล์ใหญ่เกิน 50 MB", "error");

  let projectId;
  try {
    projectId = await getDefaultProjectId();
  } catch (err) {
    return showToast("เตรียมโปรเจกต์ไม่สำเร็จ: " + err.message, "error");
  }

  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;

  showToast("กำลังอัปโหลด...", "cloud_upload");
  const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (upErr) return showToast(upErr.message, "error");

  const { error } = await sb.from("files").insert({
    project_id: projectId,
    file_name: file.name,
    file_type: file.type || null,
    file_size: file.size,
    storage_path: storagePath,
    url: "",
  });
  if (error) {
    await sb.storage.from(BUCKET).remove([storagePath]);
    return showToast(error.message, "error");
  }
  logActivity(`อัปโหลด "${file.name}"`);
  showToast("อัปโหลดสำเร็จ");
  loadAll();
}

document.querySelectorAll("[data-upload]").forEach((btn) => {
  btn.addEventListener("click", () => document.getElementById("fileInputHidden").click());
});

document.getElementById("fileInputHidden").addEventListener("change", (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (file) uploadFileObject(file);
});

/* ---------- ค้นหา / แบ่งหน้า / อื่น ๆ ---------- */
document.getElementById("fileSearch").addEventListener("input", (e) => {
  searchQ = e.target.value.trim();
  page = 1;
  render();
});

document.getElementById("perPage").addEventListener("change", (e) => {
  perPage = Number(e.target.value);
  page = 1;
  render();
});
document.getElementById("firstPage").addEventListener("click", () => { page = 1; render(); });
document.getElementById("prevPage").addEventListener("click", () => { page--; render(); });
document.getElementById("nextPage").addEventListener("click", () => { page++; render(); });
document.getElementById("lastPage").addEventListener("click", () => {
  page = Math.max(1, Math.ceil(shown.length / perPage));
  render();
});

document.getElementById("refreshBtn").addEventListener("click", loadAll);

function applyTheme(name) {
  window.__setTheme(name);
  const btn = document.getElementById("themeToggleBtn");
  btn.querySelector(".material-symbols-outlined").textContent = name === "dark" ? "light_mode" : "dark_mode";
  btn.title = name === "dark" ? "สลับเป็นธีมสว่าง" : "สลับเป็นธีมมืด";
}

document.getElementById("themeToggleBtn").addEventListener("click", () => {
  applyTheme(localStorage.getItem("theme") === "light" ? "dark" : "light");
});

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    document.getElementById("fileSearch")?.focus();
  }
});

/* ---------- เริ่มต้น: ถอด onclick เดโมของปุ่มและผูกฟังก์ชันจริง ---------- */
function init() {
  const byText = (txt) => [...document.querySelectorAll("button")].filter((b) => b.textContent.includes(txt));
  const setAct = (el, act) => {
    if (!el) return;
    el.removeAttribute("onclick");
    el.dataset.act = act;
  };

  typeBtn = byText("All Types")[0] || null;
  setAct(typeBtn, "open-type");
  setAct(byText("Columns")[0], "open-cols");
  setAct(document.querySelector('button[title="View columns"]'), "open-cols");
  setAct(document.querySelector('button[title="Notifications"]'), "open-notify");
  byText("Import from Cloud").forEach((b) => setAct(b, "import-url"));

  // ทำให้เมนูด้านบนแสดงบนมือถือด้วย (เลื่อนแนวนอนได้)
  const nav = document.querySelector("header nav");
  if (nav) nav.className = "flex items-center gap-4 ml-2 overflow-x-auto whitespace-nowrap";
  document.querySelectorAll("header nav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const v = NAV_VIEWS[a.textContent.trim()];
      if (v) setView(v);
    });
  });

  syncTypeLabel();
  setView("files");
  applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");
  refreshPermission();
  loadAll();
}

init();