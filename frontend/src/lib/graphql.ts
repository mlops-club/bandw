import { Client, cacheExchange, fetchExchange } from '@urql/svelte';

const API_KEY = '1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5';

export const client = new Client({
	url: '/graphql',
	exchanges: [cacheExchange, fetchExchange],
	fetchOptions: () => ({
		headers: {
			Authorization: 'Basic ' + btoa('api:' + API_KEY),
		},
	}),
});
