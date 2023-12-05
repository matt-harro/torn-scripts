// ==UserScript==
// @name         TORN: Display Weapon Bonus + Stats
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.0
// @description  Displays weapon bonuses + stats next to weapon name in auction house
// @author       Ironhydedragon
// @match        https://www.torn.com/amarket.php*
// @license      MIT
// @run-at       document-end
// ==/UserScript==

//////// UTIL FUNCTIONS /////////

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

function getAuctionListItems() {
  let listItemsArr = [...document.querySelectorAll('ul.items-list li')];
  const filterOutClasses = ['last', 'clear'];
  listItemsArr = listItemsArr.filter((li) => {
    return !filterOutClasses.some((c) => li.classList.contains(c));
  });
  return listItemsArr;
}

//// Callbacks
function auctionItemsLoadedCallback(queryEl) {
  const firstListItem = queryEl.querySelector('li');
  return !firstListItem.classList.contains('last');
}

async function auctionObserverCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    if (mutation.target.classList.contains('items-list') && mutation.addedNodes.length > 10) {
      observer.disconnect();
      await loadController();
    }
  }
}

//// Observers
function createAuctionMutationObserver() {
  const observer = new MutationObserver(auctionObserverCallback);
  observer.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

//////// VIEW ////////
const stylesheet = `
  <style>
    .display-bonus__container {
      display: block
    }

    p.display-bonus__bonus {
      display: inline-block;
      padding-right: 4px;
    }
  </style>
`;
function renderStylesheet() {
  document.head.insertAdjacentHTML('beforeend', stylesheet);
}

function renderWeaponBonuses(weaponEl) {
  let rawBonusTextArr = [...weaponEl.querySelectorAll('.iconsbonuses span')].map((spanEl) => spanEl.title);

  const bonusArr = rawBonusTextArr.map((raw) => {
    const name = raw.match(/(?<=<b>)\w+/);
    const bonus = raw.match(/\d+%|\d+\sturns/);

    return `${name} ${bonus}`;
  });

  const titleContainerEl = weaponEl.querySelector('span.title');
  titleContainerEl.querySelector('p').remove();

  const bonusContainerHTML = `<div class="display-bonus__container"></div>`;
  titleContainerEl.insertAdjacentHTML('beforeend', bonusContainerHTML);

  for (const bonus of bonusArr) {
    const bonusHTML = `<p class="t-gray-6 display-bonus__bonus">${bonus}</p>`;
    titleContainerEl.querySelector('.display-bonus__container').insertAdjacentHTML('beforeend', bonusHTML);
  }
}

//////// CONTROLLERS ////////
async function initController() {
  console.log('🗡️ Display bonus script is running!'); // TEST
  renderStylesheet();
}

async function loadController() {
  try {
    await requireElement('ul.items-list', auctionItemsLoadedCallback);
    const listItemsArr = getAuctionListItems();

    for (const item of listItemsArr) {
      renderWeaponBonuses(item);
    }

    createAuctionMutationObserver();
  } catch (error) {
    console.error(error);
  }
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
