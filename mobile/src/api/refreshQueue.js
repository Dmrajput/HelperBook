export function createRefreshQueue(refresh) {
  let pending = null;

  return function refreshOnce() {
    if (!pending) {
      pending = Promise.resolve()
        .then(() => refresh())
        .finally(() => {
          pending = null;
        });
    }

    return pending;
  };
}
