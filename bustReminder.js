/** @format */

// ==UserScript==
// @name         BUSTR: Busting Reminder + PDA
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0
// @description  Guess how many busts you can do without getting jailed
// @author       Adobi & Ironhydedragon
// @match        https://www.torn.com/*
// @license      MIT
// ==/UserScript==
console.log('😎 START!!!!'); // TEST

////////  GLOBAL VARIABLES
let GLOBAL_BUST_STATE = {
  userSettings: {
    reminderLimits: {
      redLimit: 0,
      greenLimit: 3,
    },
  },
  penaltyScore: 0,
  penaltyThreshold: 0,
  availableBusts: 0,
  myDevice: undefined,
  isInit: false,
};

const PDA_API_KEY = '###PDA-APIKEY###';
const isPDA = !/^(###).+(###)$/.test(PDA_API_KEY);

////////  UTILS FUNCTIONS

function createTimestampsArray(data) {
  console.log('CREATE TIMESTAMPS'); // TEST
  let timestamps = [];

  for (const entry in data.log) {
    timestamps.push(data.log[entry].timestamp);
    console.log('entry', entry); // TEST
  }

  console.log('ts-data', data); // TEST
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

function calcPenaltyThreshold(timestampArray) {
  console.log('CALC PT'); // TEST
  const period = 24 * 60 * 60 * 3;
  let longestSequence = 0;
  let currentSequence = 1;
  let currentMin = timestampArray[0];
  let currentMax = timestampArray[0];
  let firstTimestamp;

  for (let i = 1; i < timestampArray.length; i++) {
    const TS = timestampArray[i];
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
  for (let i = 0; i < timestampArray.length - longestSequence; i++) {
    let score = 0;
    let localScore = 0;
    const initial_timestamp = timestampArray[i];
    for (let j = 0; j < longestSequence; j++) {
      const hours = (initial_timestamp - timestampArray[i + j]) / 60 / 60;
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
    let error = null;

    const url = `https://api.torn.com/user/?selections=log&log=5360&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('data', data); // TEST
    if (data.error) {
      throw new Error(data.error);
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

////////  MODEL ////////
////  Getters and Setters
function setGlobalBustState(newState) {
  GLOBAL_BUST_STATE = { ...GLOBAL_BUST_STATE, ...newState };
}
function getGlobalBustState() {
  return GLOBAL_BUST_STATE;
}
function deleteGlobalBustState() {
  GLOBAL_BUST_STATE = {
    userSettings: {},
    penaltyScore: 0,
    penaltyThreshold: 0,
    availableBusts: 0,
    myDevice: undefined,
  };
  localStorage.removeItem('bustrApiKey');
}

// function setReminderLimits(limitsObj, currentState) {
//   currentState = currentState || getGlobalBustState();
//   const redLimit =
//     limitsObj.redLimit || currentState.userSettings.reminderLimits.red;
//   const greenLimit =
//     limitsObj.greenLimit || currentState.userSettings.reminderLimits.green;

//   const newReminderLimits = {
//     ...currentState.userSettings.reminderLimits,
//     redLimit,
//     greenLimit,
//   };

//   GLOBAL_BUST_STATE = {
//     ...currentState,
//     userSettings: {
//       ...currentState.userSettings,
//       reminderLimits: newReminderLimits,
//     },
//   };
// }

// function getReminderLimits() {
//   return GLOBAL_BUST_STATE.userSettings.reminderLimits;
// }

// function setIsInit(bool = false, currentState) {
//   console.log('SET IS INIT'); // TEST
//   currentState = currentState || getGlobalBustState();

//   GLOBAL_BUST_STATE = { ...GLOBAL_BUST_STATE, isInit: bool };
// }
// function getIsInit(bool = false, currentState) {
//   console.log('GET IS INIT'); // TEST
//   return GLOBAL_BUST_STATE.isInit;
// }

// function setMyDeviceType(width, currentState) {
//   // console.log('SET MY DEVICE'); // TEST
//   width = width || window.innerWidth;
//   currentState = currentState || getGlobalBustState();

//   const myDeviceType = width > 1000 ? 'Desktop' : 'Mobile';

//   const newState = { ...currentState, myDevice: myDeviceType };
//   setGlobalBustState(newState);
// }
function getMyDeviceType() {
  const width = window.innerWidth;
  return width > 1000 ? 'Desktop' : 'Mobile';
}

function setApiKey(apiKey) {
  console.log('SET API KEY'); // TEST
  localStorage.setItem('bustrApiKey', JSON.stringify(apiKey));
}
function getApiKey() {
  console.log('GET API KEY'); // TEST
  if (!localStorage.getItem('bustrApiKey')) return;
  return JSON.parse(localStorage.getItem('bustrApiKey'));
}
function deleteApiKey() {
  localStorage.removeItem('bustrApiKey');
}

function setUserSettings(newUserSettings, currentState) {
  currentState = currentState || getGlobalBustState();

  const newState = { userSettings: newUserSettings, ...currentState };
  setGlobalBustState(newState);
}
function getUserSettings() {
  console.log('GET USER SETTINGS'); // TEST
  return getGlobalBustState().userSettings;
}

function setPenaltyThreshold(newPenaltyThreshold, currentState) {
  currentState = currentState || getGlobalBustState();

  const newState = { ...currentState, penaltyThreshold: newPenaltyThreshold };
  setGlobalBustState(newState);
}
function getPenaltyThreshold() {
  return getGlobalBustState().penaltyThreshold;
}

function setPenaltyScore(newPenaltyScore, currentState) {
  currentState = currentState || getGlobalBustState();

  const newState = { ...currentState, penaltyScore: newPenaltyScore };
  setGlobalBustState(newState);
}
function getPenaltyScore() {
  return getGlobalBustState().penaltyScore;
}

function setAvailableBusts(newAvailableBusts, currentState) {
  currentState = currentState || getGlobalBustState();

  const newState = { ...currentState, availableBusts: newAvailableBusts };
  setGlobalBustState(newState);
}
function getAvailableBusts() {
  return getGlobalBustState().availableBusts;
}

////////  VIEW  ////////
////  Colors
const red = '#fa8e8e';
const greenLight = '#85b200'; // Icon Color
const green = ''; // link color
const white = 'rgb(51, 51, 51)';

////  Stylesheet
const bustrStylesheetHTML = `<style>
    
  </style>`;
function renderBustrStylesheet() {
  console.log('RENDER STYLESHEET'); // TEST

  const headEl = document.querySelector('head');
  headEl.insertAdjacentHTML('beforeend', bustrStylesheetHTML);
}

////  render style classes
function renderBustrClass() {
  console.log('RENDER BUSTR CLASS'); // TEST

  const bodyEl = document.querySelector('body');
  bodyEl.classList.add('bustr');
}
function renderBustrColorClasses(availableBusts) {
  console.log('RENDER BUSTER COLOR'); // TEST

  const navJailEl = document.querySelector('#nav-jail');

  if (availableBusts < 1) {
    navJailEl.classList.add('bustr--red');
  }
  if (availableBusts >= 1) {
    navJailEl.classList.add('available___ZS04X');
  }
}

function renderJailIcon(availableBusts) {
  console.log('REPLACE JAIL ICON'); // TEST
  let fill =
    availableBusts <= 0
      ? red
      : 'url(#sidebar_svg_gradient_regular_green_mobile';
  const jailIconEl = document.querySelector('#nav-jail svg');
  const jailIconContainerEl =
    document.querySelector('#nav-jail svg').parentElement;

  const greenJailHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="default___XXAGt " filter fill="${fill}" stroke="transparent" stroke-width="0" width="17" height="17" viewBox="0 1 17 17">
        <path d="M11.56,1V18h2V1Zm-5,12.56h4v-2h-4ZM0,13.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5Zm-8-6h4v-2h-4ZM0,7.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5ZM3.56,1V18h2V1Z" filter="url(#svg_sidebar_mobile)"></path>
        <path d="M11.56,1V18h2V1Zm-5,12.56h4v-2h-4ZM0,13.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5Zm-8-6h4v-2h-4ZM0,7.56H2.56v-2H0Zm14.56,0h2.5v-2h-2.5ZM3.56,1V18h2V1Z"></path>
      </svg>`;

  jailIconEl.remove();
  jailIconContainerEl.insertAdjacentHTML('afterbegin', greenJailHTML);
}

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
      <span class="bustr-stats__penaltyScore">#</span>/<span class="bustr-stats__penaltyThreshold">#</span>:<span class="bustr-stats__availableBusts">#</span>
    </span>`;

  jailLinkEl.insertAdjacentHTML('beforeend', statsHTML);
}

//// Mobile view
function renderMobileBustrNotification() {
  const navJailLinkEl = document.querySelector('#nav-jail a');
  const notificationHTML = `
      <div class="mobileAmount___ua3ye bustr-notification"><span class="bustr-stats__availableBusts">#</span></div>`;

  navJailLinkEl.insertAdjacentHTML('beforebegin', notificationHTML);
}

function renderBustrMobileView() {
  console.log('RENDER MOBILE STATS'); // TEST

  const bustrContextMenuHTML = `
    <div id="bustr-context" class='contextMenu___bjhoL bustr-context-menu'>
      <span class='linkName___FoKha bustr-stats'>
      <span class="bustr-stats__penaltyScore">#</span> / <span class="bustr-stats__penaltyThreshold">#</span> : <span class="bustr-stats__availableBusts">#</span>
      </span>
      <span class='arrow___tKP13 bustr-arrow'></span>
    </div>`;

  const navJailEl = document.querySelector('#nav-jail');
  navJailEl.insertAdjacentHTML('afterend', bustrContextMenuHTML);

  renderMobileBustrNotification();
}

//// Init form view
function renderInitForm() {
  const contentTitleEl = document.querySelector('.content-title');
  const initFormHTML = `
        <span id="bustr-init-form" class="left">
          <input id="bustr-init-form__input" type="text" placeholder="Please enter a full-acces API key" />
          <button id="bustr-init-form__submit" type='btn' disabled>Submit</button>
        </span>`;

  contentTitleEl.children[0].insertAdjacentHTML('afterend', initFormHTML);
}
function dismountInitForm() {
  document.querySelector('#bustr-init-form').remove();
}

////////  CONTROLLER  ////////
//// Callback functions
function submitFormCallback() {
  const inputEl = document.querySelector('#bustr-init-form__input');
  const submitBtnEl = document.querySelector('#bustr-init-form__submit');

  const apiKey = inputEl.value;
  if (apiKey.length !== 16) {
    inputEl.style.border = `2px solid ${red}`;
    submitBtnEl.disabled = true;
    return;
  }
  setApiKey(apiKey);

  dismountInitForm();

  window.location.reload();
}

function inputValidatorCallback(event) {
  const inputEl = document.querySelector('#bustr-init-form__input');
  const submitBtnEl = document.querySelector('#bustr-init-form__submit');
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
//// Event listeners

//// Init
function controlInit() {
  // guard clause if an api key
  if (isPDA) return setApiKey(PDA_API_KEY);
  if (getApiKey()) return;

  // if no api key, render 'init form'
  renderInitForm();

  // listen for submit and change events
  document
    .querySelector('#bustr-init-form__input')
    .addEventListener('input', inputValidatorCallback);
  document
    .querySelector('#bustr-init-form__submit')
    .addEventListener('click', submitFormCallback);
}

//// Load
async function controlLoadBustr() {
  try {
    if (!getApiKey()) return;

    //  renderStylesheet
    renderBustrStylesheet();
    //  if mobile, render mobile view
    if (getMyDeviceType() === 'Mobile') {
      renderBustrMobileView();
    }

    //  if desktop, do desktop renders
    if (getMyDeviceType() === 'Desktop') {
      renderBustrDesktopView();
    }
    //  get data
    const data = await fetchBustsData(getApiKey());

    // create timestamps
    const timestampsArr = createTimestampsArray(data);

    // calc stats
    const stats = calcBustrStats(timestampsArr);

    // render stats
    renderBustrStats(stats);

    // render styling classes
    renderBustrClass();
    renderBustrColorClasses();

    // render jail icon
    renderJailIcon();
  } catch (err) {
    console.error(err); // TEST
    alert(
      `ERROR: ${err.error}\nYou will need to reload the page and enter a vaild full acces API Key`
    );
    deleteApiKey();
  }
}

(async function () {
  try {
    controlInit();
    await controlLoadBustr();
  } catch (err) {
    console.error(err); // TEST
  }
})();
