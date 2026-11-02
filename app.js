import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut as fbSignOut }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/* ===== ตั้งค่า ===== */
const SUPABASE_URL = "https://qxatfxjaemqumxhgqlgu.supabase.co";
const SUPABASE_KEY = "sb_publishable_kFK1TySyqbOldG1X2FcijA_aFi9Udpk";

// ตั้งค่า Firebase (คัดลอกจาก Firebase Console → Project settings → Your apps)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCLhvHij49dsfmmdKFOB4tYMxC1F4r7oxs",
  authDomain: "fen-board.firebaseapp.com",
  projectId: "fen-board",
  appId: "1:1002777913125:web:9e32ce19faa76e3bf21ccc",
};
// For Firebase JS SDK v7.20.0 and later, measurementId is optiofireba
/*================= */

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

// ถ้ายังไม่ได้ตั้งค่า Firebase ให้ข้ามไป เพื่อให้หน้าเว็บยังกดได้ตามปกติ
const FIREBASE_READY = !Object.values(FIREBASE_CONFIG).some((v) => String(v).startsWith("ใส่"));
let fbAuth = null;
try {
  if (FIREBASE_READY) fbAuth = getAuth(initializeApp(FIREBASE_CONFIG));
} catch (err) {
  console.error("Firebase init failed:", err);
}
let fbUser = null;

// ส่ง ID token ของ Firebase ให้ Supabase ทุกคำขอ เพื่อให้ RLS เห็นอีเมลที่ล็อกอิน
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  accessToken: async () => (fbUser ? fbUser.getIdToken() : null),
});

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

/* ---------- การล็อกอิน: Google ผ่าน Firebase Auth + สิทธิ์จาก allowed_emails ---------- */
const loginScreen = document.getElementById("loginScreen");
const logoutBtn = document.getElementById("logoutBtn");
const viewHome = document.getElementById("viewHome");
const viewWorkspace = document.getElementById("viewWorkspace");
const sidebarEl = document.getElementById("sidebar");
const headerNav = document.getElementById("headerNav");

let authReady = false;
let rejecting = false;

function showLogin(msg = "") {
  loginScreen.classList.remove("hidden");
  loginScreen.classList.add("flex");
  document.getElementById("loginMsg").textContent = msg;
}

function hideLogin() {
  loginScreen.classList.add("hidden");
  loginScreen.classList.remove("flex");
}

// กันการค้าง: ถ้าการตรวจสิทธิ์นานเกิน 5 วินาที ถือว่าไม่มีสิทธิ์ก่อน
const withTimeout = (p, ms = 5000) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

async function refreshPermission() {
  if (!fbUser) {
    canDelete = false;
  } else {
    try {
      const { data, error } = await withTimeout(sb.rpc("is_allowed"));
      canDelete = !error && data === true;
    } catch {
      canDelete = false;
    }
  }
  logoutBtn.textContent = fbUser ? t("logout") : t("login");
}

async function signInGoogle() {
  if (!fbAuth) return showLogin(t("firebase_not_set"));
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(fbAuth, provider);
  } catch (e) {
    // มือถือบางรุ่นบล็อก popup ให้เปลี่ยนไปใช้การเปลี่ยนหน้าแทน
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      return signInWithRedirect(fbAuth, provider);
    }
    if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      showLogin(e.message);
    }
  }
}

// ทำงานเฉพาะเมื่อมีสิทธิ์ ถ้าไม่มีจะแสดงหน้าล็อกอินแล้วทำงานต่อหลังล็อกอิน
async function requireAdmin(action) {
  await refreshPermission();
  if (canDelete) return action();
  pendingAction = action;
  showLogin(t("login_need_perm"));
}

const authListener = async (user) => {
  fbUser = user;
  authReady = true;
  if (!user && rejecting) {
    rejecting = false;
    authReady = true;
    await refreshPermission();
    return showLogin(t("no_access"));
  }
  await refreshPermission();
  authReady = true;

  if (user && !canDelete) {
    // ล็อกอินได้แต่อีเมลไม่อยู่ในรายการ: ออกจากระบบและแจ้งเตือน
    rejecting = true;
    pendingAction = null;
    await fbSignOut(fbAuth);
    return;
  }
  if (user && canDelete) {
    hideLogin();
    if (pendingAction) {
      const action = pendingAction;
      pendingAction = null;
      await action();
    }
  }
  routeFromHash();
};
setTimeout(() => {
  if (!authReady) {
    authReady = true;
    routeFromHash();
  }
}, 3000);

if (fbAuth) {
  onAuthStateChanged(fbAuth, authListener);
} else {
  authReady = true;
  routeFromHash();
}

document.getElementById("googleLoginBtn").addEventListener("click", signInGoogle);

document.getElementById("loginCancel")?.addEventListener("click", () => {
  pendingAction = null;
  hideLogin();
  // กลับหน้าแรกทันที เพื่อให้กด room-work อีกครั้งแล้วขึ้นหน้าล็อกอินได้
  location.hash = "";
  setPage("home");
});

logoutBtn.addEventListener("click", async () => {
  if (fbUser) {
    await fbSignOut(fbAuth);
    location.hash = "";
    location.reload();
  } else {
    showLogin("");
  }
});

/* ---------- เส้นทางหน้า: หน้าแรก (สาธารณะ) / room-work (Google + อยู่ในรายการอนุญาต) ---------- */
function setSidebarOpen(open) {
  sidebarEl.classList.toggle("open", open);
  document.getElementById("sidebarBackdrop").classList.toggle("hidden", !open);
}

function setPage(name) {
  const ws = name === "workspace";
  viewHome.classList.toggle("hidden", ws);
  document.body.classList.toggle("home-page", !ws);
  viewWorkspace.classList.toggle("hidden", !ws);
  headerNav.classList.toggle("hidden", !ws);
  document.getElementById("headerUpload").style.display = ws ? "" : "none";
  // เมนูข้างและปุ่มเมนูมือถือแสดงเฉพาะในหน้า room-work
  sidebarEl.classList.toggle("is-hidden", !ws);
  document.getElementById("menuBtn").classList.toggle("is-hidden", !ws);
  document.querySelectorAll(".sidebar-link").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.route === name);
  });
  setSidebarOpen(false);
  if (ws) loadAll();
}

function routeFromHash() {
  if (!authReady) return;
  if (location.hash !== "#room-work") return setPage("home");
  if (fbUser && canDelete) {
    hideLogin();
    return setPage("workspace");
  }
  setPage("home");
  if (!fbUser) showLogin(t("need_login_enter"));
}
window.addEventListener("hashchange", routeFromHash);

document.getElementById("menuBtn").addEventListener("click", () => {
  setSidebarOpen(!sidebarEl.classList.contains("open"));
});
document.getElementById("sidebarBackdrop").addEventListener("click", () => setSidebarOpen(false));

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
      
