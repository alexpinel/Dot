/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,css,js}', './node_modules/flowbite/**/*.js'],
    darkMode: 'class',
    theme: {
        fontSize: {
            xs: '0.55rem',
            sm: '0.8rem',
            base: '1rem',
            xl: '1.25rem',
            '2xl': '1.563rem',
            '3xl': '1.953rem',
            '4xl': '2.441rem',
            '5xl': '3.052rem',
        },
        extend: {},
    },
    plugins: [require('flowbite/plugin')],
    corePlugins: {
        fontFamily: false, // Disable default fontFamily to use custom @font-face
    },
    styles: {
        '@font-face': [
            {
                fontFamily: 'Roboto', // Specify a name for your custom font
                src: ['./src/Roboto/Roboto-Regular.ttf'], // Adjust the path and font format
                fontWeight: 'normal',
                fontStyle: 'normal',
            },
        ],
    },
}
