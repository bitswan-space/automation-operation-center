import axios from "axios";

export const authenticatedBitswanBackendInstance = async (
  headers: Record<string, string> = {},
) => {
  const apiToken = localStorage.getItem('access_token');

  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;
  const backendHost = currentHost.replace(/^aoc\./, 'api.');
  const baseURL = `${protocol}//${backendHost}/api/frontend`;
  
  if (!apiToken) {
    console.error("No access token available for API calls");
  }

  return axios.create({
    baseURL: baseURL,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });
};