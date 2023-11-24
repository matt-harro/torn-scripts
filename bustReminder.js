/** @format */

// ==UserScript==
// @name         BUSTR: Busting Reminder + PDA
// @namespace    http://torn.city.com.dot.com.com
// @version      0.2.4
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
    statsRefreshRate: 30,
    refetchRate: 10,
    customPenaltyThreshold: 0,
    quickBust: true,
    quickBail: false,
    showHardnessScore: true,
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
      if (data.error.error === 'Incorrect key' || data.error.error === 'Access level of this key is not high enough') {
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

// async function successfulBustFromMiniProfileMutationCallback(
//   mutationList,
//   observer
// ) {
//   try {
//     console.log('MUTATION OBSERVER'); // TEST
//     for (const mutation of mutationList) {
//       if (!mutation.target.innerText) return;
//       if (
//         mutation.target.innerText.match(/^(You busted ).+/) &&
//         mutation.addedNodes.length == 4
//       ) {
//         console.log('4️⃣ addedNodes'); // TEST
//       }
//       if (mutation.target.innerText.match(/^(You busted ).+/)) {
//         console.log('💪', mutation); // TEST
//         observer.disconnect();
//         console.log('successful bust! Timestamp: ', Date.now()); // TEST
//         addOneTimestampsArray(Math.floor(Date.now() / 1000));
//         await loadController();
//         successfulBustUpdateController();
//       }
//     }
//   } catch (err) {
//     console.error(err); // TEST
//   }
// }
async function successfulBustMutationCallback(mutationList, observer) {
  try {
    for (const mutation of mutationList) {
      console.log('MUTATION OBSERVER'); // TEST
      if (!mutation.target.innerText) return;
      if (mutation.target.innerText.match(/^(You busted ).+/) && mutation.removedNodes.length > 0) {
        console.log('💪🏾', mutation); // TEST
        observer.disconnect();
        console.log('successful bust! Timestamp: ', Date.now()); // TEST
        addOneTimestampsArray(Math.floor(Date.now() / 1000));
        await loadController();
        successfulBustUpdateController();
      }
    }
  } catch (err) {
    console.error(err); // TEST
  }
}
// function createMiniProfileMutationObserver() {
//   console.log('CREATE JAIL MUTATION OBSERVER'); // TEST
//   const miniProfileObserver = new MutationObserver(
//     successfulBustFromMiniProfileMutationCallback
//   );
//   miniProfileObserver.observe(document, {
//     attributes: false,
//     childList: true,
//     subtree: true,
//   });
// }

function createJailMutationObserver() {
  console.log('CREATE JAIL MUTATION OBSERVER'); // TEST
  const jailObserver = new MutationObserver(successfulBustMutationCallback);
  jailObserver.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
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
  localStorage.setItem('globalBustrState', JSON.stringify(getGlobalBustrState()));
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
  let width = visualViewport.width;
  console.log('GET MY DEVICE', width); // TEST

  if (width > 1000) return 'Desktop';
  if (width < 1000 || width) return 'Mobile';
  throw new Error('Visual viewport not loaded');
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
  console.log('old TSA: ', currentState.timestampsArray.length, 'new TSA: ', newTimestampsArr.length, newTimestampsArr); // TEST
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
  .bg-gradient--green{
    --gradient-green: linear-gradient(to bottom, rgba(143, 113, 113, 1) 0, rgba(92, 62, 62, 1) 100%);
  }

  #bustr-form.header-wrapper-top {
    display: flex;
  }
  #bustr-form.header-wrapper-top .container {
    display: flex;
    justify-content: start;
    align-items: center;
    padding-left: 20px;
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

  #prefs-tab-menu #bustr-settings {
    display: none;
  }
  #prefs-tab-menu #bustr-settings.active {
    display: block;
  }
  #bustr-settings input[type="number"] {
    height: 24px;
    width: 48px;
    padding: 1px 5px;
    text-align: center;
  }

  #bustr-settings-dropdown:hover {
    background: #fff;
  }
  .dark-mode #prefs-tab-menu #bustr-settings-dropdown:hover {
    background: #444;
  }
  #prefs-tab-menu #bustr-settings-sidetab.active {
    background: #fff;
    color: #999
  }
  .dark-mode #prefs-tab-menu #bustr-settings-sidetab.active {
    background: #444;
    color: #999
  }

  #body .users-list-title {
    display: flex;
    justify-content: start;
    align-items: center;
  }
  #body .users-list-title .title{
    width: 269px;
  }
  #body .users-list-title .time{
    width: 50px;
  }
  #body .users-list-title .level{
    width: 53px;
  }
  #body .users-list-title .reason{
    width: 205px;
  }
  #body .users-list-title .hardness{
    display: block;
    width: 79px;
    text-align: center;
  }

  #body .user-info-list-wrap > li .info-wrap .hardness {
    display: block; 
    text-align: center;
  }
  #body .user-info-list-wrap > li .info-wrap .hardness span.title {
    display: none;
  }

  #body .user-info-list-wrap {
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
  }
  #body .user-info-list-wrap > li  {
    display: flex; 
    flex-wrap: wrap; 
    justify-content: start; 
    align-items: center;
  }

  #body .user-info-list-wrap > li .info-wrap {
    display: flex; 
    flex-wrap: wrap;
    justify-content: start; 
    align-items: center;
  }
  #body .user-info-list-wrap > li .info-wrap .time {
    width: 54px;
  }
  #body .user-info-list-wrap > li .info-wrap .level {
    width: 57px;
  }
  #body .user-info-list-wrap > li .info-wrap .reason {
    width: 193px;
  }
  #body .user-info-list-wrap > li .info-wrap .hardness {
    width: 50px;
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
    #body .users-list-title .hardness{
      display: none;
    }
    #body .user-info-list-wrap > li .info-wrap .hardness span.title{
      display: block;
    }
    #body .user-info-list-wrap > li .info-wrap .reason {
      width: 164px;
      border-right: 1px solid rgb(34, 34, 34);
    }
    #body .user-info-list-wrap > li .info-wrap .hardness {
      width: 64px;
    }
  }
    @media screen and (max-width:386px) {
      
      #body .user-info-list-wrap > li .info-wrap .time {
        width: 98px;
        height: 37px;
      }
      #body .user-info-list-wrap > li .info-wrap .level {
        width: 91px;
        height: 37px;
      }
      #body .user-info-list-wrap > li .info-wrap .reason {
        width: 171px;
        height: 24px;
        border-right: 1px solid rgb(34, 34, 34);
      }
      #body .user-info-list-wrap > li .info-wrap .hardness {
        width: 107px;
      }
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

  if (availableBusts > getUserSettings().reminderLimits.redLimit && availableBusts < getUserSettings().reminderLimits.greenLimit) {
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

function dismountBustrForm() {
  document.querySelector('#bustr-form').remove();
}

function renderBustrSettingsTabs() {
  console.log('RENDER SETTINGS TABS'); // TEST
  const sideMenuTabsElArr = [...document.querySelectorAll('#prefs-tab-menu .headers li')];
  const dropdownCategoriesBtn = document.querySelector('#categories-button');
  const dropdownMenuListEl = document.querySelector('ul.ui-selectmenu-menu-dropdown');
  const prefsTitle = document.querySelector('.prefs-tab-title');
  const prefsContentArr = [...document.querySelectorAll('.prefs-cont')];

  const bustrSettingsSideTabHTML = `
    <li class="delimiter"></li>
    <li id="bustr-settings-sidetab" class="c-pointer ui-state-default ui-corner-top ui-tabs-active" data-title-name="Change your general settings" role="tab" tabindex="0" aria-controls="settings" aria-labelledby="ui-id-2" aria-selected="true">
      <a class="t-gray-6 bold h settings ui-tabs-anchor" href="#settings" role="presentation" tabindex="-1" id="bustr-settings-sidetab__link" i-data="i_192_87_149_34">Bustr settings</a>
    </li>
    `;

  const bustrSettingsDropdownTabHTML = `
  <li role="presentation" id='bustr-settings-dropdown'>
    <a href="#nogo" tabindex="-1" role="option" aria-selected="false" id="bustr-dropdown__select">Bustr settings</a>
  </li>`;

  sideMenuTabsElArr[6].insertAdjacentHTML('afterend', bustrSettingsSideTabHTML);

  dropdownMenuListEl.insertAdjacentHTML('afterbegin', bustrSettingsDropdownTabHTML);
  dropdownCategoriesBtn.addEventListener('click', () => {
    console.log('👶🏻', dropdownMenuListEl.children); // TEST
    const busterDropdownIsChild = [...dropdownMenuListEl.children].filter((child) => child.id === 'bustr-settings-dropdown');
    if (!busterDropdownIsChild) {
      dropdownMenuListEl.insertAdjacentHTML('afterbegin', bustrSettingsDropdownTabHTML);
    }
  });

  const dropdownMenuItemsArr = [...dropdownMenuListEl.querySelectorAll('li')];
  // listeners for dropdown li click
  dropdownMenuItemsArr.forEach((li, i, arr) => {
    li.addEventListener('click', (e) => {
      if (li.id === 'bustr-settings-dropdown') {
        prefsContentArr.forEach((el) => {
          if (el.id !== 'bustr-settings') el.style.display = 'none';
        });
        document.querySelector('#bustr-settings').style.display = 'block';
        arr.forEach((li) => li.classList.remove(''));
        dropdownCategoriesBtn.textContent = 'Bustr settings';
        prefsTitle.textContent = 'Change your bust reminder settings';
      }
      if (li.id !== 'bustr-settings-dropdown') {
        document.querySelector('#bustr-settings').classList.remove('active');
        document.querySelector('#bustr-settings').style.display = 'none';
      }
    });
    sideMenuTabsElArr.forEach((li, i, arr) => {
      li.addEventListener('click', (e) => {
        if (li.id === 'bustr-settings-sidetab') {
          prefsContentArr.forEach((el) => {
            if (el.id !== 'bustr-settings') el.style.display = 'none';
          });
          document.querySelector('#bustr-settings').style.display = 'block';
          arr.forEach((li) => li.classList.remove(''));
          dropdownCategoriesBtn.textContent = 'Bustr settings';
          prefsTitle.textContent = 'Change your bust reminder settings';
        }
        if (li.id !== 'bustr-settings-sidetab') {
          document.querySelector('#bustr-settings').classList.remove('active');
          document.querySelector('#bustr-settings').style.display = 'none';
        }
      });
    });
  });
  // if, #bustr-settings-dropdown
  // then, set other forms to display none, add active class to bustr form, set categores button innerText to bustr settings
  // if, not #bustr-settings-dropdown
  // then, remove active class from form
}

function renderBustrSettingsForm() {
  const prefsTabTitleEl = document.querySelector('.prefs-tab-title');
  prefsTabTitleEl.textContent = 'Change your bust reminder settings';

  const sideMenuTabsListEl = document.querySelector('#prefs-tab-menu .headers');
  // show tabs class : ui-tabs-active
  // active tab class : ui-state-active

  bustrSettingsFormHTML = `
    div id="bustr-settings" class="prefs-cont left ui-tabs-panel ui-widget-content ui-corner-bottom" aria-labelledby="ui-id-3" role="tabpanel" aria-expanded="true" aria-hidden="false">
        <div class="inner-block b-border-c t-border-f">
          <ul class="prefs-list small-select-menu-wrap">
            <li>
              <p class="m-bottom5">Custom Penalty Threshold:</p>
              <input type="number" name="customThreshold" id="bustr-custom-threshold" size="5" value="0" min="0" />
            </li>
          </ul>
        </div>
        <div class="inner-block b-border-c t-border-f">
          <ul class="prefs-list small-select-menu-wrap">
            <li>
              <p class="m-bottom5">Custom Penalty Threshold:</p>
              <input type="number" name="customThreshold" id="bustr-custom-threshold" size="5" value="0" min="0" />
            </li>
          </ul>
        </div>
        <div class="inner-block b-border-c t-border-f">
          <ul class="prefs-list attack-pref-block small-select-menu-wrap">
            <li role="radiogroup">
              <div class="title left">Quick Bust</div>
              <div class="choice-container left-position">
                <input id="quick-bust-on" class="radio-css" type="radio" name="quick-bust" value="true" checked="checked" />
                <label for="quick-bust-on" class="marker-css">On</label>
              </div>
              <div class="choice-container right-position">
                <input id="quick-bust-off" class="radio-css" type="radio" name="quick-bust" value="false" />
                <label for="quick-bust-off" class="marker-css">Off</label>
              </div>
              <div class="clear"></div>
            </li>
            <li role="radiogroup">
              <div class="title left">Quick Bail</div>
              <div class="choice-container left-position">
                <input id="quick-bail-on" class="radio-css" type="radio" name="quick-bail" value="true" checked="checked" />
                <label for="quick-bail-on" class="marker-css">On</label>
              </div>
              <div class="choice-container right-position">
                <input id="quick-bail-off" class="radio-css" type="radio" name="quick-bail" value="false" />
                <label for="quick-bail-off" class="marker-css">Off</label>
              </div>
              <div class="clear"></div>
            </li>
          </ul>
        </div>
        <div class="inner-block b-border-c t-border-f">
          <ul class="prefs-list small-select-menu-wrap">
            <li>
              <p class="m-bottom5">Red Limit:</p>
              <input type="number" name="redLimit" id="bustr-red-input" size="5" value="0" min="0" />
            </li>
            <li>
              <p class="m-top10 m-bottom5">Green Limit:</p>
              <input id="bustr-green-input" type="number" name="Red Limit" value="3" size="5" />
            </li>
          </ul>
        </div>
        <div class="inner-block b-border-c t-border-f">
          <ul class="prefs-list small-select-menu-wrap">
            <li>
              <p class="m-top10 m-bottom5">Stats Refresh Rate (seconds):</p>
              <input type="number" name="city" id="bustr-refresh-input" size="5" value="30" />
            </li>
            <li>
              <p class="m-top10 m-bottom5">API Refresh Rate (minutes):</p>
              <input type="number" name="API Refetch Rate" id="bustr-refetch-input" value="10" />
            </li>
          </ul>
        </div>
        <div class="inner-block t-border-f">
          <div class="btn-wrap silver">
            <div class="btn">
              <input class="torn-btn update" type="submit" value="SAVE" id="bustr-save-btn" />
            </div>
          </div>
        </div>
      </div>`;

  sideMenuTabsListEl.insertAdjacentHTML('afterend', bustrSettingsFormHTML);
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
  console.log('RENDER MOBILE NOTIFICATION'); // TEST
  const navJailLinkEl = document.querySelector('#nav-jail a');
  console.log('NAVJAILLINKEL', navJailLinkEl); // TEST
  const notificationHTML = `
  <div class="mobileAmount___ua3ye bustr-stats"><span class="bustr-stats__availableBusts">#</span></div>`;

  navJailLinkEl.insertAdjacentHTML('beforebegin', notificationHTML);
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

////////  CONTROLLERS  ////////
async function initController() {
  try {
    console.log('🙌 INIT CONTROLLER'); // TEST

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

    if (!visualViewport.width) {
      await new Promise((res) => {
        document.addEventListener('load', () => res());
      });
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
    document.querySelector('#bustr-form__submit').addEventListener('click', submitFormCallback);
    document.querySelector('#bustr-form__input').addEventListener('input', inputValidatorCallback);
    document.querySelector('#bustr-form__input').addEventListener('keyup', (event) => {
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
    if (getTimestampsArray().length === 0 || Date.now() - getLastFecthTimestampMs() > 1000 * 60 * 10 || !getLastFecthTimestampMs()) {
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

  // createMiniProfileMutationObserver();

  createJailMutationObserver();
}

function refreshStatsController() {
  setInterval(async () => {
    await loadController();
  }, 30000);
}

function viewportResizeController() {
  visualViewport.addEventListener('resize', async (e) => {
    if (!getRenderedView()) return;

    const viewportWidthType = getMyViewportWidthType();
    if (viewportWidthType !== getRenderedView()) {
      initController();
      await loadController();
    }
  });
}

function userSettingsController() {
  if (window.location.pathname !== '/preferences.php') return;
  renderBustrSettingsTabs();
  renderBustrSettingsForm();
}

function renderHardnessJailView() {
  const headingsContainerEl = document.querySelector('.users-list-title');
  const hardnessTitleHTML = `
    <span class="hardness title-divider divider-spiky">Hardness</span>`;
  headingsContainerEl.children[3].insertAdjacentHTML('afterend', hardnessTitleHTML);

  const playerRowsArr = [...document.querySelectorAll('.user-info-list-wrap > li')];
  playerRowsArr.forEach((el) => {
    const playerInfoContainerEl = el.querySelector('.info-wrap');
    const hardnessScoreHTML = `
      <span class="hardness reason">
        <span class="title bold">HARDNESS</span>
        <span class="bustr-hardness-score">#####</span>
      </span>`;
    playerInfoContainerEl.children[2].insertAdjacentHTML('afterend', hardnessScoreHTML);
  });
}

function getLevelJailDurationInfo(playerEl) {
  const levelEl = playerEl.querySelector('.level');
  const durationEl = playerEl.querySelector('.time');

  const level = +levelEl.innerText.match(/\d+/)[0];
  const hours = +durationEl.innerText.match(/\d+(?=h)/) || 0;
  const mins = +durationEl.innerText.match(/\d+(?=m)/) || 0;
  const durationInHours = hours + mins / 60;

  return [level, +durationInHours];
}

function calcHardnessScore(level, durationInHours) {
  return Math.floor(level * (durationInHours + 3));
}

function renderHardnessScore(playerEl, hardnessScore) {
  playerEl.querySelector('.bustr-hardness-score').textContent = hardnessScore;
}

function sortByHardnessScore(playerEl, hardnessScore) {
  playerEl.style.order = hardnessScore;
}

function mountJailPlayerCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    if (mutation.target.classList.contains('user-info-list-wrap') && mutation.addedNodes.length > 1) {
      hardnessScoreController();
      observer.disconnect();
    }
  }
}

function createMountJailPlayerOberserver() {
  const mountJailPlayerObserver = new MutationObserver(mountJailPlayerCallback);
  mountJailPlayerObserver.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

function hardnessScoreController() {
  if (window.location.pathname !== '/jailview.php') return;
  console.log('HARDNESSSCORECONTROLLER'); // TEST
  createMountJailPlayerOberserver();

  renderHardnessJailView();
  const playersArr = [...document.querySelectorAll('ul.user-info-list-wrap > li')];

  for (const playerEl of playersArr) {
    const [level, durationInHours] = getLevelJailDurationInfo(playerEl);
    const hardnessScore = calcHardnessScore(level, durationInHours);
    renderHardnessScore(playerEl, hardnessScore);
    sortByHardnessScore(playerEl, hardnessScore);
  }
}

//// Promise race conditions
// necessary as PDA scripts are inject after window.onload

const PDAPromise = new Promise((res, rej) => {
  if (document.readyState === 'complete') res();
});

const browserPromise = new Promise((res, rej) => {
  window.addEventListener('load', () => res());
});

// await new Promise((res) => {
//   const interval = setInterval(() => {
//     if (document.readyState === 'complete') {
//       res();
//       clearInterval(interval);
//     }
//   });
// });

(async function () {
  try {
    console.log(document.readyState); // TEST
    await Promise.race([PDAPromise, browserPromise]);
    initController();
    await loadController();
    userSettingsController();
    if (getUserSettings.showHardnessScore) {
      hardnessScoreController();
    }
    successfulBustUpdateController();
    refreshStatsController();
    viewportResizeController();
  } catch (err) {
    console.error(err); // TEST
  }
})();
