// ==UserScript==
// @name         TORN: Prefill Item Send
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.0
// @description  Allows Prefill values to be set for amounts and players
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/item.php*
// @license      MIT
// ==/UserScript==

//////// PREFILL VALUES ////////
const prefillAmountVal = ['10', '24', '999999']; // 999999 is just some rediculous number that should be equivalent to 'max'
const prefillPlayerVal = ['Kv0the [2153277]'];

//////// INDEXES USED BY FUNCTIONS
// DO NOT CHANGE
let amountIndex = 0;
let playerIndex = 0;

//////// FUNCIONS ////////
function prefillAmount(inputEl) {
  const maxAmount = inputEl.dataset.max;

  inputEl.value = +prefillAmountVal[amountIndex] > +maxAmount ? maxAmount : prefillAmountVal[amountIndex];
}

function prefillPlayer(inputEl) {
  inputEl.value = prefillPlayerVal[playerIndex];
}

function amountClickHandler(e) {
  const max = prefillAmountVal.length - 1;
  if (++amountIndex > max) amountIndex = 0;

  prefillAmount(e.target);
}
function playerClickHandler(e) {
  const max = prefillPlayerVal.length - 1;
  if (++playerIndex > max) playerIndex = 0;

  prefillPlayer(e.target);
}

async function sendItemObserverCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    if (mutation.target.classList.contains('cont-wrap')) {
      if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList.length > 0 && mutation.addedNodes[0].classList.contains('send-act')) {
        const sendActionEl = mutation.addedNodes[0];
        const amountInputEl = sendActionEl.querySelector('input.amount');
        const playerInputEl = sendActionEl.querySelector('input.user-id');

        prefillAmount(amountInputEl);
        prefillPlayer(playerInputEl);

        amountInputEl.addEventListener('click', amountClickHandler);
        playerInputEl.addEventListener('click', playerClickHandler);
      }
    }
  }
}

function createSenditemMutationObserver() {
  const observer = new MutationObserver(sendItemObserverCallback);
  observer.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

document.addEventListener('input', (e) => console.log(e)); // TEST)

(async () => {
  console.log('🎁 Prefill item send script is ON!'); // TEST

  createSenditemMutationObserver();
})();
