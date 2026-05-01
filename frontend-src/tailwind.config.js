import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        ttwlight: {
          primary:           '#1565C0',
          'primary-content': '#ffffff',
          secondary:         '#6200EA',
          'secondary-content': '#ffffff',
          accent:            '#00897B',
          'accent-content':  '#ffffff',
          neutral:           '#374151',
          'neutral-content': '#ffffff',
          'base-100':        '#ffffff',
          'base-200':        '#F3F4F6',
          'base-300':        '#E5E7EB',
          'base-content':    '#111827',
          info:              '#0284C7',
          success:           '#16A34A',
          warning:           '#D97706',
          error:             '#DC2626',
        },
        ttwdark: {
          primary:           '#e07b39',
          'primary-content': '#ffffff',
          secondary:         '#5b9cf6',
          'secondary-content': '#ffffff',
          accent:            '#e07b39',
          'accent-content':  '#ffffff',
          neutral:           '#1e2130',
          'neutral-content': '#e2e6f0',
          'base-100':        '#151720',
          'base-200':        '#1e2130',
          'base-300':        '#242938',
          'base-content':    '#e2e6f0',
          info:              '#5b9cf6',
          success:           '#4caf7d',
          warning:           '#f59e0b',
          error:             '#ef4444',
        },
      },
    ],
    darkTheme: 'ttwdark',
    base: true,
    styled: true,
    utils: true,
  },
}
