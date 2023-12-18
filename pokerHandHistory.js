// ==UserScript==
// @name         TORN: Poker Hand History
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.3
// @description  Tracks your poker hand history from current session and allows your to copy to clipboard(PDA) and download as csv
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/page.php?sid=holdem*
// @license      MIT
// ==/UserScript==

let db;
let handHistory = [];

//////// UTIL: GENERAL FUNCTIONS ////////
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

//////// VIEW: HAND HISTORY TITLE-CONTENT ////////
function renderTitleContentStylesheet() {
  const titleContentStylesheetHTML = `
  <style>
    #hand-history-content-title.hand-history {
      display: flex; 
      justify-content: end; 
      align-items: center;
      gap: 20px;
      color: #666;
      font-weight: bold;
    }
    .dark-mode #hand-history-content-title.hand-history {
    color: #999;
    }
    #hand-history-content-title span {
      display: flex;
      align-items: center;
    }
    #hand-history-content-title span:hover {
      color: #444;
    }
    .dark-mode #hand-history-content-title span:hover {
      color: #fff;
    }
    #hand-history-content-title svg {
      width: 20px; 
      height: 20px; 
      margin-right: 2px;
      fill: #666;
    }
    .dark-mode #hand-history-content-title svg {
      fill: #999
    }
    #hand-history-content-title span:hover svg {
      fill: #444;
    }
    .dark-mode #hand-history-content-title span:hover svg {
      fill: #fff;
    }
  </style>`;

  document.head.insertAdjacentHTML('beforeend', titleContentStylesheetHTML);
}

function renderTitleContent() {
  const handHistoryHTML = `
    <div id="hand-history-content-title" class="hand-history">
      Poker Hand History
      <span class="hand-history__csv">
        <svg viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/">
          <g id="SVGRepo_iconCarrier">
            <rect id="Icons" x="-576" y="-128" width="1280" height="800" style="fill: none"></rect>
            <path id="download" d="M48.089,52.095l0,4l-32.049,0l0,-4l32.049,0Zm-16.025,-4l-16.024,-16l8.098,0l-0.049,-24l15.975,0l0.048,24l7.977,0l-16.025,16Z"></path>
          </g>
        </svg>
        Export CSV</span>
      <span class="hand-history__peek">
        <svg viewBox="-4.8 -4.8 57.60 57.60" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path d="M0 0h48v48H0z" fill="none"></path>
            <g id="Shopicon">
              <circle cx="24" cy="24" r="4"></circle>
              <path d="M24,38c12,0,20-14,20-14s-8-14-20-14S4,24,4,24S12,38,24,38z M24,16c4.418,0,8,3.582,8,8s-3.582,8-8,8s-8-3.582-8-8 S19.582,16,24,16z"></path>
            </g>
          </g>
        </svg>
        Peek History
      </span>
    </div>`;
  const titleEl = document.querySelector('.content-title');

  if (document.querySelector('#hand-history-content-title')) return;
  titleEl.insertAdjacentHTML('afterend', handHistoryHTML);
}

function peekClickHandler() {
  renderModalStylesheet();
}

//////// VIEW: MODAL ////////
function renderModalStylesheet() {
  const renderModalStylesheetHTML = `
    <style>
      #hand-history-modal.hand-history-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      }

      #hand-history-modal.hand-history-modal svg {
        cursor: pointer;
      }

      #hand-history-modal .hand-history-modal__overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(221, 221, 221, 0.8);
        
        filter: blur(5px);
        z-index: 500;
      }

      .dark-mode #hand-history-modal .hand-history-modal__overlay {
        background: rgba( 58,58,58, 0.9);
      }

      #hand-history-modal .hand-history-modal__overlay-close {
        position: absolute;
        height: 24px;
        width: 24px;
        top: -24px;
        right: -24px;
      }
      #hand-history-modal .hand-history-modal__overlay-close svg {
        height: 24px;
        width: 24px;
        fill: #666;
      }

      #hand-history-modal .hand-history-modal__textarea {
        position: absolute;
        top: 10vh;
        width: 90vw;
        max-width: 976px;
        height: 80vh;
        background: #fff;
        color: #444;
        z-index: 1000;
      }
      .dark-mode #hand-history-modal .hand-history-modal__textarea {
        background: #000;
        color: #ddd;
      }
      #hand-history-modal .hand-history-modal__textarea-input {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: scroll;
        padding: 10px;
        color: inherit;
        background: transparent;
      }
      #hand-history-modal .hand-history-modal__textarea-copy {
       position: absolute;
       top: 10px;
       right: 10px;
      }
      #hand-history-modal svg {
        height: 20px;
        width: 20px;
        fill: #666;
      }
      #hand-history-modal .hand-history-modal__textarea-copy:hover svg,
      #hand-history-modal .hand-history-modal__overlay-close:hover svg {
        fill: #444;
      }

      .dark-mode #hand-history-modal svg {
        fill: #999
      }
      .dark-mode #hand-history-modal .hand-history-modal__textarea-copy:hover svg,
      .dark-mode #hand-history-modal .hand-history-modal__overlay-close:hover svg {
        fill: #fff;
      }
    </style>`;
  document.head.insertAdjacentHTML('beforeend', renderModalStylesheetHTML);
}

function renderModal() {
  const modalHTML = `
    <div id="hand-history-modal" class="hand-history-modal">
      <div class="hand-history-modal__overlay"></div>
      <div class="hand-history-modal__textarea">
        <div class="hand-history-modal__overlay-close">
        <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_iconCarrier">
            <path
              d="M8.00386 9.41816C7.61333 9.02763 7.61334 8.39447 8.00386 8.00395C8.39438 7.61342 9.02755 7.61342 9.41807 8.00395L12.0057 10.5916L14.5907 8.00657C14.9813 7.61605 15.6144 7.61605 16.0049 8.00657C16.3955 8.3971 16.3955 9.03026 16.0049 9.42079L13.4199 12.0058L16.0039 14.5897C16.3944 14.9803 16.3944 15.6134 16.0039 16.0039C15.6133 16.3945 14.9802 16.3945 14.5896 16.0039L12.0057 13.42L9.42097 16.0048C9.03045 16.3953 8.39728 16.3953 8.00676 16.0048C7.61624 15.6142 7.61624 14.9811 8.00676 14.5905L10.5915 12.0058L8.00386 9.41816Z"
            ></path>
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM3.00683 12C3.00683 16.9668 7.03321 20.9932 12 20.9932C16.9668 20.9932 20.9932 16.9668 20.9932 12C20.9932 7.03321 16.9668 3.00683 12 3.00683C7.03321 3.00683 3.00683 7.03321 3.00683 12Z"
            ></path>
          </g>
        </svg>
      </div>
        <textarea class="hand-history-modal__textarea-input"></textarea>
        <span class="hand-history-modal__textarea-copy">
           <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M21 8C21 6.34315 19.6569 5 18 5H10C8.34315 5 7 6.34315 7 8V20C7 21.6569 8.34315 23 10 23H18C19.6569 23 21 21.6569 21 20V8ZM19 8C19 7.44772 18.5523 7 18 7H10C9.44772 7 9 7.44772 9 8V20C9 20.5523 9.44772 21 10 21H18C18.5523 21 19 20.5523 19 20V8Z"></path>
              <path d="M6 3H16C16.5523 3 17 2.55228 17 2C17 1.44772 16.5523 1 16 1H6C4.34315 1 3 2.34315 3 4V18C3 18.5523 3.44772 19 4 19C4.55228 19 5 18.5523 5 18V4C5 3.44772 5.44772 3 6 3Z"></path>
            </g>
          </svg>
        </span>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', modalHTML);
}

// //////// MODEL: INDEXED DB ////////
function openDB() {
  // Open database
  const request = window.indexedDB.open('pokerHandHistoryDB', 1);
  request.onerror = (event) => {
    console.error('indexedDB request error: ', event); // TEST
  };
  request.onsuccess = (event) => {
    console.log('indexedDB request success: ', event); // TEST
    db = event.target.result;
  };
}
openDB();

// request.onupgradeneeded = (event) => {
//   // Save the IDBDatabase interface
//   const db = event.target.result;

//   // Create an objectStore for this database
//   if (!db.objectStoreNames.contains('messageStore')) {
//     console.log('PokerHistory: initIndexDB open onupgradeneeded create store');
//     const objectStore = db.createObjectStore('messageStore', { keyPath: 'autoId', autoIncrement: true });
//   }
// };

// function dbReadAll() {
//   if (!db) {
//     console.error('PokerHistory: dbReadAll db is null');
//   }

//   const transaction = db.transaction(['messageStore'], 'readonly');
//   transaction.oncomplete = (event) => {
//     console.log('PokerHistory: dbReadAll transaction oncomplete');
//   };
//   transaction.onerror = (event) => {
//     console.error('PokerHistory: dbReadAll transaction onerror');
//   };

//   const store = transaction.objectStore('messageStore');
//   return new Promise((resolve, reject) => {
//     const resultList = [];
//     store.openCursor().onerror = (event) => {
//       resolve(resultList);
//     };
//     store.openCursor().onsuccess = (event) => {
//       const cursor = event.target.result;
//       if (cursor) {
//         resultList.push(cursor.value);
//         cursor.continue();
//       } else {
//         resolve(resultList);
//       }
//     };
//   });
// }

//////// MODEL: CSV FUNCTIONS ////////
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

//////// MODEL: DB FUNCTIONS ////////

function initController() {
  renderTitleContentStylesheet();
  renderModalStylesheet();
}

/////// CONTROLLERS ////////
function csvClickHandler() {
  const csvContent = createCsvContent(handHistory);

  console.log('✋', handHistory); // TEST
  downloadCsv(csvContent);

  handHistory = [];
}

function copyHandHistory() {
  console.log('copy'); // TEST
}

function closeModal() {
  document.querySelector('#hand-history-modal').remove();
}

function peekClickHandler() {
  if (document.querySelector('#hand-history-modal')) return;
  renderModal();

  document.querySelector('#hand-history-modal .hand-history-modal__textarea-copy').addEventListener('click', copyHandHistory);
  document.querySelector('#hand-history-modal .hand-history-modal__overlay').addEventListener('click', closeModal);
  document.querySelector('#hand-history-modal .hand-history-modal__overlay-close').addEventListener('click', closeModal);
}

async function titleContentController() {
  await requireElement('.content-title');
  renderTitleContent();
  document.querySelector('.hand-history__csv').addEventListener('click', csvClickHandler);
}

function modalController() {
  document.querySelector('.hand-history__peek').addEventListener('click', peekClickHandler);
}

(async () => {
  try {
    console.log('♠️ Poker Hand History script is ON!'); // TEST
    initController();
    await titleContentController();
    modalController();
    await requireElement('.messagesWrap___tBx9u');
    handHistoryObserver();
    csvClickHandler();
  } catch (error) {
    console.error(error);
  }
})();
