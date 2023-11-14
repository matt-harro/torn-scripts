/** @format */

// ==UserScript==
// @name         Busting reminder PDA
// @namespace    http://torn.city.com.dot.com.com
// @version      0.6
// @description  Guess how many busts you can do without getting jailed
// @author       Adobi
// @match        https://www.torn.com/*
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @license      MIT
// ==/UserScript==

(function () {
  ////////  GLOBAL VARIABLES
  let GLOBAL_BUST_STATE = {
    apiKey: null,
    userSettings: {},
    penaltyScore: 0,
    penaltyThreshold: 0,
    availableBusts: 0,
    myDevice: undefined,
  };

  const PDA_API_KEY = '###PDA-APIKEY###';
  const isPDA = !/^(###).+(###)$/.test(PDA_API_KEY);

  ////////  GETTERS AND SETTERS FUNCTIONS
  function setGlobalBustState(newState) {
    if (isPDA) {
      localStorage.setItem('bustingReminderState', JSON.stringify(newState));
    }
    GM_setValue('bustingReminderState', JSON.stringify(newState));
  }
  function getGlobalBustState() {
    const isGlobalBustState =
      localStorage.getItem('bustingReminderState') ||
      GM_getValue('bustingReminderState') ||
      false;
    if (!isGlobalBustState) return false;

    if (isPDA) {
      return JSON.parse(localStorage.getItem('bustingReminderState'));
    }
    return JSON.parse(GM_getValue('bustingReminderState', ''));
  }
  function deleteGlobalBustState() {
    if (isPDA) {
      localStorage.removeItem('bustingReminderState');
    }
    GM_deleteValue('bustingReminderState');
  }

  function setMyDeviceType(width, currentState) {
    console.log('SET MY DEVICE'); // TEST
    width = width || window.innerWidth;
    currentState = currentState || getGlobalBustState();

    const myDeviceType = width > 1000 ? 'Desktop' : 'Mobile';

    const newState = { ...currentState, myDevice: myDeviceType };
    setGlobalBustState(newState);
  }
  function getMyDeviceType() {
    return getGlobalBustState().myDevice;
  }

  function setApiKey(API_KEY, currentState) {
    currentState = currentState || getGlobalBustState();

    const newState = { ...currentState, apiKey: API_KEY };
    console.log('🔑', API_KEY);

    setGlobalBustState(newState);
  }
  function getApiKey() {
    return getGlobalBustState().apiKey;
  }

  function setUserSettings(newUserSettings, currentState) {
    currentState = currentState || getGlobalBustState();

    const newState = { userSettings: newUserSettings, ...currentState };
    setGlobalBustState(newState);
  }
  function getUserSettings() {
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

  ////////  UTILS FUNCTIONS

  function createTimestampsArray(data) {
    const timestamps = [];

    console.log('TS', data.log); // TEST
    for (const entry in data.log) {
      timestamps.push(data.log[entry].timestamp);
    }

    return timestamps;
  }

  function calcTenHours(hours) {
    return hours / 7.2;
  }

  function calcPenaltyScore(timestampsArray) {
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
      console.log('CPS', score); // TEST
    }
    return Math.floor(score);
  }

  function calcPenaltyThreshold(timestampArray) {
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
    return Math.floor(currentMaxScore);
  }

  function calcAvailableBusts(penaltyScore, penaltyThreshold) {
    penaltyThreshold = penaltyThreshold || getPenaltyThreshold();
    penaltyScore = penaltyScore || getPenaltyScore();

    return Math.floor((penaltyThreshold - penaltyScore) / 128);
  }

  async function fetchBustsData(API_KEY) {
    try {
      // console.log('FETCH BUST DATA'); // TEST
      API_KEY = API_KEY || getApiKey();

      const url = `https://api.torn.com/user/?selections=log&log=5360&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (
        (data.error && data.error.error === 'Incorrect key') ||
        (data.error &&
          data.error.error === 'Access level of this key is not high enough')
      ) {
        const newApiKey = prompt(
          `API Key Error: ${data.error.error}\nPlease enter a Valid full access API Key or type`
        );
        if (!newApiKey) return;
        setApiKey(newApiKey);
        return fetchBustsData();
      }
      return data;
    } catch (err) {
      console.error(err);
    }
  }

  async function calcBustrStats() {
    try {
      // console.log('CALC BUSTR STATS'); // TEST

      const data = await fetchBustsData();

      const timestampsArray = createTimestampsArray(data);

      const penaltyScore = calcPenaltyScore(timestampsArray);

      const penaltyThreshold = calcPenaltyThreshold(timestampsArray);

      const availableBusts = calcAvailableBusts(penaltyScore, penaltyThreshold);

      setPenaltyScore(penaltyScore);
      setPenaltyThreshold(penaltyThreshold);
      setAvailableBusts(availableBusts);
    } catch (err) {
      console.error(err); // TEST
    }
  }
  // calcBustrStats(); // TEST

  ///////// RENDERING
  // stylesheet
  const bustrStylesheetHTML = `<style>
    .bustr--red {
      --bgc: #fa8e8e;
      --text-color: rgb(51, 51, 51);
    }
    .bustr--green {
      --bgc: #40AB24;
      --text-color: rgb(51, 51, 51)
    }
    #body.dark-mode .bustr--green {
      --bgc: #40AB24;
      --text-color: rgb(211, 211, 211);
      text-shadow: 0px 0px 3px rgba(51, 51, 51, 1),
                    0px 1px 3px rgba(51, 51, 51, 0.7);
                    1px 0px 3px rgba(51, 51, 51, 0.7);
    }
    .bustr--light-green {
      --bgc: #A4D497;
      --text-color: rgb(51, 51, 51);
    }

    #body .bustr a,
    #body .bustr a span {
      background-color: var(--bgc, inherit);
      color: var(--text-color, inherit);
    }

    #body .bustr a .bustr-stats {
      float: right;
      margin-right: 8px;
    }

    #body .bustr-context-menu {
      display: none;
    }

    #body .contextMenuActive___e6i_B .bustr-context-menu {
      align-items: center;
      background: #333;
      border: 1px solid #444;
      border-radius: 5px;
      box-shadow: 0 1px 2px rgba(0,0,0,.45);
      display: flex;
      height: 34px;
      justify-content: center;
      right: -92px;
      min-width: 70px;
      position: absolute;
      top: 3px;
      transition: opacity .5s;
      z-index: 100;
      padding: 0 4px;
    }
    #body .bustr-context-menu .bustr-arrow {
      border-color: transparent  #444 transparent transparent;
      border-width: 8px 6px 8px 0px;
      left: auto;
      left: -6px;
      top: 9px;
      border-style: solid;
      height: 0;
      position: absolute;
      width: 0;
          }

  </style>`;
  function renderBustrStylesheet() {
    console.log('RENDER STYLESHEET'); // TEST

    const headEl = document.querySelector('head');
    headEl.insertAdjacentHTML('beforeend', bustrStylesheetHTML);
  }
  renderBustrStylesheet(); // TEST

  function renderBustrClass() {
    const navJailEl = document.querySelector('#nav-jail');
    const isBustr = navJailEl.classList.contains('bustr');

    if (!isBustr) navJailEl.classList.add('bustr');
  }
  renderBustrClass(); // TEST

  function renderBustrColor(availableBusts) {
    console.log('RENDER BUSTER COLOR'); // TEST
    availableBusts = availableBusts || getAvailableBusts();

    const color =
      availableBusts <= 0
        ? 'red'
        : availableBusts <= 3
        ? 'light-green'
        : 'green';

    const jailLinkContainerEl = document.querySelector('#nav-jail div');
    jailLinkContainerEl.classList.add(`bustr--${color}`);
  }
  // renderBustrColor(); // TEST

  function renderDesktopBustrStats(
    penaltyScore,
    penaltyThreshold,
    availableBusts
  ) {
    penaltyScore = penaltyScore || getPenaltyScore();
    penaltyThreshold = penaltyThreshold || getPenaltyThreshold();
    availableBusts = availableBusts || getAvailableBusts();
    console.log('RENDER DESKTOP STATS'); // TEST

    if (document.querySelector('.bustr-stats')) {
      document.querySelector('.bustr-stats').remove();
    }

    const jailLinkEl = document.querySelector('#nav-jail a');
    const statsHTML = `<span class="linkName___FoKha bustr-stats">${penaltyScore} / ${penaltyThreshold} : ${availableBusts}</span>`;
    jailLinkEl.insertAdjacentHTML('beforeend', statsHTML);
  }
  // renderDesktopBustrStats(); // TEST

  function renderMobileBustrStats(
    penaltyScore,
    penaltyThreshold,
    availableBusts
  ) {
    console.log('RENDER MOBILE STATS'); // TEST
    penaltyScore = penaltyScore || getPenaltyScore();
    penaltyThreshold = penaltyThreshold || getPenaltyThreshold();
    availableBusts = availableBusts || getAvailableBusts();

    if (document.querySelector('.bustr-context-menu')) {
      document.querySelector('.bustr-context-menu').remove();
    }

    const color =
      availableBusts <= 0
        ? 'red'
        : availableBusts <= 3
        ? 'light-green'
        : 'green';

    const bustrContextMenuHTML = `
    <div class='bustr-context-menu hidden'>
      <span class='linkName___FoKha bustr-stats'>
      ${penaltyScore} / ${penaltyThreshold} : ${availableBusts}
      </span>
      <span class='bustr-arrow'></span>
    </div>`;

    const navJailEl = document.querySelector('#nav-jail');
    navJailEl.insertAdjacentHTML('afterend', bustrContextMenuHTML);
  }
  // renderMobileBustStats(); // TEST

  function renderBustr() {
    console.log('RENDER BUSTR');
    setMyDeviceType();
    const myDevice = getMyDeviceType();

    renderBustrColor();

    if (myDevice === 'Desktop') {
      renderDesktopBustrStats();
    }
    if (myDevice === 'Mobile') {
      renderMobileBustrStats();
    }
    if (isPDA) renderMobileBustrStats();
  }
  // renderBustr(); // TEST

  async function load() {
    await calcBustrStats();
    renderBustr();
  }

  ////////  INITIALISATION, RUNS ON FIRST LOAD
  function init() {
    try {
      console.log('INIT'); // TEST
      setGlobalBustState(GLOBAL_BUST_STATE);

      if (isPDA) setApiKey(PDA_API_KEY);
      if (!isPDA) {
        const APIPrompt = prompt(
          'BUST REMINDER REQUIRES AN API KEY\nPlease enter a "Full-access API KEY"'
        );
        setApiKey(APIPrompt);
      }

      calcBustrStats();

      // Alert with details
      alert('HAPPY BUSTING\nYour Busting Reminder Setup is complete');
      console.log(getGlobalBustState());
    } catch (err) {
      console.error(err);
    }
  }
  if (!getGlobalBustState()) init();

  load();

  //////// LISTENERS
  try {
    // document.addEventListener('DOMContentLoaded', refresh, false);
    // window.addEventListener('resize', (e) => {
    //   console.log(e);
    //   const isDesktop = getMyDeviceType() === 'Desktop';
    //   const isMobile = getMyDeviceType() === 'Mobile';
    //   if (isDesktop & (getMyDeviceType() === 'Desktop')) return;
    //   if (isMobile & (getMyDeviceType() === 'Mobile')) return;
    //   console.log('🪟 Threshold');
    //   setMyDeviceType(getMyDeviceType === 'Desktop' ? 'Mobile' : 'Desktop');
    //   renderBustr();
    // });
    ///////// TESTING AND DEBUG
    const tcClockEl = document.querySelector('.tc_clock');
    tcClockEl.addEventListener('click', deleteGlobalBustState);
  } catch (error) {
    console.error(error);
  }
})();
