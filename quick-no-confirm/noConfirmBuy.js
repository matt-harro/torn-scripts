// ==UserScript==
// @name         TORN: No Confirm Buy
// @namespace    http://torn.city.com.dot.com.com
// @version      0.0.0
// @description  Allows buying of items from item market and bazaars with 1-click
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/*
// @license      MIT
// ==/UserScript==

const { fetch: origFetch } = unsafeWindow;

unsafeWindow.fetch = async (...args) => {
  console.log('fetch called with args:', args);

  if (
    args[0].match(/sidebarAjaxAction.php\?q=sync&rfcv=/) &&
    args[1].body === '{"fullUrl":"https://www.torn.com/imarket.php#"}'
  ) {
    // ... send request to sever to confirm buy
  } else {
    const response = await origFetch(...args);
  }

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

function getCookie(name) {
  var cookie = document.cookie.match('\\b' + name + '=([^;]*)\\b');
  return cookie ? cookie[1] : undefined;
}

function buyClickHandler(e) {
  // hide buy-confirm
  // show buy success
}

function observerCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    // if (
    //   !mutation.target.classList.contains('progress-line-timer___uV1ZZ') &&
    //   !mutation.target.classList.contains('news-ticker-slide') &&
    //   !mutation.target.classList.contains('progress___z5tk3') &&
    //   mutation.target.id !== 'news-ticker-slider-wrapper'
    // ) {
    //   console.log('👀', mutation); // TEST
    // }
    if (
      mutation.target.classList.contains('buy-item-info-wrap') &&
      mutation.addedNodes.length > 0
    ) {
      console.log('👀', mutation); // TEST
      const itemsArr = [...mutation.target.children[3].children];

      for (const item of itemsArr) {
        const buyBtn = item.querySelector('li.buy a.buy-link');
        const id = buyBtn.dataset.id;
        const price = buyBtn.dataset.price;

        buyBtn.removeEventHandler('click');

        console.log(buyBtn, id, price); // TEST
      }
    }
  }
}

function createObserver() {
  const observer = new MutationObserver(observerCallback);
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
}

(() => {
  console.log('👍 No confirm buy script is ON!'); // TEST
  console.log('cookie', getCookie('rfc_v')); // TEST
  console.log('window', window); // TEST
  console.log('unsafeWindow', unsafeWindow); // TEST
  console.log('same', window === unsafeWindow); // TEST

  createObserver();
})();
