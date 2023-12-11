// ==UserScript==
// @name         TORN: Poker Hand History
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.2
// @description  Tracks your poker hand history from current session and allows your to copy to clipboard(PDA) and download as csv
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/page.php?sid=holdem*
// @license      MIT
// ==/UserScript==

let handHistory = [];

const PDA_API_KEY = '###PDA-APIKEY###';
function isPDA() {
  const PDATestRegex = !/^(###).+(###)$/.test(PDA_API_KEY);

  return PDATestRegex;
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

function renderPokerStylesheet() {
  const stylesheetHTML = `
  <style type="text/css">
    #top-page-links-list .m-left10 {
      margin-left: unset;
    }
    @media screen and (max-width:1000px){
      #body #csv-button-label {
        display: none !important;
      }
    }
    </style>`;

  document.head.insertAdjacentHTML('beforeend', stylesheetHTML);
}

function fixHtml() {
  const linksList = document.querySelector('#top-page-links-list');
  const nonButtons = [...linksList.children].filter((child) => !child.classList.contains('back'));

  nonButtons.forEach((el) => el.remove());
  linksList.style.display = 'flex';
  linksList.style.flexDirection = 'row-reverse';
}

function renderCsvEl() {
  const csvButtonHTML = `
     <a
      role="button"
      aria-label="download-csv"
      id="csv-button"
      class="h c-pointer line-h24 m-left10"
    >
      <span class="icon-wrap">
        <svg
          fill="#000000"
          height="16px"
          width="20px"
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 512 512"
          xml:space="preserve"
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M442.2,186.2H302.5V0h-93.1v186.2H69.8L256,418.9L442.2,186.2z M465.5,372.4v93.1H46.5v-93.1H0V512h512V372.4H465.5z"
            ></path>
          </g>
        </svg>
      </span>
      <span id="csv-button-label" class="icon-label">CSV</span>
    </a>`;
  const pokerIcons = document.querySelectorAll('#top-page-links-list a[role="buton]');
  pokerIcons[0].insertAdjacentHTML('afterend', csvButtonHTML);

  // TODO: renders unusable on PDA for some reason
}

function createCsvContent(dataObjectArr) {
  let rows = [];

  const first = Object.keys(dataObjectArr)[0];
  const headerRow = Object.keys(dataObjectArr[first]);

  rows.push(headerRow);

  for (const entry in dataObjectArr) {
    const row = Object.values(dataObjectArr[entry]);
    rows.push(row);
  }

  return rows.map((row) => row.join(',')).join('\n');
}

async function copyCsv(data) {
  console.log('copyCSV'); // TEST
  navigator.clipboard.writeText(data);

  // const blob = new Blob([data], { type: 'text/csv' });
  // const clipboardItem = new ClipboardItem(
  //   await new Promise((res) => {
  //     res(blob);
  //   })
  // );
  // navigator.clipboard.write([clipboardItem]);
}

function downloadCsv(data) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${Date.now()}-hand-history.csv`;
  a.addEventListener('click', () => {});
  a.click();
}

function handHistoryCallback(mustationList, observer) {
  for (const mutation of mustationList) {
    if (mutation.addedNodes.length > 0) {
      const handLog = `"${mutation.addedNodes[0].innerText}\"`;
      handHistory.push({ log: handLog });
    }
  }
}

function handHistoryObserver() {
  const observer = new MutationObserver(handHistoryCallback);
  observer.observe(document.querySelector('.messagesWrap___tBx9u'), {
    attributes: false,
    childList: true,
    subtree: false,
  });
}

function csvClickHandler() {
  const csvBtnEl = document.querySelector('#csv-button');
  csvBtnEl.addEventListener('click', () => {
    const csvContent = createCsvContent(handHistory);
    // if (isPDA()) {
    //   copyCsv(csvContent);
    // }
    copyCsv(csvContent);
    async () => {
      console.log(await navigator.clipboard.read());
    };
    console.log('✋', handHistory); // TEST
    downloadCsv(csvContent);

    handHistory = [];
  });
}

(async () => {
  try {
    console.log('♠️ Poker Hand History script is ON!'); // TEST
    renderPokerStylesheet();
    fixHtml();
    renderCsvEl();
    await requireElement('.messagesWrap___tBx9u');
    handHistoryObserver();
    csvClickHandler();
  } catch (error) {
    console.error(error);
  }
})();
