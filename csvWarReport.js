// ==UserScript==
// @name         TORN: Dowload WarReport as CSV
// @namespace    http://torn.city.com.dot.com.com
// @version      0.0.2
// @description  Displays a button that allows users to download a csv version of their war report
// @author       Ironhydedragon[2428902]
// @match        https://www.torn.com/war.php?step=rankreport*
// @license      MIT
// @run-at       document-end
// ==/UserScript==

//////// GLOBAL VARIABLES ////////
const PDA_API_KEY = '###PDA-APIKEY###';
function isPDA() {
  const PDATestRegex = !/^(###).+(###)$/.test(PDA_API_KEY);

  return PDATestRegex;
}

let GLOBAL_STATE = {
  // userId: USER_ID,
  factionId: undefined,
  reportId: undefined,
};

//////// MODEL /////////
function getGlobalState() {
  return GLOBAL_STATE;
}
function setGlobalState(newState) {
  GLOBAL_STATE = { ...getGlobalState(), ...newState };
}

function getApiKey() {
  return localStorage.getItem('tornDownloadCsvApiKey');
}
function setApikey(apiKey) {
  localStorage.setItem('tornDownloadCsvApiKey', apiKey);
}

// function getUserId() {
//   return getGlobalState().userId;
// }
// function setUserId(value, currentState) {
//   currentState = currentState || getGlobalState();
//   const newState = { ...currentState, userId: value };
//   return setGlobalState(newState);
// }

function getFactionId() {
  return getGlobalState().factionId;
}
function setFactionId(value, currentState) {
  currentState = currentState || getGlobalState();
  const newState = { ...currentState, factionId: value };
  return setGlobalState(newState);
}

function getReportId() {
  return getGlobalState().reportId;
}
function setReportId(value, currentState) {
  currentState = currentState || getGlobalState();
  const newState = { ...currentState, reportId: value };
  return setGlobalState(newState);
}

async function fetchPlayerData(apiKey) {
  try {
    const response = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
    const data = await response.json();

    if (data.error && (data.error.error === 'Incorrect key' || data.error.error === 'Access level of this key is not high enough')) {
      throw new Error(`Something went wrong: ${data.error.error}`);
    }
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function fetchRankedWarReport(reportID, apiKey) {
  const response = await fetch(`https://api.torn.com/torn/${reportID}?selections=rankedwarreport&key=${apiKey}`);
  return await response.json();
}

//////// UTIL FUNCITONS ////////
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

// function createCsvContent(dataObject) {
//   let rows = [];

//   const first = Object.keys(dataObject)[0];
//   const headerRow = Object.keys(dataObject[first]);

//   rows.push(headerRow);

//   for (const entry in dataObject) {
//     const row = Object.values(dataObject[entry]);
//     rows.push(row);
//   }

//   return rows.map((row) => row.join(',')).join('\n');
// }

function createWarReportContent(dataObject) {
  let rows = [];

  for (const faction in dataObject) {
    const factionName = dataObject[faction].name;
    rows.push([factionName]);

    const first = Object.keys(dataObject[faction].members)[0];
    const headerRow = Object.keys(dataObject[faction].members[first]);
    rows.push(headerRow);
    for (const member in dataObject[faction].members) {
      rows.push(Object.values(dataObject[faction].members[member]));
    }
  }
  return rows
    .map((row) => {
      return row.join(';');
    })
    .join('\n');
}

function download(data) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  renderCsvDownloadLink(url);
}

//// Callbacks
function submitFormCallback() {
  const inputEl = document.querySelector('#api-form__input');
  const submitBtnEl = document.querySelector('#api-form__submit');

  const apiKey = inputEl.value;
  if (apiKey.length !== 16) {
    inputEl.style.border = `2px solid ${red}`;
    submitBtnEl.disabled = true;
    return;
  }
  setApikey(apiKey);
  dismountBustrForm();
  window.location.reload();
}

function inputValidatorCallback(event) {
  const inputEl = document.querySelector('#api-form__input');
  const submitBtnEl = document.querySelector('#api-form__submit');
  if (event.target.value.length === 16) {
    submitBtnEl.disabled = false;
    inputEl.style.border = '1px solid #444';
  }
  if (event.target.value.length !== 16) {
    submitBtnEl.disabled = true;
  }
}

//////// VIEW ////////
const stylesheet = `
  <style>
    #api-form.header-wrapper-top {
      display: flex;
    }
    #api-form.header-wrapper-top .container {
      display: flex;
      justify-content: start;
      align-items: center;
      padding-left: 20px;
    }

    #api-form.header-wrapper-top h2 {
      display: block;
      text-align: center;
      margin: 0;
      width: 172px;
    }

    #api-form.header-wrapper-top input {
      background: linear-gradient(0deg,#111,#000);
      border-radius: 5px;
      box-shadow: 0 1px 0 hsla(0,0%,100%,.102);
      box-sizing: border-box;
      color: #9f9f9f;
      display: inline;
      font-weight: 400;
      height: 24px;
      width: clamp(170px, 50%, 250px);
      margin: 0 0 0 21px;
      outline: none;
      padding: 0 10px 0 10px;
      
      font-size: 12px;
      font-style: italic; 
      vertical-align: middle;
      border: 0;
      text-shadow: none;
      z-index: 100;
    }
    #api-form.header-wrapper-top a {
      margin: 0 8px;
    }

    #csv-link {
      float: right;
      padding: 0 10px;
      text-decoration: none;
      color: inherit;
    }
    #csv-link.disable {
      pointer-events: none;
    }
  </style>`;

function renderStylesheet() {
  const headEl = document.querySelector('head');
  headEl.insertAdjacentHTML('beforeend', stylesheet);
}

function renderApiForm() {
  const topHeaderBannerEl = document.querySelector('#topHeaderBanner');
  const apiFormHTML = `
      <div id="api-form" class="header-wrapper-top">
        <div class="container clear-fix"> 
          <h2>API Key</h2>
          <input
            id="api-form__input"
            type="text"
            placeholder="Enter a full-acces API key..."
          />
          <a href="#" id="api-form__submit"  type="btn" disabled><span class="link-text">Submit</span</button>
        </div>
      </div>`;

  topHeaderBannerEl.insertAdjacentHTML('afterbegin', apiFormHTML);

  // set event liseners
  //// Event listeners
  document.querySelector('#api-form__submit').addEventListener('click', submitFormCallback);
  document.querySelector('#api-form__input').addEventListener('input', inputValidatorCallback);
  document.querySelector('#api-form__input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      submitFormCallback();
    }
  });
}
function dismountBustrForm() {
  document.querySelector('#api-form').remove();
}

function renderCsvDownloadLink(url) {
  const linkHTML = `
    <a id="csv-link" href="${url}" download="war-report-${getReportId()}">Download CSV</a>`;

  const titleContainerEl = document.querySelector('.war-report-wrap .title-black');
  titleContainerEl.insertAdjacentHTML('beforeend', linkHTML);
  console.log('title-containter-el', titleContainerEl); // TEST
  console.log(linkHTML); // TEST

  document.querySelector('#csv-link').addEventListener('click', (e) => {
    e.target.classList.add('disable');
  });
}

//////// CONTROLLERS ////////
async function initController() {
  try {
    renderStylesheet();

    if (!getApiKey() && !isPDA()) {
      renderApiForm();
      return;
    }

    if (isPDA()) {
      setApikey(PDA_API_KEY);
    }

    const playerData = await fetchPlayerData(getApiKey());
    const factionId = playerData.faction.faction_id;
    setFactionId(factionId);

    const urlParams = new URLSearchParams(window.location.href);
    const reportId = urlParams.get('rankID').match(/\d*/);
    setReportId(reportId);

    renderDownloadCsvEl();
  } catch (error) {
    console.error(error);
  }
}

async function rankedWarCsvController() {
  try {
    const data = await fetchRankedWarReport(getReportId(), getApiKey());
    const factionData = data.rankedwarreport.factions; // TEST

    const csvContent = createWarReportContent(factionData);
    download(csvContent);
  } catch (error) {
    console.error(error); // TEST
  }
}

//// Promise race conditions
// necessary as PDA scripts are inject after window.onload
// const PDAPromise = new Promise((res, rej) => {
//   if (document.readyState === 'complete') res();
// });

// const browserPromise = new Promise((res, rej) => {
//   window.addEventListener('load', () => res());
// });

(async () => {
  try {
    console.log('🔫 WarReport CSV script is on!'); // TEST
    // await Promise.race([PDAPromise, browserPromise]);
    await initController();
    if (getApiKey()) {
      await rankedWarCsvController();
      await requireElement('.war-report-wrap .title-black');
    }
  } catch (error) {
    console.error(error); // TEST
  }
})();
