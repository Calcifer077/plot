const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface ClientConfig extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: HeadersInit;
}

export default function client<TResponse = unknown>(
  endpoint: string,
  { body, ...customConfig }: ClientConfig = {},
): Promise<TResponse> {
  const headers = { "Content-Type": "application/json" };
  const config: RequestInit = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };
  if (body) {
    config.body = JSON.stringify(body);
  }
  return window
    .fetch(`${backendUrl}/${endpoint}`, config)
    .then(async (response) => {
      if (response.ok) {
        return (await response.json()) as TResponse;
      } else {
        const errorMessage = await response.text();
        return Promise.reject(new Error(errorMessage));
      }
    });
}
