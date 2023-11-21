/** @format */

// ==UserScript==
// @name         BUSTR: Busting Reminder + PDA
// @namespace    http://torn.city.com.dot.com.com
// @version      0.2.1
// @description  Guess how many busts you can do without getting jailed
// @author       Adobi & Ironhydedragon
// @match        https://www.torn.com/*
// @license      MIT
// ==/UserScript==

console.log('😎 START!!!!'); // TEST

////////  GLOBAL VARIABLES
////  State
let GLOBAL_BUSTR_STATE = {
  userSettings: {
    reminderLimits: {
      redLimit: 0,
      greenLimit: 3,
    },
  },
  penaltyScore: 0,
  penaltyThreshold: 0,
  availableBusts: 0,
  timestampsArray: [],
  lastFetchTimestampMs: 0,
  renderedView: undefined,
};

const PDA_API_KEY = '###PDA-APIKEY###';
function isPDA() {
  const PDATestRegex = !/^(###).+(###)$/.test(PDA_API_KEY);
  console.log('IS PDA', PDATestRegex); // TEST

  return PDATestRegex;
}

////  Colors
const red = '#E54C19';
const redLight = 'rgb(255, 168, 168)';

// const orange = '#B25900';
// const orange = '#d98c00';
const orange = '#d08000';
const orangeLight = '#FFBF00';

const green = ''; // link color
const greenLight = '#85b200'; // Icon Color

const white = 'rgb(51, 51, 51)';

////  SVG Gradients
const greenSvgGradient = 'url(#sidebar_svg_gradient_regular_green_mobile';
const orangeSvgGradient = 'url(#svg_status_idle';

////  Utils Functions

function createTimestampsArray(data) {
  console.log('CREATE TIMESTAMPS'); // TEST
  let timestamps = [];

  console.log('ts-data.log', data.log); // TEST
  for (const entry in data.log) {
    timestamps.push(data.log[entry].timestamp);
    // console.log('entry', entry); // TEST
  }

  console.log('ts', timestamps); // TEST
  return timestamps;
}

function calcTenHours(hours) {
  return hours / 7.2;
}

function calcPenaltyScore(timestampsArray) {
  console.log('CALC PS'); // TEST
  const currentTime = Date.now() / 1000;

  let score = 0;
  let localScore = 0;
  for (const ts of timestampsArray) {
    const hours = (currentTime - ts) / 60 / 60;
    const tenHours = calcTenHours(hours);
    if (hours <= 72) {
      localScore = 128 / Math.pow(2, tenHours);
      score += localScore;
    }
  }
  console.log('ps', Math.floor(score)); // TEST
  return Math.floor(score);
}

function calcPenaltyThreshold(timestampsArray) {
  console.log('CALC PT'); // TEST
  const period = 24 * 60 * 60 * 3;
  let longestSequence = 0;
  let currentSequence = 1;
  let currentMin = timestampsArray[0];
  let currentMax = timestampsArray[0];
  let firstTimestamp;

  for (let i = 1; i < timestampsArray.length; i++) {
    const TS = timestampsArray[i];
    if (currentMin - TS <= period && currentMax - TS <= period) {
      currentSequence++;
      currentMin = Math.min(currentMin, TS);
      currentMax = Math.max(currentMax, TS);
    } else {
      if (longestSequence < currentSequence) {
        firstTimestamp = currentMin;
      }
      longestSequence = Math.max(longestSequence, currentSequence);
      currentSequence = 1;
      currentMin = TS;
      currentMax = TS;
    }
  }

  let currentMaxScore = 0;
  for (let i = 0; i < timestampsArray.length - longestSequence; i++) {
    let score = 0;
    let localScore = 0;
    const initial_timestamp = timestampsArray[i];
    for (let j = 0; j < longestSequence; j++) {
      const hours = (initial_timestamp - timestampsArray[i + j]) / 60 / 60;
      const tenHours = calcTenHours(hours);
      localScore = 128 / Math.pow(2, tenHours);
      score += localScore;
    }
    currentMaxScore = Math.max(currentMaxScore, score);
  }
  console.log('pt', Math.floor(currentMaxScore)); // TEST
  return Math.floor(currentMaxScore);
}

function calcAvailableBusts(penaltyScore, penaltyThreshold) {
  return Math.floor((penaltyThreshold - penaltyScore) / 128);
}

async function fetchBustsData(apiKey) {
  try {
    console.log('FETCH BUST DATA'); // TEST
    const url = `https://api.torn.com/user/?selections=log&log=5360&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    setLastFecthTimestampMs();

    console.log('res', response); // TEST
    console.log('data', data); // TEST
    if (data.error) {
      if (
        data.error.error === 'Incorrect key' ||
        data.error.error === 'Access level of this key is not high enough'
      ) {
        throw new Error(`Error: ${data.error.error}`);
      }
      throw new Error('Something went wrong');
    }
    return data;
  } catch (err) {
    console.error(err); // TEST
  }
}

function calcBustrStats(timestampsArray) {
  const penaltyScore = calcPenaltyScore(timestampsArray);

  const penaltyThreshold = calcPenaltyThreshold(timestampsArray);

  const availableBusts = calcAvailableBusts(penaltyScore, penaltyThreshold);

  return { penaltyScore, penaltyThreshold, availableBusts };
}

//// Callback functions
function submitFormCallback() {
  const inputEl = document.querySelector('#bustr-form__input');
  const submitBtnEl = document.querySelector('#bustr-form__submit');

  const apiKey = inputEl.value;
  if (apiKey.length !== 16) {
    inputEl.style.border = `2px solid ${red}`;
    submitBtnEl.disabled = true;
    return;
  }
  setApiKey(apiKey);
  dismountBustrForm();
  window.location.reload();
}

function inputValidatorCallback(event) {
  const inputEl = document.querySelector('#bustr-form__input');
  const submitBtnEl = document.querySelector('#bustr-form__submit');
  console.log('value', inputEl.value); // TEST
  console.log('length', inputEl.value.length); // TEST
  if (event.target.value.length === 16) {
    submitBtnEl.disabled = false;
    inputEl.style.border = '1px solid #444';
  }
  if (event.target.value.length !== 16) {
    submitBtnEl.disabled = true;
  }
}

async function successfulBustMutationCallback(mutationList, observer) {
  console.log('MUTATION OBSERVER'); // TEST
  for (const mutation of mutationList) {
    if (
      mutation.target.innerText.match(/^(You busted ).+/) &&
      mutation.removedNodes.length > 0
    ) {
      observer.disconnect();
      console.log('successful bust! Timestamp: ', Date.now()); // TEST
      addOneTimestampsArray(Math.floor(Date.now() / 1000));
      await loadController();
      successfulBustUpdateController();
    }
  }
}

//// Mutation Observers
const jailObserverConfig = {
  attributes: false,
  childList: true,
  subtree: true,
};

function createJailMutationObserver() {
  console.log('CREATE JAIL MUTATION OBSERVER'); // TEST
  const jailObserver = new MutationObserver(successfulBustMutationCallback);
  jailObserver.observe(
    document.querySelector('ul.users-list'),
    jailObserverConfig
  );
}

////////  MODEL ////////
////  Getters and Setters
function setGlobalBustrState(newState) {
  GLOBAL_BUSTR_STATE = { ...GLOBAL_BUSTR_STATE, ...newState };
  localStorage.setItem('globalBustrState', JSON.stringify(GLOBAL_BUSTR_STATE));
  saveGlobalBustrState();
  console.log('STATE!!! ', GLOBAL_BUSTR_STATE); // TEST
}
function getGlobalBustrState() {
  return GLOBAL_BUSTR_STATE;
}
function loadGlobalBustrState() {
  if (!localStorage.getItem('globalBustrState')) return;
  const loadedState = JSON.parse(localStorage.getItem('globalBustrState'));
  GLOBAL_BUSTR_STATE = { ...GLOBAL_BUSTR_STATE, ...loadedState };
  return localStorage.getItem('globalBustrState');
}
function saveGlobalBustrState() {
  localStorage.setItem(
    'globalBustrState',
    JSON.stringify(getGlobalBustrState())
  );
}
function deleteGlobalBustrState() {
  GLOBAL_BUSTR_STATE = {
    userSettings: {
      reminderLimits: {
        redLimit: 0,
        greenLimit: 3,
      },
    },
    penaltyScore: 0,
    penaltyThreshold: 0,
    availableBusts: 0,
    timestampsArray: [],
  };
  localStorage.removeItem('bustrGlobalState');
}

function getMyViewportWidthType() {
  width = visualViewport.width;
  console.log('GET MY DEVICE', width); // TEST

  return width > 1000 ? 'Desktop' : 'Mobile';
}

function setApiKey(apiKey) {
  console.log('SET API KEY', apiKey); // TEST
  localStorage.setItem('bustrApiKey', JSON.stringify(apiKey));
}
function getApiKey() {
  console.log('GET API KEY'); // TEST

  if (isPDA()) return PDA_API_KEY;

  if (!localStorage.getItem('bustrApiKey')) return;

  return JSON.parse(localStorage.getItem('bustrApiKey'));
}

function deleteApiKey() {
  localStorage.removeItem('bustrApiKey');
}

function setUserSettings(newUserSettings, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newState = { ...currentState, userSettings: newUserSettings };
  setGlobalBustrState(newState);
}
function getUserSettings() {
  console.log('GET USER SETTINGS'); // TEST
  return getGlobalBustrState().userSettings;
}

function setRenderedView(newRenderedView, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newState = { ...currentState, renderedView: newRenderedView };
  setGlobalBustrState(newState);
}
function getRenderedView(newRenderedView, currentState) {
  return getGlobalBustrState().renderedView;
}

function setTimestampsArray(newTimestampsArr, currentState) {
  currentState = currentState || getGlobalBustrState();

  return setGlobalBustrState({
    ...currentState,
    timestampsArray: newTimestampsArr,
  });
}
function addOneTimestampsArray(timestamp, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newTimestampsArr = [timestamp, ...currentState.timestampsArray];
  console.log(
    'old TSA: ',
    currentState.timestampsArray.length,
    'new TSA: ',
    newTimestampsArr.length,
    newTimestampsArr
  ); // TEST
  setTimestampsArray(newTimestampsArr);
}
function getTimestampsArray() {
  return getGlobalBustrState().timestampsArray;
}

function setLastFecthTimestampMs(currentState) {
  currentState = currentState || getGlobalBustrState();

  const currentTimestampMs = Date.now();
  setGlobalBustrState({
    ...currentState,
    lastFetchTimestampMs: currentTimestampMs,
  });
}
function getLastFecthTimestampMs() {
  return getGlobalBustrState().lastFetchTimestampMs;
}

function setPenaltyThreshold(newPenaltyThreshold, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newState = { ...currentState, penaltyThreshold: newPenaltyThreshold };
  setGlobalBustrState(newState);
}
function getPenaltyThreshold() {
  return getGlobalBustrState().penaltyThreshold;
}

function setPenaltyScore(newPenaltyScore, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newState = { ...currentState, penaltyScore: newPenaltyScore };
  setGlobalBustrState(newState);
}
function getPenaltyScore() {
  return getGlobalBustrState().penaltyScore;
}

function setAvailableBusts(newAvailableBusts, currentState) {
  currentState = currentState || getGlobalBustrState();

  const newState = { ...currentState, availableBusts: newAvailableBusts };
  setGlobalBustrState(newState);
}
function getAvailableBusts() {
  return getGlobalBustrState().availableBusts;
}

////////  VIEW  ////////
////  Stylesheet
const bustrStylesheetHTML = `<style>
    .bustr--green {
      --color: ${green}
    }
    .bustr--orange {
      --color: ${orange}
    }
    .bustr--red {
      --color: ${red}
    }
    .dark-mode.bustr--green,
    .bustr--green .swiper-slide {
      --color: ${greenLight}
    }
    .dark-mode.bustr--orange,
    .bustr--orange .swiper-slide {
      --color: ${orangeLight}
    }
    .dark-mode.bustr--red,
    .bustr--red .swiper-slide {
      --color: ${redLight}
    }
    #bustr-form.header-wrapper-top {
      display: flex;
    }
    #bustr-form.header-wrapper-top .container {
      display: flex;
      justify-content: start;
      align-items: center;
      pading-left: 20px;
    }

    #bustr-form.header-wrapper-top h2 {
      display: block;
      text-align: center;
      margin: 0;
      width: 172px;
    }

    #bustr-form.header-wrapper-top input {
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
    #bustr-form.header-wrapper-top a {
      margin: 0 8px;
    }

    #nav-jail .bustr-stats,
    #bustr-context .bustr-stats {
      color: var(--color, inherit);
    }
    #nav-jail .bustr-stats span {
      margin-left: unset;
    }

    #bustr-context.contextMenu___bjhoL {
      display: none;
      left: unset;
      right: -92px;
      padding: 0 8px;
    }
    .contextMenuActive___e6i_B #bustr-context.contextMenu___bjhoL {
      display: flex;
    }
    #bustr-context.contextMenu___bjhoL .arrow___tKP13 {
      right: unset;
      left: -6px;
      border-width: 8px 6px 8px 0;
      border-color: transparent #444 transparent transparent;
    }
    #bustr-context.contextMenu___bjhoL .arrow___tKP13:before {
      border-color: transparent #373636 transparent transparent;
      border-width: 6px 5px 6px 0;
      content: "";
      left: unset;
      right: -6px;
      top: -6px;
    }

    @media screen and (max-width:1000px) {
      #bustr-form.header-wrapper-top h2 {
        width: 148px;
      }
      #bustr-form.header-wrapper-top input {
        margin-left: 10px;
      }
    }
    @media screen and (max-width:784px) {
      #bustr-form.header-wrapper-top h2 {
        font-size: 16px;
        width: 80px;
      }
    }
    </style>`;
function renderBustrStylesheet() {
  console.log('RENDER STYLESHEET'); // TEST

  const headEl = document.querySelector('head');
  headEl.insertAdjacentHTML('beforeend', bustrStylesheetHTML);
}

function renderBustrColorClass(availableBusts) {
  console.log('RENDER BUSTER COLOR'); // TEST
  console.log('userSettings', getUserSettings()); // TEST

  const navJailEl = document.querySelector('#nav-jail');

  if (+availableBusts <= getUserSettings().reminderLimits.redLimit) {
    document.body.classList.add('bustr--red');
    return;
  }

  if (+availableBusts >= getUserSettings().reminderLimits.greenLimit) {
    document.body.classList.add('available___ZS04X', 'bustr--green');
    return;
  }

  if (
    availableBusts > getUserSettings().reminderLimits.redLimit &&
    availableBusts < getUserSettings().reminderLimits.greenLimit
  ) {
    document.body.classList.add('bustr--orange');
  }
}
//// Init form view
function renderBustrForm() {
  console.log('RENDER BUSTR FORM'); // TEST
  const topHeaderBannerEl = document.querySelector('#topHeaderBanner');
  const bustrFormHTML = `
      <div id="bustr-form" class="header-wrapper-top">
        <div class="container clear-fix">
          <h2>Bustr API</h2>
          <input
            id="bustr-form__input"
            type="text"
            placeholder="Enter a full-acces API key..."
          />
          <a href="#" id="bustr-form__submit"  type="btn" disabled><span class="link-text">Submit</span</button>
        </div>
      </div>`;

  topHeaderBannerEl.insertAdjacentHTML('afterbegin', bustrFormHTML);
}

// function renderJailIcon() {
//   console.log('REPLACE JAIL ICON'); // TEST
//   const fill = 'url(#sidebar_svg_gradient_regular_green_mobile';

//   const jailIconEl = document.querySelector('#nav-jail svg');
//   const jailIconContainerEl =
//     document.querySelector('#nav-jail svg').parentElement;

//   const greenJailHTML = `
//       <svg xmlns="http://www.w3.org/2000/svg" class="default___XXAGt " filter fill="${fill}" stroke="transparent" stroke-width="0" width="17" height="17" viewBox="0 1 17 17">
//         <path d="M11.56,1V18h2V1Zm-5,12.56h4v-2h-4ZM0,13.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5Zm-8-6h4v-2h-4ZM0,7.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5ZM3.56,1V18h2V1Z" filter="url(#svg_sidebar_mobile)"></path>
//         <path d="M11.56,1V18h2V1Zm-5,12.56h4v-2h-4ZM0,13.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5Zm-8-6h4v-2h-4ZM0,7.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5ZM3.56,1V18h2V1Z"></path>
//       </svg>`;

//   jailIconEl.remove();
//   jailIconContainerEl.insertAdjacentHTML('afterbegin', greenJailHTML);
// }

function renderBustrStats(statsObj) {
  for (const [key, value] of Object.entries(statsObj)) {
    const statsElArr = [...document.querySelectorAll(`.bustr-stats__${key}`)];
    statsElArr.forEach((el) => (el.textContent = value));
  }
}

//// Desktop view
function renderBustrDesktopView() {
  console.log('RENDER DESKTOP STATS'); // TEST

  const jailLinkEl = document.querySelector('#nav-jail a');
  const statsHTML = `
      <span class="amount___p8QZX bustr-stats">
        <span class="bustr-stats__penaltyScore">#</span> / <span class="bustr-stats__penaltyThreshold">#</span> : <span class="bustr-stats__availableBusts">#</span>
      </span>`;

  jailLinkEl.insertAdjacentHTML('beforeend', statsHTML);
}

//// Mobile view
function renderMobileBustrNotification() {
  console.log('READYSTATE', document.readyState); // TEST
  const navJailLinkEl = document.querySelector('#nav-jail a');
  console.log('NAVJAILLINKEL', navJailLinkEl); // TEST
  const notificationHTML = `
  <div class="mobileAmount___ua3ye bustr-stats"><span class="bustr-stats__availableBusts">#</span></div>`;

  navJailLinkEl.insertAdjacentHTML('beforebegin', notificationHTML);
  console.log('READYSTATE', document.readyState); // TEST
}

function renderBustrMobileView() {
  console.log('RENDER MOBILE VIEW'); // TEST
  renderMobileBustrNotification();

  const bustrContextMenuHTML = `
      <div id="bustr-context" class='contextMenu___bjhoL bustr-context-menu'>
        <span class='linkName___FoKha bustr-stats'>
        <span class="bustr-stats__penaltyScore">#</span> / <span class="bustr-stats__penaltyThreshold">#</span> : <span class="bustr-stats__availableBusts">#</span>
        </span>
        <span class='arrow___tKP13 bustr-arrow'></span>
      </div>`;

  const navJailEl = document.querySelector('#nav-jail');
  navJailEl.insertAdjacentHTML('afterend', bustrContextMenuHTML);
}

function dismountBustrForm() {
  document.querySelector('#bustr-form').remove();
}

////////  CONTROLLERS  ////////
function initController() {
  try {
    console.log('INIT CONTROLLER'); // TEST

    // render stylesheet
    renderBustrStylesheet();

    // check if apiKey is saved
    // if saved exit function
    console.log('PDA API KEY', PDA_API_KEY); // TEST
    console.log('IS API KEY FALSE', !getApiKey()); // TEST
    if (isPDA() && !getApiKey()) {
      console.log('🤓 SETTING PDA API KEY'); // TEST
      setApiKey(PDA_API_KEY);
    }

    if (getMyViewportWidthType() === 'Desktop') {
      renderBustrDesktopView();
      setRenderedView('Desktop');
    }
    if (getMyViewportWidthType() === 'Mobile') {
      renderBustrMobileView();
      setRenderedView('Mobile');
    }

    if (getApiKey()) return;

    // if not saved render bustr form
    renderBustrForm();

    // set event liseners
    //// Event listeners
    document
      .querySelector('#bustr-form__submit')
      .addEventListener('click', submitFormCallback);
    document
      .querySelector('#bustr-form__input')
      .addEventListener('input', inputValidatorCallback);
    document
      .querySelector('#bustr-form__input')
      .addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
          submitFormCallback();
        }
      });
  } catch (err) {
    console.error(err); // TEST
  }
}

//// load
async function loadController() {
  try {
    // guard clause if no api key
    console.log('LOAD GUARD'); // TEST
    if (!getApiKey()) return;

    if (loadGlobalBustrState()) {
      loadGlobalBustrState();
    }

    // fetch data
    if (
      getTimestampsArray().length === 0 ||
      Date.now() - getLastFecthTimestampMs() > 1000 * 60 * 10 ||
      !getLastFecthTimestampMs()
    ) {
      console.log('fetching data'); // TEST
      const data = await fetchBustsData(getApiKey());
      setTimestampsArray(createTimestampsArray(data));
    }

    const statsObj = calcBustrStats(getTimestampsArray());
    setPenaltyScore(statsObj.penaltyScore);
    setPenaltyThreshold(statsObj.penaltyThreshold);
    setAvailableBusts(statsObj.availableBusts);

    // render color class
    renderBustrColorClass(getAvailableBusts());

    // render stats
    renderBustrStats(statsObj);
  } catch (err) {
    // deleteApiKey();
    console.error(err); // TEST
  }
}

function successfulBustUpdateController() {
  // update after a successful bust
  console.log('AUTO UPDATE CONTROLLER'); // TEST
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  if (origin + pathname === 'https://www.torn.com/jailview.php') {
    createJailMutationObserver();
  }
}

function refreshStatsController() {
  setInterval(async () => {
    await loadController();
  }, 30000);
}

function viewportResizeController() {
  visualViewport.addEventListener('resize', async (e) => {
    console.log(e.target); // TEST
    if (!getRenderedView()) return;

    const viewportWidthType = getMyViewportWidthType();
    if (viewportWidthType !== getRenderedView()) {
      initController();
      await loadController();
    }
  });
}

//// Promise race conditions
// necessary as PDA scripts are inject after window.onload

const PDAPromise = new Promise((res, rej) => {
  if (document.readyState === 'complete') res();
  // setTimeout(() => res(), 2000);
});

const browserPromise = new Promise((res, rej) => {
  window.addEventListener('load', () => res());
});

(async function () {
  console.log(document.readyState); // TEST
  await Promise.race([PDAPromise, browserPromise]);
  initController();
  await loadController();
  successfulBustUpdateController();
  refreshStatsController();
  viewportResizeController();
})();
