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
  <style>
    #export-csv {
      width: 100%;
      display: flex; 
      justify-content: end; 
      align-items: center; 
      margin: 0px 0px 7px 0px;
      color: #999;
    }
    #export-csv.disable {
      color: #666;
    }
    #export-csv:hover {
      cursor: pointer;
      color: #fff;
    }
    #export-csv svg {
      padding-right: 2px
      stroke: #999;
      fill: #999;
      width: 22px;
      height: 20px;
      padding-right: 3px;
    }
    #export-csv.disable csv {
      stroke: #666;
      fill: #999;
    }
    #export-csv:hover svg {
      stroke: #fff;
      fill: #fff;
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
    <div class="content-title m-bottom10 contentTitleWrap___CS_CC">
      <span id="export-csv">
        <svg viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/">
          <g id="SVGRepo_iconCarrier">
            <rect id="Icons" x="-576" y="-128" width="1280" height="800" style="fill: none"></rect>
            <path id="download" d="M48.089,52.095l0,4l-32.049,0l0,-4l32.049,0Zm-16.025,-4l-16.024,-16l8.098,0l-0.049,-24l15.975,0l0.048,24l7.977,0l-16.025,16Z"></path>
          </g>
        </svg>
      Export Hand History CSV</span>
      <hr class="page-head-delimiter hr___XBw2N">
    </div>`;
  const header = document.querySelector('.content-title');
  if (document.querySelectorAll('.content-title').length > 1) return;
  header.insertAdjacentHTML('afterend', csvButtonHTML);
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

// async function copyCsv(data) {
//   console.log('copyCSV'); // TEST
//   navigator.clipboard.writeText(data);

//   // const blob = new Blob([data], { type: 'text/csv' });
//   // const clipboardItem = new ClipboardItem(
//   //   await new Promise((res) => {
//   //     res(blob);
//   //   })
//   // );
//   // navigator.clipboard.write([clipboardItem]);
// }

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
  const exportCsvEl = document.querySelector('#export-csv');
  exportCsvEl.addEventListener('click', () => {
    const csvContent = createCsvContent(handHistory);
    // if (isPDA()) {
    //   copyCsv(csvContent);
    // }
    // copyCsv(csvContent);
    // async () => {
    //   console.log(await navigator.clipboard.read());
    // };
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
    await requireElement('.content-title');
    renderCsvEl();
    await requireElement('.messagesWrap___tBx9u');
    handHistoryObserver();
    csvClickHandler();
  } catch (error) {
    console.error(error);
  }
})();
