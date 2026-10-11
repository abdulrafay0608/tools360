export function createObjectUrlTracker(urlApi = URL) {
  const trackedUrls = new Set();

  return {
    create(blob) {
      const url = urlApi.createObjectURL(blob);
      trackedUrls.add(url);
      return url;
    },
    revoke(url) {
      if (!url || !trackedUrls.delete(url)) return;
      urlApi.revokeObjectURL(url);
    },
    revokeAll() {
      for (const url of trackedUrls) urlApi.revokeObjectURL(url);
      trackedUrls.clear();
    },
  };
}
