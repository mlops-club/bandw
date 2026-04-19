import { Client, cacheExchange, fetchExchange } from "@urql/svelte";

function getApiKey(): string {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("bandw-api-key") ||
      "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
    );
  }
  return "";
}

export const client = new Client({
  url: "/graphql",
  preferGetMethod: false,
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => ({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa("api:" + getApiKey())}`,
    },
  }),
});
