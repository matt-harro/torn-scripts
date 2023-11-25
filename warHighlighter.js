/** @format */

// ==UserScript==
// @name         Torn War Highlighter - offline/idle & okay
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.1
// @description  Sexily highlights war enemies that are 'offline | idle' and 'Okay'.
// @author       Ironhydedragon
// @match        https://www.torn.com/factions*
// @license      MIT
// ==/UserScript==

/*  
    - any questions hit up IronHydeDragon [2420802]
    
    Features:
      - Sexy rendering: using torn color pallette
      - Updates every 0.5s

    Possible Future Features
    - Exclude enemies above (x) level
    - Exceptions:
      - AlwaysIncludePlayers [arrayOfPlayers] *(for players above the exclusion level that you can beat)*
      - AlwaysExcludePlayer [arrayOfPlayers] *(for players below the exclusion level that you can NOT beat)*
*/

(function () {
  ////////  VARIABLES  ////////
  // const green = '#4b5738';
  // const greenLight = '#57693a';
  const greetLighter = '#85b200';
  const greenTranslucent = 'rgba(75, 85, 56, 0.9)';
  // const greenLightTranslucent = 'rgba(87,105,58, 0.9)';
  // const gray = 'rgb(34, 34, 34)';

  const stylesheetHTML = `
  <style>
    #body li.enemy {
      margin-top: -1px;
      width: 100%;
    }
    #body ul.members-list li.enemy.wh-isAttackable {
      z-index: 200;
      outline: 1px solid ${greetLighter};
      outline-offset: -2px;
    }

    #body ul.members-list li.enemy.wh-isAttackable .attack {
      background: ${greenTranslucent};
    }
  </style>`;

  ////////  MODEL  ////////
  function getEmemiesArr() {
    return [...document.querySelectorAll('li.enemy')];
  }

  ////////  VIEW  ////////

  function renderStylesheet() {
    const headEl = document.querySelector('head');
    headEl.insertAdjacentHTML('beforeend', stylesheetHTML);
  }

  function renderIsAttackable(el, isValidTarget = false) {
    if (isValidTarget) {
      el.classList.add('wh-isAttackable');
    } else {
      el.classList.contains('wh-isAttackable');
      el.classList.remove('wh-isAttackable');
    }
  }

  ////////  CONTROLLERS  ////////
  function initController() {
    renderStylesheet();
  }

  function loadController() {
    setInterval(() => {
      // console.log('TICK'); // TEST
      // get list of enemies
      const enemiesArr = getEmemiesArr();

      enemiesArr.forEach((el) => {
        const svgIconEl = el.querySelector('.userStatusWrap___ljSJG svg');
        const statusEl = el.querySelector('.status');

        const svgFillValue = svgIconEl.getAttribute('fill');
        const statusValue = statusEl.textContent;

        const isOffline =
          svgFillValue === 'url("#svg_status_offline")' ||
          svgFillValue === 'url("#svg_status_idle")';
        const isAttackable = statusValue === 'Okay';

        const isValidTarget = isAttackable && isOffline;
        renderIsAttackable(el, isValidTarget);
      });
    }, 500);
  }

  initController();
  loadController();
})();
