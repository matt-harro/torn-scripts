/** @format */

// ==UserScript==
// @name         BUSTR: Busting Reminder + PDA
// @namespace    http://torn.city.com.dot.com.com
// @version      0.6
// @description  Guess how many busts you can do without getting jailed
// @author       Adobi & Ironhydedragon
// @match        https://www.torn.com/*
// @license      MIT
// ==/UserScript==

////////  MODEL
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

////////  VIEW

////////  CONTROLLER
