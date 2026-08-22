import type { Config } from 'tailwindcss';
// @ts-expect-error - tw-animate-css doesn't have TypeScript types
import twAnimateCss from 'tw-animate-css';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-cairo)', 'sans-serif'],
      },
      textDirection: {
        rtl: 'rtl',
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'blockquote p:first-of-type::before': {
              content: '""',
            },
            'blockquote p:last-of-type::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    twAnimateCss,
    typography,
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: 'class',
};

export default config; 