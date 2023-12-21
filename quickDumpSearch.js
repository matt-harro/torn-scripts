// ==UserScript==
// @name         TORN: Quick Dump Search
// @namespace    http://torn.city.com.dot.com.com
// @version      0.0.0
// @description  Quick Searches the Dump
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/dump.php
// @license      MIT
// @run-at       document-end
// ==/UserScript==

async function requireElement(selectors, conditionsCallback) {
  try {
    await new Promise((res, rej) => {
      const maxCycles = 500;
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

function hideLoading() {
  console.log('hiding loader...'); // TEST
  document.querySelector('.btn-wrap.search').style = 'display: none;';
  document.querySelector('.btn-wrap.again').style = 'display: none;';
  document.querySelector('.info-text.text-in-progress').style = 'display: none;';
  document.querySelector('.search-progress .searching').style = 'display: none;';
  document.querySelector('.info-text.text-in-progress').style = 'display: none;';
}

function showFound() {
  console.log('...showing found'); // TEST
  document.querySelector('.info-text.search-result').style = 'display: block;';

  if (document.querySelector('#body.d .search-block .searcher img')) {
    document.querySelector('#body.d .search-block .searcher img').style = 'display: block;';
  }

  document.querySelector('.search-progress .found').style = 'display: block;';
  document.querySelector('.searcher').classList.add('item-found');
  document.querySelector('.btn-wrap.pick-up').style = 'display: block;';
  document.querySelector('.btn-wrap.toss').style = 'display: block;';
}

async function pickupTossClickHandler() {}

function searchButtonClickHandler() {
  console.log('search clicked'); // TEST
  setTimeout(() => {
    hideLoading();
    showFound();
  }, 500);
}

async function quickSearchController() {
  await requireElement('.btn-wrap.search a');
  document.querySelector('.btn-wrap.search a').addEventListener('click', searchButtonClickHandler);
  await requireElement('.btn-wrap.again a');
  document.querySelector('.btn-wrap.again a').addEventListener('click', searchButtonClickHandler);
}
// on search click

// hide .info-text.text-in-progress: display: none;
// hide .search-progress .searching: display: none;

// show .search-progress .found: display: block;
// show image .searcher.in-progress classList.add('.item-found')
// show .info-text.search-result: display: block;
// show .btn-wrap.pick-up: display: block;
// show .btn-wrap.toss: display: block;

(() => {
  console.log('🗑️ Quick dump search script is ON!'); // TEST
  document.addEventListener('load', (e) => {
    console.log(e); // TEST
  })
  quickSearchController();
})();
