// ==UserScript==
// @name         UTILS: Fetch Interceptor
// @namespace    http://torn.city.com.dot.com.com
// @version      0.0.0
// @description  Intercepts fetch requests
// @author       Ironhydedragon[2428902]
// @match        https://www.torn.com/*
// @license      MIT
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

// ((window) => {
//   console.log('🎾 Fetch interceptor script is ON!'); // TEST

//   const { fetch: origFetch } = window;

//   window.fetch = async (...args) => {
//     console.log('fetch called with args:', args);

//     const response = await origFetch(...args);

//     /* work with the cloned response in a separate promise
//      chain -- could use the same chain with `await`. */
//     response
//       .clone()
//       .json()
//       .then((data) => console.log('intercepted response data:', data))
//       .catch((err) => console.error(err));

//     /* the original response can be resolved unmodified: */
//     return response;
//   };
// })(unsafeWindow);

(() => {
  console.log('🎾 Fetch interceptor script is ON!'); // TEST

  const { fetch: origFetch } = unsafeWindow;

  unsafeWindow.fetch = async (...args) => {
    console.log('fetch called with args:', args);

    // if (args[1]?.body?.entries()) {
    //   for (const entry of args[1].body.entries()) {
    //     console.log(entry); // TEST
    //   }
    // }

    const response = await origFetch(...args);

    /* work with the cloned response in a separate promise
     chain -- could use the same chain with `await`. */
    // response
    //   .clone()
    //   .json()
    //   .then((data) => console.log('intercepted response data:', args[0], data))
    //   .catch((err) => console.error(err));

    /* the original response can be resolved unmodified: */
    return response;
  };
})();
