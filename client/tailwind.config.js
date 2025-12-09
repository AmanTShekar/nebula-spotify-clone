/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                spotify: {
                    green: '#1DB954',
                    black: '#191414',
                    white: '#FFFFFF',
                    light: '#282828',
                    dark: '#121212',
                    grey: '#B3B3B3'
                },
                nebula: {
                    dark: '#0f0f16',
                    light: '#1e1e2d',
                    accent: '#6366f1', // Indigo
                    secondary: '#ec4899', // Pink
                }
            }
        },
    },
    plugins: [],
}
