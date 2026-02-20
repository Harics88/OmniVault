/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0C0E14',
                    card: '#12151C',
                    hover: '#1A1E28',
                    elevated: '#181C26',
                },
                text: {
                    primary: '#F0F2F5',
                    secondary: '#8B93A5',
                    muted: '#5C6478',
                },
                accent: {
                    blue: '#3B82F6',
                    'blue-hover': '#2563EB',
                    amber: '#F59E0B',
                    green: '#22C55E',
                    red: '#EF4444',
                    indigo: '#6366F1',
                    'indigo-hover': '#4F46E5',
                    violet: '#8B5CF6',
                    rose: '#F43F5E',
                },
                border: {
                    DEFAULT: '#1E2330',
                    subtle: '#171B24',
                    active: '#2D3548',
                },
                // Entry type colors (can be themed later if needed)
                entry: {
                    work: '#6366F1',
                    meeting: '#8B5CF6',
                    issue: '#F43F5E',
                    note: '#64748B',
                    idea: '#F59E0B',
                },
            },
            fontFamily: {
                sans: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                'xs': ['12px', '16px'],
                'sm': ['14px', '20px'],
                'base': ['16px', '24px'],
                'lg': ['18px', '28px'],
                'xl': ['20px', '28px'],
                '2xl': ['24px', '32px'],
                '3xl': ['30px', '36px'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '120': '30rem',
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                'elevated-heavy': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.25)',
            },
            animation: {
                'fade-in': 'fadeIn 0.15s ease-out',
                'fade-in-slow': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.15s ease-out',
                'slide-up-slow': 'slideUp 0.25s ease-out',
                'slide-in-right': 'slideInRight 0.15s ease-out',
                'slide-down': 'slideDown 0.15s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out',
                'pulse-subtle': 'pulseSubtle 2s infinite',
                'expand': 'expand 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                expand: {
                    '0%': { opacity: '0', maxHeight: '0' },
                    '100%': { opacity: '1', maxHeight: '500px' },
                },
            },
            backdropBlur: {
                'xs': '2px',
            },
            transitionDuration: {
                '150': '150ms',
            },
        },
    },
    plugins: [],
}
