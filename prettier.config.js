/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [
		{ files: '*.svelte', options: { parser: 'svelte' } },
		// Prettier can't infer a parser from an extensionless dotfile.
		{ files: '.firebaserc', options: { parser: 'json' } }
	],
	tailwindStylesheet: './src/routes/layout.css'
};

export default config;
