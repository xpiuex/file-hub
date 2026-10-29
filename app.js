import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://qxatfxjaemqumxhgqlgu.supabase.co";   // ใส่ Project URL ของคุณ
const SUPABASE_KEY = "sb_publishable_kFK1TySyqbOldG1X2FcijA_aFi9Udpk";        // ใส่ publishable key ของคุณ
const BUCKET = "project-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_PROJECT_NAME = "ไฟล์ทั่วไป";
const DB_LIMIT = 500 * 1024 * 1024;        // โควต้าฐานข้อมูลแผนฟรี
const STORAGE_LIMIT = 1024 * 1024 * 1024;  // โควต้า Storage แผนฟรี

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
let projects = [];
let files = [];
let shown = [];
let selected = new Set();
let page = 1;
let perPage = 10;
let searchQ = "";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtSize = (b) => {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 4);
  return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + u[i];
};
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

function closeMenus() {
  document.querySelectorAll(".action-menu").forEach((m) => m.classList.add("hidden"));
}

/* ---------- ขนาดพื้นที่ ---------- */
async function loadUsage() {
  const { data, error } = await sb.rpc("get_storage_usage");
  if (error) {
    document.getElementById("dbText").textContent = "อ่านไม่สำเร็จ";
    document.getElementById("stText").textContent = "อ่านไม่สำเร็จ";
    return showToast("อ่านขนาดพื้นที่ไม่สำเร็จ: " + error.message, "error");
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

/* ---------- โหลดข้อมูล ---------- */
async function loadAll() {
  const [p, f] = await Promise.all([
    sb.from("projects").select("*").order("created_at", { ascending: false }),
    sb.from("files").select("*").order("uploaded_at", { ascending: false }),
  ]);
  const err = p.error || f.error;
  if (err) return showToast(err.message, "error");
  projects = p.data;
  files = f.data;
  const ids = new Set(files.map((x) => x.id));
  selected = new Set([...selected].filter((id) => ids.has(id)));
  render();
  loadUsage();
}

function render() {
  const q = searchQ.toLowerCase();
  shown = files.filter((f) =>
    f.file_name.toLowerCase().includes(q) || projectName(f.project_id).toLowerCase().includes(q)
  );

  const isEmpty = files.length === 0;
  document.getElementById("emptyState").classList.toggle("hidden", !isEmpty);
  document.getElementById("emptyState").classList.toggle("flex", isEmpty);
  document.getElementById("tableCard").classList.toggle("hidden", isEmpty);

  const pages = Math.max(1, Math.ceil(shown.length / perPage));
  page = Math.min(page, pages);
  const slice = shown.slice((page - 1) * perPage, page * perPage);

  document.getElementById("tableBody").innerHTML = slice.map((f) => {
    const info = fileInfo(f.file_name);
    const id = esc(f.id);
    const name = esc(f.file_name);
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
            <span class="font-medium text-on-surface truncate group-hover:text-primary transition-colors cursor-pointer">${name}</span>
            <span class="font-body-sm text-body-sm text-outline truncate">${esc(info.label)}</span>
          </div>
        </div>
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-label-md font-medium bg-surface-container-high text-on-surface border border-outline-variant">${esc(projectName(f.project_id))}</span>
      </td>
      <td class="px-4 py-3 font-code-inline text-code-inline text-on-surface-variant tabular-nums">${fmtSize(f.file_size)}</td>
      <td class="px-4 py-3 text-on-surface-variant font-body-sm text-body-sm">${fmtDate(f.uploaded_at)}</td>
      <td class="px-4 py-3 text-right relative">
        <button class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-act="menu" data-id="${id}" title="More options">
          <span class="material-symbols-outlined !text-[18px] pointer-events-none">more_horiz</span>
        </button>
        <div class="hidden action-menu absolute right-4 top-10 w-44 rounded-lg bg-surface-container-highest border border-outline-variant shadow-xl z-50 p-1 text-left text-on-surface" id="menu-${id}">
          <button class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container text-on-surface transition-colors" data-act="download" data-id="${id}">
            <span class="material-symbols-outlined !text-[15px] text-outline">download</span><span>Download</span>
          </button>
          <button class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container text-on-surface transition-colors" data-act="share" data-name="${name}">
            <span class="material-symbols-outlined !text-[15px] text-outline">link</span><span>Share link</span>
          </button>
          <button class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-surface-container text-on-surface transition-colors" data-act="rename" data-name="${name}">
            <span class="material-symbols-outlined !text-[15px] text-outline">edit</span><span>Rename</span>
          </button>
          <div class="h-[1px] bg-outline-variant my-1"></div>
          <button class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-label-sm font-label-sm hover:bg-error-container/30 text-error transition-colors" data-act="delete" data-id="${id}" data-path="${esc(f.storage_path)}">
            <span class="material-symbols-outlined !text-[15px] text-error">delete</span><span>Delete file</span>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");

  document.getElementById("pageInfo").textContent = `Page ${page} of ${pages}`;
  document.getElementById("firstPage").disabled = page <= 1;
  document.getElementById("prevPage").disabled = page <= 1;
  document.getElementById("nextPage").disabled = page >= pages;
  document.getElementById("lastPage").disabled = page >= pages;
  document.getElementById("totalCount").textContent = files.length;
  document.getElementById("selCount").textContent = selected.size;
  updateSelectAll();
}

function updateSelectAll() {
  const boxes = [...document.querySelectorAll("#tableBody .row-checkbox")];
  const checked = boxes.filter((b) => b.checked).length;
  const master = document.getElementById("selectAll");
  master.checked = boxes.length > 0 && checked === boxes.length;
  master.indeterminate = checked > 0 && checked < boxes.length;
}

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

document.getElementById("tableBody").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "menu") {
    e.stopPropagation();
    const m = document.getElementById("menu-" + id);
    const wasHidden = m.classList.contains("hidden");
    closeMenus();
    if (wasHidden) m.classList.remove("hidden");
    return;
  }

  closeMenus();
  if (act === "download") return downloadFile(id);
  if (act === "delete") return deleteFile(id, btn.dataset.path);
  if (act === "share") {
    navigator.clipboard?.writeText(window.location.href);
    return showToast(`Link copied to clipboard: ${btn.dataset.name}`);
  }
  if (act === "rename") return showToast(`Rename requested: ${btn.dataset.name}`);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".action-menu") && !e.target.closest('[data-act="menu"]')) closeMenus();
});

function downloadFile(id) {
  const f = files.find((x) => x.id === id);
  if (!f) return;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(f.storage_path, { download: f.file_name });
  window.open(data.publicUrl, "_blank");
}

async function deleteFile(id, path) {
  if (!confirm("ลบไฟล์นี้?")) return;
  const { error } = await sb.from("files").delete().eq("id", id);
  if (error) return showToast(error.message, "error");
  await sb.storage.from(BUCKET).remove([path]);
  showToast("ลบไฟล์แล้ว");
  loadAll();
}

/* ---------- อัปโหลด ---------- */
document.querySelectorAll("[data-upload]").forEach((btn) => {
  btn.addEventListener("click", () => document.getElementById("fileInputHidden").click());
});

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

document.getElementById("fileInputHidden").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
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

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  const { error } = await sb.from("files").insert({
    project_id: projectId,
    file_name: file.name,
    file_type: file.type || null,
    file_size: file.size,
    storage_path: storagePath,
    url: pub.publicUrl,
  });
  if (error) {
    await sb.storage.from(BUCKET).remove([storagePath]);
    return showToast(error.message, "error");
  }
  showToast("อัปโหลดสำเร็จ");
  loadAll();
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

document.getElementById("themeToggleBtn").addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
});

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    const s = document.getElementById("fileSearch");
    if (s) s.focus();
  }
});

loadAll();
