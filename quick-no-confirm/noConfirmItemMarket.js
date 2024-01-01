// ==UserScript==
// @name         TORN: No Confirm Buy
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.0
// @description  Allows buying of items from item market and bazaars with 1-click
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/imarket.php*
// @license      MIT
// ==/UserScript==

const green = '#678c00';
const greenTranslucent = 'rgba(103, 140, 0, .8)';

const stylesheetHTML = `
  <style>
    .quick-buy {
      background-color: ${greenTranslucent}
    }
  </style>`;

function renderStylesheet() {
  document.head.insertAdjacentHTML('beforeend', stylesheetHTML);
}

function getPrice(itemEl) {
  const priceEl = itemEl.querySelector('.cost');

  const price = priceEl.childNodes[2].textContent
    .match(/\d.*/)[0]
    .trim()
    .split(',')
    .join('');

  return price;
}

function buyItemController() {
  const buyBtnArray = [...document.querySelectorAll('li.buy .buy-link')];
  buyBtnArray.forEach((btn) => {
    const itemEl = btn.closest('li').parentElement.closest('li');
    btn.dataset.action = 'buyItemConfirm';
    btn.dataset.price = getPrice(itemEl);
    btn.classList.add('yes-buy');
    btn.parentElement.classList.add('quick-buy');
  });
}

function observerCallback(mutationList, observer) {
  try {
    for (const mutation of mutationList) {
      if (
        (mutation.target.id === 'item-market-main-wrap' ||
          mutation.target.classList.contains('buy-item-info-wrap')) &&
        mutation.addedNodes &&
        mutation.addedNodes.length > 0
      ) {
        buyItemController();
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function createObserver() {
  const observer = new MutationObserver(observerCallback);
  observer.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

(async () => {
  console.log('👍 No confirm buy script is ON!');
  renderStylesheet();
  createObserver();
})();
