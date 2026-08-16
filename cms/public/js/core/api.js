export const api = (path, opts) => fetch(path, opts).then((r) => r.json());
