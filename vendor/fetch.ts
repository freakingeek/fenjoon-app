const originalFetch = global.fetch;

const baseUrl = "https://proxy.fnjo.ir";
const proxyUrls = {
  "https://exp.host/--/api/v2/push/getExpoPushToken": `${baseUrl}/push/getExpoPushToken`,
  "https://exp.host/--/api/v2/push/updateDeviceToken": `${baseUrl}/push/updateDeviceToken`,
};

global.fetch = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const urlString = url.toString();

  const proxyUrl = proxyUrls[urlString];
  if (proxyUrl) {
    const modifiedOptions: RequestInit = {
      ...options,
      headers: {
        ...(options.headers as Record<string, string>),
        "X-Original-URL": urlString,
      },
    };

    return originalFetch(proxyUrl, modifiedOptions);
  }

  return originalFetch(url, options);
};
