async function requireElement(
  selectors,
  conditionsCallback,
  queryElement = document
) {
  try {
    await new Promise((res, rej) => {
      const maxCycles = 500;
      let current = 1;
      const interval = setInterval(() => {
        if (queryElement.querySelector(selectors)) {
          if (!conditionsCallback) {
            clearInterval(interval);
            return res();
          }
          if (
            conditionsCallback &&
            conditionsCallback(queryElement.querySelector(selectors))
          ) {
            clearInterval(interval);
            return res();
          }
        }
        if (current === maxCycles) {
          clearInterval(interval);
          rej('Timeout: Could not find element on page');
        }
        current++;
      }, 10);
    });
  } catch (err) {
    console.error(err);
  }
}
