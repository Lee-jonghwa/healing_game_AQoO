import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "#171717", // ✅ 항상 검은색 유지
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
        shrinkExpand: {
          "0%, 100%": { transform: "scale(1)", transformOrigin: "center" },
          "50%": { transform: "scale(0.95)", transformOrigin: "center" }, // 중앙을 기준으로 작아졌다 커지기
        },
        // ✅ 추가된 애니메이션 (캡슐 흔들리기 & 물고기 등장)
        shake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
          "75%": { transform: "rotate(-5deg)" },
        },
        fishGrow: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shrinkExpand: "shrinkExpand 0.3s ease-in-out", // 0.3초 동안 실행
        // ✅ 추가된 애니메이션 적용
        shake: "shake 0.3s ease-in-out infinite", // 캡슐 흔들림
        fishGrow: "fishGrow 0.5s ease-out forwards", // 물고기 등장
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwind-scrollbar-hide")],
};

export default config;
