/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.tsx",
        "./*.ts",
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./services/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    dark: "var(--primary-dark)",
                },
                secondary: "var(--secondary)",
                accent: "var(--accent)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
            },
            animation: {
                'in': 'in 0.3s ease-out forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'zoom-in': 'zoom-in 0.5s ease-out forwards',
                'slide-in-from-bottom': 'slide-in-from-bottom 0.5s ease-out forwards',
            },
            keyframes: {
                'in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'zoom-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-in-from-bottom': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
