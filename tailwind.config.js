/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
            },
            animation: {
                'gradient-slow': 'gradient 15s ease infinite',
                'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'spin-slow': 'spin 12s linear infinite',
                'morph': 'morph 8s ease-in-out infinite',
                'neural-flow': 'neural-flow 20s linear infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { 'background-position': '0% 50%' },
                    '50%': { 'background-position': '100% 50%' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
                    '50%': { opacity: 0.4, transform: 'scale(0.98)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(1deg)' },
                },
                morph: {
                    '0%, 100%': { 'border-radius': '60% 40% 30% 70% / 60% 30% 70% 40%' },
                    '50%': { 'border-radius': '30% 60% 70% 40% / 50% 60% 30% 60%' },
                },
                'neural-flow': {
                    '0%': { 'background-position': '0% 0%' },
                    '100%': { 'background-position': '100% 100%' }
                }
            }
        }
    },
    plugins: [],
}
