/* ระบบธีม: ตั้งค่าตัวแปรสีก่อนแสดงหน้า เพื่อไม่ให้กะพริบ */
(function () {
  var DARK = {
    "tertiary-fixed-dim": "#ffb596", "surface-container-low": "#1c1b1d", "background": "#131315",
    "surface-container": "#201f22", "tertiary-fixed": "#ffdbcd", "primary-container": "#2563eb",
    "on-surface-variant": "#c3c6d7", "secondary-fixed-dim": "#bec6e0", "on-tertiary": "#581e00",
    "surface": "#131315", "on-secondary": "#283044", "outline": "#8d90a0", "primary": "#b4c5ff",
    "tertiary": "#ffb596", "surface-container-high": "#2a2a2c", "tertiary-container": "#bc4800",
    "on-primary-fixed": "#00174b", "surface-bright": "#39393b", "on-primary": "#002a78",
    "on-tertiary-container": "#ffede6", "on-background": "#e5e1e4", "inverse-primary": "#0053db",
    "on-tertiary-fixed-variant": "#7d2d00", "secondary-container": "#3f465c", "on-secondary-container": "#adb4ce",
    "inverse-on-surface": "#313032", "error-container": "#93000a", "on-surface": "#e5e1e4",
    "surface-dim": "#131315", "surface-variant": "#353437", "on-primary-container": "#eeefff",
    "on-error": "#690005", "on-tertiary-fixed": "#360f00", "outline-variant": "#434655",
    "secondary": "#bec6e0", "on-secondary-fixed": "#131b2e", "on-secondary-fixed-variant": "#3f465c",
    "on-error-container": "#ffdad6", "error": "#ffb4ab", "surface-container-highest": "#353437",
    "primary-fixed-dim": "#b4c5ff", "surface-container-lowest": "#0e0e10", "secondary-fixed": "#dae2fd",
    "on-primary-fixed-variant": "#003ea8", "inverse-surface": "#e5e1e4", "primary-fixed": "#dbe1ff",
    "surface-tint": "#b4c5ff"
  };
  var LIGHT = {
    "tertiary-fixed-dim": "#9a3d00", "surface-container-low": "#f2f4f6", "background": "#f7f9fb",
    "surface-container": "#eceef0", "tertiary-fixed": "#ffdbcd", "primary-container": "#2563eb",
    "on-surface-variant": "#45464d", "secondary-fixed-dim": "#bec6e0", "on-tertiary": "#ffffff",
    "surface": "#f7f9fb", "on-secondary": "#ffffff", "outline": "#76777d", "primary": "#1d4ed8",
    "tertiary": "#9a3d00", "surface-container-high": "#e6e8ea", "tertiary-container": "#ffdbcd",
    "on-primary-fixed": "#131b2e", "surface-bright": "#ffffff", "on-primary": "#ffffff",
    "on-tertiary-container": "#7d2d00", "on-background": "#191c1e", "inverse-primary": "#bec6e0",
    "on-tertiary-fixed-variant": "#7d2d00", "secondary-container": "#d0e1fb", "on-secondary-container": "#54647a",
    "inverse-on-surface": "#eff1f3", "error-container": "#ffdad6", "on-surface": "#191c1e",
    "surface-dim": "#d8dadc", "surface-variant": "#e0e3e5", "on-primary-container": "#ffffff",
    "on-error": "#ffffff", "on-tertiary-fixed": "#360f00", "outline-variant": "#c6c6cd",
    "secondary": "#505f76", "on-secondary-fixed": "#0b1c30", "on-secondary-fixed-variant": "#38485d",
    "on-error-container": "#93000a", "error": "#ba1a1a", "surface-container-highest": "#e0e3e5",
    "primary-fixed-dim": "#b4c5ff", "surface-container-lowest": "#ffffff", "secondary-fixed": "#d3e4fe",
    "on-primary-fixed-variant": "#003ea8", "inverse-surface": "#2d3133", "primary-fixed": "#1e40af",
    "surface-tint": "#1d4ed8"
  };
  window.__palettes = { dark: DARK, light: LIGHT };

  function toRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + " " + ((n >> 8) & 255) + " " + (n & 255);
  }
  function cssVars(pal) {
    return ":root{" + Object.keys(pal).map(function (k) {
      return "--c-" + k + ": " + toRgb(pal[k]) + ";";
    }).join("") + "}";
  }

  var name = localStorage.getItem("theme") === "light" ? "light" : "dark";
  var st = document.createElement("style");
  st.id = "theme-vars";
  st.textContent = cssVars(name === "light" ? LIGHT : DARK);
  document.head.appendChild(st);
  document.documentElement.classList.toggle("dark", name !== "light");
  document.documentElement.style.colorScheme = name;

  window.__setTheme = function (n) {
    var pal = n === "light" ? LIGHT : DARK;
    document.getElementById("theme-vars").textContent = cssVars(pal);
    document.documentElement.classList.toggle("dark", n !== "light");
    document.documentElement.style.colorScheme = n;
    localStorage.setItem("theme", n);
  };
})();
