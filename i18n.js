/* ระบบภาษา: ไทย (ค่าเริ่มต้น) / English */
(function () {
  var DICT = {
    th: {
      app_title: "AskFile - ไฟล์และทรัพยากร",
      menu_view: "ดู", preview_close: "ปิด", preview_download: "ดาวน์โหลด", preview_unsupported: "ไม่รองรับการแสดงตัวอย่างไฟล์ประเภทนี้",
      note_view_edit: "แก้ไข", note_view_close: "ปิด",
      nav_notes: "โน้ต", notes_title: "โน้ต", notes_desc: "จดบันทึก จัดหมวดด้วยหัวข้อและแท็ก และไฮไลท์สิ่งสำคัญ",
      notes_new: "+ โน้ตใหม่", notes_search_ph: "ค้นหาโน้ต...", notes_empty: "ยังไม่มีโน้ต กด + โน้ตใหม่ เพื่อเริ่มเขียน",
      notes_no_topic: "ไม่มีหัวข้อ", notes_add_here: "เพิ่มโน้ตในหัวข้อนี้", notes_untitled: "ไม่มีหัวข้อโน้ต",
      notes_edit: "แก้ไขโน้ต", notes_title_ph: "หัวข้อโน้ต", notes_topic: "หัวข้อ (Section)", notes_topic_ph: "เช่น งาน, ไอเดีย",
      notes_highlight: "ไฮไลท์", hl_none: "ไม่มี", hl_yellow: "เหลือง", hl_green: "เขียว", hl_pink: "ชมพู", hl_blue: "ฟ้า",
      notes_tags: "แท็ก (คั่นด้วยเครื่องหมายจุลภาค)", notes_tags_ph: "เช่น ด่วน, ประชุม", notes_body_ph: "เขียนบันทึกที่นี่...",
      notes_delete: "ลบโน้ต", notes_cancel: "ยกเลิก", notes_save: "บันทึก", notes_saved: "บันทึกโน้ตแล้ว", notes_deleted: "ลบโน้ตแล้ว",
      notes_no_perm: "ไม่มีสิทธิ์แก้ไขโน้ตนี้", notes_need_text: "กรุณาใส่หัวข้อหรือเนื้อหา", notes_confirm_delete: "ลบโน้ตนี้?",
      notes_title: "โน้ต", notes_desc: "เขียนบันทึก แท็ก ไฮไลท์ และจัดกลุ่มตามหัวข้อ", note_nav: "โน้ต", note_new: "+ โน้ตใหม่",
      note_search_ph: "ค้นหาโน้ต...", note_all_colors: "ทุกสี", note_all_tags: "ทั้งหมด", note_empty: "ยังไม่มีโน้ต",
      note_title_ph: "หัวข้อโน้ต", note_topic_ph: "หัวข้อหลัก (จัดกลุ่ม) เช่น โปรเจกต์ A", note_body_ph: "เขียนบันทึกที่นี่...",
      note_tags_ph: "แท็ก คั่นด้วยจุลภาค เช่น งาน, ไอเดีย", note_delete: "ลบ", note_save: "บันทึก", note_no_topic: "ไม่มีหัวข้อหลัก",
      note_updated: "แก้ไขล่าสุด", note_title_required: "กรุณาใส่หัวข้อโน้ต", note_saved: "บันทึกโน้ตแล้ว", note_deleted: "ลบโน้ตแล้ว",
      note_confirm_delete: "ลบโน้ตนี้?", note_c_none: "ไม่มีสี", note_c_yellow: "เหลือง", note_c_green: "เขียว", note_c_blue: "ฟ้า", note_c_pink: "ชมพู",
      note_color_label: "สีไฮไลท์",
      login_headline: "จัดเก็บและแชร์ไฟล์งานของทีมอย่างปลอดภัย", login_sub: "ใช้บัญชี Google ที่ได้รับอนุญาตเท่านั้น",
      login_feat1: "อัปโหลดและจัดระเบียบไฟล์โปรเจกต์", login_feat2: "แชร์ลิงก์ที่หมดอายุได้ตามเวลา",
      login_feat3: "เข้าใช้งานด้วยบัญชี Google ที่ได้รับอนุญาต", login_feat4: "ถังขยะและกู้คืนไฟล์ได้",
      login_footer: "ระบบนี้จำกัดการเข้าถึงเฉพาะอีเมลที่อนุญาต",
      purge_all: "ลบทั้งหมด", confirm_purge_all: "ลบ {n} ไฟล์ในถังขยะถาวร? กู้คืนไม่ได้",
      purged_all: "ลบทั้งหมดในถังขยะแล้ว", act_purge_all: "ลบถาวรทั้งหมด {n} ไฟล์",
      uploaded_by: "อัปโหลดโดย",
      profile_guest: "ยังไม่ได้เข้าสู่ระบบ", profile_signin: "เข้าสู่ระบบ", profile_signout: "ออกจากระบบ",
      profile_role_admin: "ผู้ดูแล", profile_role_uploader: "ผู้อัปโหลด", profile_role_none: "ไม่มีสิทธิ์",
      firebase_not_set: "ยังไม่ได้ตั้งค่า Firebase ใน app.js",
      home_title: "ยินดีต้อนรับสู่ AskFile", home_desc: "พื้นที่จัดเก็บและแชร์ไฟล์งานของทีม เลือก room-work จากเมนูเพื่อเริ่มใช้งาน",
      sidebar_home: "หน้าแรก", google_login: "เข้าสู่ระบบด้วย Google", or_divider: "หรือ", menu_open: "เปิดเมนู",
      no_access: "บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน (ต้องอยู่ในรายการที่อนุญาต)", need_login_enter: "เข้าสู่ระบบด้วย Google เพื่อเปิด room-work",
      dup_content: "ไฟล์เนื้อหาเดียวกันนี้มีอยู่แล้ว: {name}", dup_db: "ไฟล์นี้ซ้ำกับที่มีอยู่แล้ว",
      renamed_auto: "ชื่อซ้ำ บันทึกเป็น \"{name}\"", name_taken: "ชื่อนี้มีอยู่แล้วในโปรเจกต์",
      login: "เข้าสู่ระบบ", logout: "ออกจากระบบ", login_email: "อีเมล", login_password: "รหัสผ่าน",
      login_cancel: "ยกเลิก", login_failed: "เข้าสู่ระบบไม่สำเร็จ", login_need_perm: "เข้าสู่ระบบด้วยอีเมลที่ได้รับสิทธิ์เพื่อดำเนินการนี้",
      login_not_allowed: "อีเมลนี้ไม่มีสิทธิ์ดำเนินการนี้", logged_in: "เข้าสู่ระบบแล้ว", logged_out: "ออกจากระบบแล้ว",
      nav_files: "ไฟล์", nav_shared: "ที่แชร์", nav_recent: "ล่าสุด", nav_trash: "ถังขยะ",
      upload_file: "อัปโหลดไฟล์", upload_plus: "+ อัปโหลดไฟล์",
      theme_to_light: "สลับเป็นธีมสว่าง", theme_to_dark: "สลับเป็นธีมมืด", lang_btn_title: "เปลี่ยนภาษา",
      crumb_all: "ไฟล์ทั้งหมด", page_title: "ไฟล์และทรัพยากร",
      page_desc: "จัดการและจัดระเบียบไฟล์โปรเจกต์ สื่อ และทรัพยากรที่อัปโหลด",
      usage_db: "ฐานข้อมูล (Database)", usage_db_desc: "ทั้งฐานข้อมูลรวมทุกตาราง",
      usage_st: "ไฟล์ที่อัปโหลด (Storage)", usage_st_desc: "ไฟล์ทั้งหมดใน bucket project-files",
      usage_quota: "Supabase (ฐานข้อมูล 500 MB, Storage 1 GB)",
      refresh_usage: "รีเฟรชขนาด", read_failed: "อ่านไม่สำเร็จ", used_pct: "ใช้แล้ว {v}% ของโควต้า",
      type_all: "ทุกประเภท", filter_ph: "ค้นหาไฟล์ตามชื่อหรือแท็ก...", refresh_list: "รีเฟรชรายการ",
      grp_all: "ทั้งหมด", grp_docs: "เอกสาร", grp_images: "รูปภาพ", grp_archives: "ไฟล์บีบอัด",
      columns: "คอลัมน์", empty_title: "ยังไม่มีไฟล์ที่อัปโหลด",
      empty_desc: "ลากและวางไฟล์ที่นี่ หรือกดปุ่มด้านล่างเพื่ออัปโหลดไฟล์แรกของคุณ",
      import_cloud: "นำเข้าจากคลาวด์", formats: "รองรับไฟล์: PDF, PNG, JPG, SVG, MP4, ZIP (สูงสุด 50 MB)",
      storage_secure: "พื้นที่จัดเก็บที่เข้ารหัส",
      col_name: "ชื่อไฟล์", col_category: "หมวดหมู่", col_size: "ขนาด", col_date: "วันที่อัปโหลด", col_actions: "การจัดการ",
      sel_of: "จาก", sel_suffix: "รายการที่เลือก", rows_per_page: "แถวต่อหน้า", page_of: "หน้า {p} จาก {n}",
      more_options: "เพิ่มเติม", cols_show: "คอลัมน์ที่แสดง", no_notify: "ยังไม่มีการแจ้งเตือนในเซสชันนี้",
      file_too_big: "ไฟล์ใหญ่เกิน 50 MB", prep_failed: "เตรียมโปรเจกต์ไม่สำเร็จ: {msg}",
      uploading: "กำลังอัปโหลด...", upload_ok: "อัปโหลดสำเร็จ", act_upload: "อัปโหลด \"{name}\"",
      empty_search: "ไม่พบไฟล์ที่ตรงกับตัวกรอง", empty_shared: "ยังไม่มีไฟล์ที่แชร์ (ลิงก์ที่ยังไม่หมดอายุ)",
      empty_recent: "ไม่มีไฟล์ที่อัปโหลดใน {n} วันที่ผ่านมา", empty_trash: "ถังขยะว่างเปล่า",
      start_dl: "เริ่มดาวน์โหลด...", in_progress: "กำลังดำเนินการ", done: "เสร็จแล้ว", failed: "ไม่สำเร็จ",
      act_download: "ดาวน์โหลด \"{name}\"", url_prompt: "วาง URL ของไฟล์ (ต้องเป็น https:// และเข้าถึงจากเบราว์เซอร์ได้)",
      url_invalid: "URL ไม่ถูกต้อง", https_only: "รองรับเฉพาะ https://", link_copied: "คัดลอกลิงก์แล้ว (ใช้ได้ 1 ชั่วโมง)",
      copy_link_prompt: "คัดลอกลิงก์นี้ (ใช้ได้ 1 ชั่วโมง)", act_share: "แชร์ \"{name}\"",
      new_name_prompt: "ชื่อไฟล์ใหม่", no_perm_rename: "ไม่มีสิทธิ์เปลี่ยนชื่อไฟล์นี้", act_rename: "เปลี่ยนชื่อเป็น \"{name}\"",
      renamed: "เปลี่ยนชื่อแล้ว", confirm_trash: "ย้ายไฟล์นี้ไปถังขยะ?", no_perm_trash: "ไม่มีสิทธิ์ย้ายไฟล์นี้",
      act_trash: "ย้าย \"{name}\" ไปถังขยะ", moved_trash: "ย้ายไปถังขยะแล้ว", no_perm_restore: "ไม่มีสิทธิ์กู้คืนไฟล์นี้",
      act_restore: "กู้คืน \"{name}\"", restored: "กู้คืนแล้ว", confirm_purge: "ลบถาวร? กู้คืนไม่ได้",
      no_perm_delete: "ไม่มีสิทธิ์ลบไฟล์นี้", act_purge: "ลบถาวร \"{name}\"", purged: "ลบถาวรแล้ว",
      menu_download: "ดาวน์โหลด", menu_share: "แชร์ลิงก์", menu_rename: "เปลี่ยนชื่อ", menu_trash: "ย้ายไปถังขยะ",
      menu_restore: "กู้คืน", menu_purge: "ลบถาวร",
      type_PDF: "PDF", type_IMAGE: "รูปภาพ", type_DOCUMENT: "เอกสาร", type_ARCHIVE: "ไฟล์บีบอัด",
      type_DESIGN: "ดีไซน์", type_VIDEO: "วิดีโอ", type_OTHER: "อื่น ๆ",
      info_pdf: "เอกสาร PDF", info_image: "รูปภาพ", info_svg: "ไฟล์ SVG", info_archive: "ไฟล์บีบอัด",
      info_doc: "เอกสาร", info_design: "ไฟล์ดีไซน์", info_video: "วิดีโอ", info_file: "ไฟล์", info_ext: "ไฟล์ {ext}",
      col_visible: "คอลัมน์ที่แสดง"
    },
    en: {
      app_title: "AskFile - Files & Assets",
      menu_view: "View", preview_close: "Close", preview_download: "Download", preview_unsupported: "Preview is not supported for this file type",
      note_view_edit: "Edit", note_view_close: "Close",
      nav_notes: "Notes", notes_title: "Notes", notes_desc: "Write notes, group them by topic and tags, and highlight what matters",
      notes_new: "+ New note", notes_search_ph: "Search notes...", notes_empty: "No notes yet. Click + New note to start writing.",
      notes_no_topic: "No topic", notes_add_here: "Add note here", notes_untitled: "Untitled",
      notes_edit: "Edit note", notes_title_ph: "Note title", notes_topic: "Topic (Section)", notes_topic_ph: "e.g. Work, Ideas",
      notes_highlight: "Highlight", hl_none: "None", hl_yellow: "Yellow", hl_green: "Green", hl_pink: "Pink", hl_blue: "Blue",
      notes_tags: "Tags (comma separated)", notes_tags_ph: "e.g. urgent, meeting", notes_body_ph: "Write your note here...",
      notes_delete: "Delete note", notes_cancel: "Cancel", notes_save: "Save", notes_saved: "Note saved", notes_deleted: "Note deleted",
      notes_no_perm: "No permission to change this note", notes_need_text: "Please enter a title or some text", notes_confirm_delete: "Delete this note?",
      notes_title: "Notes", notes_desc: "Write notes, tag and highlight them, and group by topic", note_nav: "Notes", note_new: "+ New note",
      note_search_ph: "Search notes...", note_all_colors: "All colours", note_all_tags: "All", note_empty: "No notes yet",
      note_title_ph: "Note title", note_topic_ph: "Topic group, e.g. Project A", note_body_ph: "Write your note here...",
      note_tags_ph: "Tags separated by commas, e.g. work, ideas", note_delete: "Delete", note_save: "Save", note_no_topic: "No topic",
      note_updated: "Updated", note_title_required: "Please enter a title", note_saved: "Note saved", note_deleted: "Note deleted",
      note_confirm_delete: "Delete this note?", note_c_none: "No colour", note_c_yellow: "Yellow", note_c_green: "Green", note_c_blue: "Blue", note_c_pink: "Pink",
      note_color_label: "Highlight",
      login_headline: "Store and share your team's files securely", login_sub: "Use an approved Google account only",
      login_feat1: "Upload and organize project files", login_feat2: "Share links that expire on schedule",
      login_feat3: "Sign in with an approved Google account", login_feat4: "Trash and restore files",
      login_footer: "Access is limited to approved emails",
      purge_all: "Delete all", confirm_purge_all: "Permanently delete {n} files in trash? This cannot be undone.",
      purged_all: "Trash emptied", act_purge_all: "Permanently deleted {n} files",
      uploaded_by: "by",
      profile_guest: "Not signed in", profile_signin: "Sign in", profile_signout: "Sign out",
      profile_role_admin: "Admin", profile_role_uploader: "Uploader", profile_role_none: "No access",
      firebase_not_set: "Firebase is not configured in app.js",
      home_title: "Welcome to AskFile", home_desc: "Store and share your team's files. Choose room-work from the menu to get started.",
      sidebar_home: "Home", google_login: "Sign in with Google", or_divider: "or", menu_open: "Open menu",
      no_access: "This account is not authorized to use the workspace", need_login_enter: "Sign in with Google to open room-work",
      dup_content: "An identical file already exists: {name}", dup_db: "This file duplicates an existing one",
      renamed_auto: "Name taken, saved as \"{name}\"", name_taken: "This name already exists in the project",
      login: "Sign in", logout: "Sign out", login_email: "Email", login_password: "Password",
      login_cancel: "Cancel", login_failed: "Sign-in failed", login_need_perm: "Sign in with an authorized email to continue",
      login_not_allowed: "This email is not authorized for this action", logged_in: "Signed in", logged_out: "Signed out",
      nav_files: "Files", nav_shared: "Shared", nav_recent: "Recent", nav_trash: "Trash",
      upload_file: "Upload File", upload_plus: "+ Upload File",
      theme_to_light: "Switch to light theme", theme_to_dark: "Switch to dark theme", lang_btn_title: "Change language",
      crumb_all: "All Documents", page_title: "Files & Assets",
      page_desc: "Manage and organize your project files, media, and uploaded assets.",
      usage_db: "Database", usage_db_desc: "Whole database across all tables",
      usage_st: "Uploaded files (Storage)", usage_st_desc: "All files in the project-files bucket",
      usage_quota: "Supabase (Database 500 MB, Storage 1 GB)",
      refresh_usage: "Refresh usage", read_failed: "Failed to load", used_pct: "{v}% of quota used",
      type_all: "All Types", filter_ph: "Filter files by name or tag...", refresh_list: "Refresh list",
      grp_all: "All", grp_docs: "Documents", grp_images: "Images", grp_archives: "Archives",
      columns: "Columns", empty_title: "No files uploaded yet",
      empty_desc: "Drag and drop files here, or click the button below to upload your first file.",
      import_cloud: "Import from Cloud", formats: "Supported formats: PDF, PNG, JPG, SVG, MP4, ZIP (up to 50 MB)",
      storage_secure: "Encrypted storage",
      col_name: "File Name", col_category: "Category", col_size: "Size", col_date: "Uploaded Date", col_actions: "Actions",
      sel_of: "of", sel_suffix: "row(s) selected", rows_per_page: "Rows per page", page_of: "Page {p} of {n}",
      more_options: "More options", cols_show: "Visible columns", no_notify: "No notifications in this session",
      file_too_big: "File is larger than 50 MB", prep_failed: "Failed to prepare project: {msg}",
      uploading: "Uploading...", upload_ok: "Uploaded", act_upload: "Uploaded \"{name}\"",
      empty_search: "No files match the filter", empty_shared: "No shared files (links not expired)",
      empty_recent: "No files uploaded in the last {n} days", empty_trash: "Trash is empty",
      start_dl: "Starting download...", in_progress: "In progress", done: "Done", failed: "Failed",
      act_download: "Downloaded \"{name}\"", url_prompt: "Paste the file URL (must be https:// and reachable from the browser)",
      url_invalid: "Invalid URL", https_only: "Only https:// is supported", link_copied: "Link copied (valid for 1 hour)",
      copy_link_prompt: "Copy this link (valid for 1 hour)", act_share: "Shared \"{name}\"",
      new_name_prompt: "New file name", no_perm_rename: "No permission to rename this file", act_rename: "Renamed to \"{name}\"",
      renamed: "Renamed", confirm_trash: "Move this file to trash?", no_perm_trash: "No permission to move this file",
      act_trash: "Moved \"{name}\" to trash", moved_trash: "Moved to trash", no_perm_restore: "No permission to restore this file",
      act_restore: "Restored \"{name}\"", restored: "Restored", confirm_purge: "Delete permanently? This cannot be undone.",
      no_perm_delete: "No permission to delete this file", act_purge: "Permanently deleted \"{name}\"", purged: "Permanently deleted",
      menu_download: "Download", menu_share: "Share link", menu_rename: "Rename", menu_trash: "Move to trash",
      menu_restore: "Restore", menu_purge: "Delete permanently",
      type_PDF: "PDF", type_IMAGE: "Image", type_DOCUMENT: "Document", type_ARCHIVE: "Archive",
      type_DESIGN: "Design", type_VIDEO: "Video", type_OTHER: "Other",
      info_pdf: "PDF Document", info_image: "Raster Image", info_svg: "SVG Vector Graphic", info_archive: "Compressed Archive",
      info_doc: "Document", info_design: "Design File", info_video: "Video", info_file: "File", info_ext: "{ext} File",
      col_visible: "Visible columns"
    }
  };

  var lang = localStorage.getItem("lang") === "en" ? "en" : "th";

  window.t = function (key, vars) {
    var s = (DICT[lang] && DICT[lang][key]) || DICT.th[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(vars[k]));
      });
    }
    return s;
  };
  window.getLang = function () { return lang; };

  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = window.t("app_title");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = window.t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.placeholder = window.t(el.dataset.i18nPh);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.title = window.t(el.dataset.i18nTitle);
    });
  }

  window.setLang = function (l) {
    lang = l === "en" ? "en" : "th";
    localStorage.setItem("lang", lang);
    applyStatic();
    window.dispatchEvent(new Event("langchange"));
  };

  window.applyI18n = applyStatic;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyStatic);
  } else {
    applyStatic();
  }
})();
