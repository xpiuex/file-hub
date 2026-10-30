/* Tailwind config: สีดึงจาก theme.js เพื่อให้สลับธีมได้ */
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      "colors": Object.fromEntries(
        Object.keys(window.__palettes.dark).map(function (k) {
          return [k, "rgb(var(--c-" + k + ") / <alpha-value>)"];
        })
      ),
          "borderRadius": {
            "DEFAULT": "0.125rem",
            "lg": "0.25rem",
            "xl": "0.5rem",
            "full": "0.75rem"
          },
          "spacing": {
            "gutter-mobile": "1rem",
            "margin-mobile": "1rem",
            "space-2xs": "0.125rem",
            "space-md": "0.75rem",
            "space-3xl": "3rem",
            "space-sm": "0.5rem",
            "space-lg": "1rem",
            "margin": "2rem",
            "space-2xl": "2rem",
            "space-xs": "0.25rem",
            "gutter": "1.5rem",
            "space-xl": "1.5rem"
          },
          "fontFamily": {
            "label-md": ["Geist", "sans-serif"],
            "headline-lg-mobile": ["Geist", "sans-serif"],
            "headline-md": ["Geist", "sans-serif"],
            "headline-sm": ["Geist", "sans-serif"],
            "display": ["Geist", "sans-serif"],
            "code-inline": ["JetBrains Mono", "monospace"],
            "headline-lg": ["Geist", "sans-serif"],
            "body-sm": ["Geist", "sans-serif"],
            "label-sm": ["Geist", "sans-serif"],
            "body-lg": ["Geist", "sans-serif"],
            "body-md": ["Geist", "sans-serif"],
            "display-mobile": ["Geist", "sans-serif"]
          },
          "fontSize": {
            "label-md": ["0.875rem", { "lineHeight": "1rem", "letterSpacing": "-0.01em", "fontWeight": "500" }],
            "headline-lg-mobile": ["1.5rem", { "lineHeight": "1.75rem", "letterSpacing": "-0.02em", "fontWeight": "600" }],
            "headline-md": ["1.25rem", { "lineHeight": "1.5rem", "letterSpacing": "-0.02em", "fontWeight": "600" }],
            "headline-sm": ["1rem", { "lineHeight": "1.25rem", "letterSpacing": "-0.01em", "fontWeight": "600" }],
            "display": ["3.75rem", { "lineHeight": "4rem", "letterSpacing": "-0.04em", "fontWeight": "600" }],
            "code-inline": ["0.8125rem", { "lineHeight": "1rem", "letterSpacing": "-0.01em", "fontWeight": "400" }],
            "headline-lg": ["2rem", { "lineHeight": "2.25rem", "letterSpacing": "-0.03em", "fontWeight": "600" }],
            "body-sm": ["0.75rem", { "lineHeight": "1rem", "letterSpacing": "0em", "fontWeight": "400" }],
            "label-sm": ["0.75rem", { "lineHeight": "0.875rem", "letterSpacing": "0.01em", "fontWeight": "500" }],
            "body-lg": ["1rem", { "lineHeight": "1.5rem", "letterSpacing": "-0.01em", "fontWeight": "400" }],
            "body-md": ["0.875rem", { "lineHeight": "1.25rem", "letterSpacing": "-0.005em", "fontWeight": "400" }],
            "display-mobile": ["2.25rem", { "lineHeight": "2.5rem", "letterSpacing": "-0.03em", "fontWeight": "600" }]
          }
    }
  }
};
