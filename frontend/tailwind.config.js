// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // ✅ تفعيل استراتيجية الوضع المظلم المستندة إلى الكلاس
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // ✅ ==== التعديل هنا ====
  // يجب أن نُعلِم Tailwind بالألوان المخصصة التي عرفناها في index.css
  theme: {
    extend: {
      colors: {
        // نربط أسماء الكلاسات بمتغيرات CSS
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        tertiary: "var(--color-tertiary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border-color": "var(--color-border-color)",
        accent: "var(--color-accent)",
        "accent-light": "var(--color-accent-light)",
      },
    },
  },
  // =======================

  plugins: [],
};
