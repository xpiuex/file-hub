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

const TYPE_KEYS = ["PDF", "IMAGE", "DOCUMENT", "ARCHIVE", "DESIGN", "VIDEO", "OTHER"];
const NAV_VIEWS = ["files", "shared", "recent", "trash"];
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
let groupFilter = "all";
const GROUPS = { docs: ["DOCUMENT", "PDF"], images: ["IMAGE"], archives: ["ARCHIVE"] };
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
const fmtDate = (d) => new Date(d).toLocaleDateString(window.getLang() === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric", year: "numeric" });

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
  if (ext === "pdf") return { label: t("info_pdf"), icon: "picture_as_pdf", cls: "bg-error-container/20 border-error-container/40 text-error" };
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return { label: t("info_image"), icon: "image", cls: "bg-primary-container/20 border-primary-container/30 text-primary" };
  if (ext === "svg") return { label: t("info_svg"), icon: "brush", cls: "bg-secondary-container/30 border-secondary-container/50 text-secondary" };
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { label: t("info_archive"), icon: "folder_zip", cls: "bg-tertiary-container/30 border-tertiary-container/40 text-tertiary" };
  if (["doc", "docx", "txt", "md"].includes(ext)) return { label: t("info_doc"), icon: "description", cls: "bg-surface-container-high border-outline-variant text-outline" };
  if (["fig", "sketch", "xd"].includes(ext)) return { label: t("info_design"), icon: "dashboard_customize", cls: "bg-primary-container/20 border-primary-container/30 text-primary" };
  if (["mp4", "mov", "webm"].includes(ext)) return { label: t("info_video"), icon: "movie", cls: "bg-primary-container/15 border-primary-container/25 text-primary-fixed" };
  return { label: ext ? t("info_ext", { ext: ext.toUpperCase() }) : t("info_file"), icon: "description", cls: "bg-surface-container-high border-outline-variant text-outline" };
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
    return item("restore", "restore_from_trash", t("menu_restore"), f.id) +
           item("purge", "delete_forever", t("menu_purge"), f.id, "text-error");
  }
  return item("download", "download", t("menu_download"), f.id) +
         item("share", "link", t("menu_share"), f.id) +
         item("rename", "edit", t("menu_rename"), f.id) +
         divider +
         item("delete", "delete", t("menu_trash"), f.id, "text-error");
}

function typeMenuHtml() {
  const opts = [["all", t("type_all")], ...TYPE_KEYS.map((v) => [v, t("type_" + v)])];
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
  return `<div class="px-2.5 py-1 text-[11px] text-outline">${t("cols_show")}</div>` +
    row("category", t("col_category")) + row("size", t("col_size")) + row("date", t("col_date"));
}

function notifyHtml() {
  const list = activity.slice(0, 15).map((a) => `
    <div class="px-2.5 py-2 border-b border-outline-variant last:border-0">
      <div class="text-body-sm text-on-surface">${esc(a.msg)}</div>
      <div class="text-[11px] text-outline">${a.time.toLocaleTimeString(window.getLang() === "th" ? "th-TH" : "en-US", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>`).join("");
  return list || `<div class="px-2.5 py-3 text-body-sm text-outline">${t("no_notify")}</div>`;
}

function syncGroupPills() {
  const base = "h-7 px-2.5 rounded-full text-label-sm font-label-sm transition-colors whitespace-nowrap border";
  document.querySelectorAll('#groupPills button[data-act="group"]').forEach((b) => {
    const on = b.dataset.val === groupFilter;
    b.className = base + (on
      ? " bg-primary-container/20 text-primary border-primary/30"
      : " border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface");
  });
}

function syncTypeLabel() {
  if (!typeBtn) return;
  typeBtn.querySelectorAll("span")[1].textContent = typeFilter === "all" ? t("type_all") : t("type_" + typeFilter);
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
  logoutBtn.textContent = session ? t("logout") : t("login");
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
  showLogin(t("login_need_perm"));
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return showLogin(t("login_failed") + ": " + error.message);

  await refreshPermission();
  if (!canDelete) {
    await sb.auth.signOut();
    pendingAction = null;
    return showLogin(t("login_not_allowed"));
  }

  hideLogin();
  document.getElementById("loginPassword").value = "";
  showToast(t("logged_in"));

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
    showToast(t("logged_out"));
  } else {
    showLogin("");
  }
});

/* ---------- ขนาดพื้นที่ ---------- */
async function loadUsage() {
  const { data, error } = await sb.rpc("get_storage_usage");
  if (error) {
    document.getElementById("dbText").textContent = t("read_failed");
    document.getElementById("stText").textContent = t("read_failed");
    return;
  }
  const pct = (v, l) => Math.min(100, (v / l) * 100);
  const db = Number(data.db_bytes || 0);
  const st = Number(data.storage_bytes || 0);

  document.getElementById("dbText").textContent = `${fmtSize(db)} / ${fmtSize(DB_LIMIT)}`;
  document.getElementById("dbBar").style.width = pct(db, DB_LIMIT) + "%";
  document.getElementById("dbPct").textContent = t("used_pct", { v: pct(db, DB_LIMIT).toFixed(1) });

  document.getElementById("stText").textContent = `${fmtSize(st)} / ${fmtSize(STORAGE_LIMIT)}`;
  document.getElementById("stBar").style.width = pct(st, STORAGE_LIMIT) + "%";
  document.getElementById("stPct").textContent = t("used_pct", { v: pct(st, STORAGE_LIMIT).toFixed(1) });
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
  if (s.error) console.warn("Share list failed (SQL not run?):", s.error.message);

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
  if (groupFilter !== "all") list = list.filter((f) => GROUPS[groupFilter].includes(fileType(f.file_name)));
  if (q) list = list.filter((f) =>
    f.file_name.toLowerCase().includes(q) || projectName(f.project_id).toLowerCase().includes(q));
  return list;
}

function emptyMessage() {
  return {
    files: t("empty_search"),
    shared: t("empty_shared"),
    recent: t("empty_recent", { n: RECENT_DAYS }),
    trash: t("empty_trash"),
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
      <button type="button" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-act="menu" data-id="${id}" title="${t('more_options')}">
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

  document.getElementById("pageInfo").textContent = t("page_of", { p: page, n: pages });
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
    a.className = a.dataset.view === v ? NAV_ACTIVE : NAV_INACTIVE;
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
      groupFilter = "all";
      closePop();
      syncTypeLabel();
      syncGroupPills();
      page = 1;
      render();
      return;
    case "group":
      groupFilter = el.dataset.val;
      typeFilter = "all";
      syncTypeLabel();
      syncGroupPills();
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
      <span data-size>${t("start_dl")}</span>
      <span data-status>${t("in_progress")}</span>
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
    t.el.querySelector("[data-status]").textContent = t("done");
    setTimeout(() => t.el.remove(), 4000);
  } else {
    bar.classList.replace("bg-primary-container", "bg-error");
    const st = t.el.querySelector("[data-status]");
    st.textContent = t("failed") + (msg ? ": " + msg : "");
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
    logActivity(t("act_download", { name: f.file_name }));
  } catch (err) {
    // ถ้าอ่านแบบมีความคืบหน้าไม่ได้ (เช่น CORS) ให้เปิดลิงก์ตรงแทน
    finishTransfer(t, false, err.message);
    window.open(data.signedUrl, "_blank");
  }
}

/* ---------- นำเข้าจาก URL ---------- */
async function importFromUrl() {
  const input = prompt(t("url_prompt"));
  if (!input) return;

  let u;
  try { u = new URL(input.trim()); } catch { return showToast(t("url_invalid"), "error"); }
  if (u.protocol !== "https:") return showToast(t("https_only"), "error");

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
  if (shErr) console.warn("Saving share record failed:", shErr.message);

  try {
    await navigator.clipboard.writeText(data.signedUrl);
    showToast(t("link_copied"), "link");
  } catch {
    prompt(t("copy_link_prompt"), data.signedUrl);
  }
  logActivity(t("act_share", { name: f.file_name }));
  loadAll();
}

/* ---------- เปลี่ยนชื่อ (ต้องมีสิทธิ์) ---------- */
async function renameFile(f) {
  const newName = prompt(t("new_name_prompt"), f.file_name);
  if (!newName || !newName.trim() || newName.trim() === f.file_name) return;

  const { data, error } = await sb.from("files")
    .update({ file_name: newName.trim() })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.code === "23505" ? t("name_taken") : error.message, "error");
  if (!data || data.length === 0) return showToast(t("no_perm_rename"), "error");

  logActivity(t("act_rename", { name: newName.trim() }));
  showToast(t("renamed"));
  loadAll();
}

/* ---------- ย้ายไปถังขยะ / กู้คืน / ลบถาวร (ต้องมีสิทธิ์) ---------- */
async function trashFile(f) {
  if (!confirm(t("confirm_trash"))) return;
  const { data, error } = await sb.from("files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast(t("no_perm_trash"), "error");

  logActivity(t("act_trash", { name: f.file_name }));
  showToast(t("moved_trash"));
  loadAll();
}

async function restoreFile(f) {
  const { data, error } = await sb.from("files")
    .update({ deleted_at: null })
    .eq("id", f.id)
    .select("id");
  if (error) return showToast(error.code === "23505" ? t("name_taken") : error.message, "error");
  if (!data || data.length === 0) return showToast(t("no_perm_restore"), "error");

  logActivity(t("act_restore", { name: f.file_name }));
  showToast(t("restored"));
  loadAll();
}

async function purgeFile(f) {
  if (!confirm(t("confirm_purge"))) return;
  const { data, error } = await sb.from("files").delete().eq("id", f.id).select("id");
  if (error) return showToast(error.message, "error");
  if (!data || data.length === 0) return showToast(t("no_perm_delete"), "error");

  await sb.storage.from(BUCKET).remove([f.storage_path]);
  logActivity(t("act_purge", { name: f.file_name }));
  showToast(t("purged"));
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

/* ---------- ป้องกันไฟล์ซ้ำ ---------- */
// คำนวณ SHA-256 ของเนื้อหาไฟล์ (ต้องเปิดผ่าน https หรือ localhost)
async function sha256Hex(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ถ้าชื่อซ้ำในโปรเจกต์ (ไม่สนตัวพิมพ์เล็ก-ใหญ่) เติม (2), (3) ต่อท้ายชื่อ
function uniqueName(name, projectId) {
  const taken = new Set(
    files.filter((f) => !f.deleted_at && f.project_id === projectId).map((f) => f.file_name.toLowerCase())
  );
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 2; i < 10000; i++) {
    const candidate = `${base} (${i})${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return name;
}

async function uploadFileObject(file) {
  if (file.size > MAX_FILE_SIZE) return showToast(t("file_too_big"), "error");

  let projectId;
  try {
    projectId = await getDefaultProjectId();
  } catch (err) {
    return showToast(t("prep_failed", { msg: err.message }), "error");
  }

  showToast(t("uploading"), "cloud_upload");

  // 1) เนื้อหาซ้ำกับไฟล์ที่มีอยู่ (ที่ยังไม่อยู่ในถังขยะ) จะไม่อัปโหลด
  let hash = null;
  try {
    hash = await sha256Hex(file);
  } catch (err) {
    console.warn("คำนวณ hash ไม่สำเร็จ (ต้องเปิดผ่าน https):", err.message);
  }
  if (hash) {
    const { data: dup, error: dupErr } = await sb.from("files")
      .select("file_name").eq("content_hash", hash).is("deleted_at", null).limit(1);
    if (!dupErr && dup && dup.length) return showToast(t("dup_content", { name: dup[0].file_name }), "warning");
  }

  // 2) ชื่อซ้ำ -> บันทึกด้วยชื่อใหม่ที่ไม่ซ้ำ
  const finalName = uniqueName(file.name, projectId);

  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (upErr) return showToast(upErr.message, "error");

  const { error } = await sb.from("files").insert({
    project_id: projectId,
    file_name: finalName,
    file_type: file.type || null,
    file_size: file.size,
    storage_path: storagePath,
    content_hash: hash,
    url: "",
  });
  if (error) {
    await sb.storage.from(BUCKET).remove([storagePath]);
    // 23505 = ละเมิด unique index ที่ฐานข้อมูล (กันกรณีอัปโหลดพร้อมกัน)
    return showToast(error.code === "23505" ? t("dup_db") : error.message, "error");
  }
  logActivity(t("act_upload", { name: finalName }));
  showToast(finalName !== file.name ? t("renamed_auto", { name: finalName }) : t("upload_ok"));
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
  btn.title = name === "dark" ? t("theme_to_light") : t("theme_to_dark");
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
  const byKey = (key) => {
    const el = document.querySelector('[data-i18n="' + key + '"]');
    return el ? el.closest("button") : null;
  };
  const setAct = (el, act) => {
    if (!el) return;
    el.removeAttribute("onclick");
    el.dataset.act = act;
  };

  typeBtn = byKey("type_all");
  setAct(typeBtn, "open-type");
  setAct(byKey("columns"), "open-cols");
  setAct(document.querySelector('button[title="View columns"]'), "open-cols");
  setAct(document.querySelector('button[title="Notifications"]'), "open-notify");
  setAct(byKey("import_cloud"), "import-url");

  // ทำให้เมนูด้านบนแสดงบนมือถือด้วย (เลื่อนแนวนอนได้)
  const nav = document.querySelector("header nav");
  if (nav) nav.className = "flex items-center gap-4 ml-2 overflow-x-auto whitespace-nowrap";
  document.querySelectorAll("header nav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const v = a.dataset.view;
      if (v) setView(v);
    });
  });

  syncTypeLabel();
  syncGroupPills();
  updateLangLabel();
  setView("files");
  applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");
  refreshPermission();
  loadAll();
}

function updateLangLabel() {
  const el = document.getElementById("langLabel");
  if (el) el.textContent = window.getLang() === "th" ? "EN" : "ไทย";
}

window.addEventListener("langchange", () => {
  updateLangLabel();
  applyTheme(localStorage.getItem("theme") === "light" ? "light" : "dark");
  syncTypeLabel();
  syncGroupPills();
  refreshPermission();
  render();
  loadUsage();
});

document.getElementById("langToggleBtn").addEventListener("click", () => {
  window.setLang(window.getLang() === "th" ? "en" : "th");
});

init();
