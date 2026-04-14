import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const backendUrl = process.env.BANDW_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/graphql': backendUrl,
			'/files': backendUrl,
		},
	},
});
