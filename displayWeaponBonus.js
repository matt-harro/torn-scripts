// ==UserScript==
// @name         TORN: Display Weapon Bonus + Stats
// @namespace    http://torn.city.com.dot.com.com
// @version      0.0.1
// @description  Displays weapon bonuses + stats next to weapon name in auction house
// @author       Ironhydedragon
// @match        https://www.torn.com/amarket.php*
// @license      MIT
// @run-at       document-end
// ==/UserScript==

//////// UTIL FUNCTIONS /////////
function auctionItemsLoadedCallback(queryEl) {
  const firstListItem = queryEl.querySelector('li');
  return !firstListItem.classList.contains('last');
}

async function requireElement(selectors, conditionsCallback) {
  try {
    await new Promise((res, rej) => {
      maxCycles = 500;
      let current = 1;
      const interval = setInterval(() => {
        if (document.querySelector(selectors)) {
          if (conditionsCallback === undefined) {
            clearInterval(interval);
            return res();
          }
          if (conditionsCallback(document.querySelector(selectors))) {
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

//////// CONTROLLERS ////////
async function initController() {
  console.log('🗡️ Display bonus script is running!'); // TEST
}

async function loadController() {
  await requireElement('ul.items-list', auctionItemsLoadedCallback);

  let listItemsArr = [...document.querySelectorAll('ul.items-list li')];
  const filterOutClasses = ['last', 'clear'];
  listItemsArr = listItemsArr.filter((li) => {
    return !filterOutClasses.some((c) => li.classList.contains(c));
  });

  console.log(listItemsArr);
  // TODO observer for page change
}

//////// EXECUTION ////////
//// Promise race conditions
// necessary as PDA scripts are inject after window.onload
const PDAPromise = new Promise((res, rej) => {
  if (document.readyState === 'complete') res();
});

const browserPromise = new Promise((res, rej) => {
  window.addEventListener('load', () => res());
});

(async () => {
  try {
    await Promise.race([PDAPromise, browserPromise]);
    initController();
    await loadController();
  } catch (error) {
    console.error(error);
  }
})();
