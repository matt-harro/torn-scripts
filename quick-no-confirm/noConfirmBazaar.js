// ==UserScript==
// @name         TORN: No Confirm Bazaar
// @namespace    http://torn.city.com.dot.com.com
// @version      1.0.0
// @description  Allows buying items from bazaars with 1-click
// @author       IronHydeDragon[2428902]
// @match        https://www.torn.com/bazaar.php*
// @license      MIT
// ==/UserScript==

// userID: 3067528;
// id: 78350970;
// itemID: 885;
// amount: 1;
// price: 10;
// beforeval: 10;

/*
:authority:
www.torn.com
:method:
POST
:path:
/bazaar.php?sid=bazaarData&step=buyItem
:scheme:
https
Accept:

Accept-Encoding:
gzip, deflate, br
Accept-Language:
en-GB,en-US;q=0.9,en;q=0.8
Content-Length:
627
Content-Type:
multipart/form-data; boundary=----WebKitFormBoundarynpPwied538rPQ7mA
Cookie:
newsTickerIsEnabled=true; _fbp=fb.1.1701428010260.1153227194; _gcl_au=1.1.1387319569.1701428010; _ga=GA1.1.670933176.1701428011; PHPSESSID=942ae1ee2498d881247502a175e85cdc; uid=2428902; at02d6e8b172d34a948669c91d03962280=f7854aca6ced01689a7eb7143afe7388; disableHintTooltip_2428902=true; userItemsPreferences=%7B%22userItemsEquippedWeapons%22%3Afalse%2C%22userItemsEquippedArmour%22%3Afalse%2C%22userItemsWeapon%22%3Afalse%2C%22userItemsThumbnails%22%3Afalse%2C%22userItemsActiveTab%22%3A%22drugs-items%22%7D; cf_clearance=vbXHMBbJUGUow.0_hxV_jKZ_gRcNvRf5JDGhX7PIfac-1703956146-0-2-ed3ce676.5e5c0add.ba3db996-160.2.1703956146; rfc_id=659283b664b96; rfc_v=659283b664b96; gymTrains={"strength":26}; darkModeEnabled=true; _ga_0BZYS7HPVC=GS1.1.1704106423.38.1.1704118837.59.0.0; newsTicker={"activeDonationID":null,"activeHeadlineID":5,"activeHeadlineType":"forumThreadLikes","headlinesLeft":1}
Origin:
https://www.torn.com
Referer:
https://www.torn.com/bazaar.php?userId=1652888
Sec-Ch-Ua:
"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"
Sec-Ch-Ua-Mobile:
?0
Sec-Ch-Ua-Platform:
"macOS"
Sec-Fetch-Dest:
empty
Sec-Fetch-Mode:
cors
Sec-Fetch-Site:
same-origin
User-Agent:
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
X-Requested-With:
XMLHttpRequest
*/

let numBazaarItems;
let bazaarItemsDataArr = [];

function getItemElDetails(itemEl) {
  // returns item { name, price, amount }
  const name = itemEl.querySelector(
    '.description___Y2Nrl .name___B0RW3'
  ).textContent;

  const price = itemEl
    .querySelector('.description___Y2Nrl .price___dJqda')
    .textContent.slice(1)
    .split(',')
    .join('')
    .trim();

  const amount = querySelector('.description___Y2Nrl .price___dJqda')
    .textContent.match(/d+/g)
    .join('');

  console.log('itemElDetails', { name, price, amount }); // TEST
  return { name, price, amount };
}

function getBazaarItemDataIndex(itemElDetails) {
  let indexArr = [];

  bazaarItemsDataArr.forEach((entry, index) => {
    if (
      entry.name === itemElDetails.name &&
      entry.price === itemElDetails.price
    ) {
      indexArr.push(index);
    }
  });

  if (indexArr.length === 1) return indexArr[0];
  if (indexArr.length === 0) {
    alert('Item not found'); // TEST
    return null
  };
  if (indexArr.length > 1) {
    alert('Multiple Items found'); // TEST
    return indexArr[0]
  };

  if
}

function getBazaarItemData(itemElDetails) {
  const index = getBazaarItemDataIndex(itemElDetails);

  // let { bazaarID: id, itemID, price } = bazaarItemsDataArr[index];

  return { id, itemID, price };
}

function getUserID() {
  return new URLSearchParams(window.location.search).get('userId');
}

async function postQuickBuyRequest(itemData) {
  try {
    const formData = new FormData();

    for (const [key, value] of Object.entries(itemData)) {
      formData.append(key, value);
    }

    const response = await unsafeWindow.fetch(
      '/bazaar.php?sid=bazaarData&step=buyItem',
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    console.log(data); // TEST
    return data;
  } catch (error) {
    console.error('fetchError: ', error); // TEST
  }
}

function renderStyleSheet() {
  const stylesheetHTML = `
  <style>
    .bazaar-quick-buy .description___aeIkg {
      display: block;
    }
    .bazaar-quick-buy .line___SCzj2 {
      display: inline;
      white-space: unset;
    }
  </style>`;
  document.head.insertAdjacentHTML('beforeend', stylesheetHTML);
}

function renderSuccess(itemEl, responseHTML) {
  const successHTML = `
    <div
      class="overPanelContainer___OS4da bazaar-quick-buy"
      tabindex="0"
      aria-label="Success"
      aria-labelledby="bought-msg-885-0"
    >
      <span id="bought-msg-885-0" class="description___aeIkg" tabindex="0">
        <span class="line___SCzj2"
          >${responseHTML}</span
        >
      </span>
      <button class="close___xNCDr" type="button" aria-label="Close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="default___XXAGt"
          filter="url(#bazaar_view_shadow)"
          fill="url(#bazaar_cross_gradient)"
          stroke="#fff"
          stroke-width="0"
          width="12"
          height="11"
          viewBox="0 0 14 13"
        >
          <g>
            <polygon
              points="0 0 5.25 6 0 12 3.5 12 7 8.28 10.5 12 14 12 8.75 6 14 0 10.5 0 7 3.72 3.5 0 0 0"
            ></polygon>
          </g>
        </svg>
      </button>
    </div>
  `;
  itemEl.innerHTML = successHTML;
}

function renderFail(itemEl, responseHTML) {
  const errorHTML = `
    <div class="buyError___KthjG" tabindex="0" aria-label="Error">
      <p
        class="message___WVVLV"
        tabindex="0"
        aria-label="You selected more than there are in this bazaar or they have no items of the relevant type."
      >
       ${responseHTML}
      </p>
      <button type="button" class="close___OIGWS" aria-label="Close">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="default___XXAGt"
          filter="url(#bazaar_view_shadow)"
          fill="url(#bazaar_cross_gradient)"
          stroke="#fff"
          stroke-width="0"
          width="12"
          height="11"
          viewBox="0 0 14 13"
        >
          <g>
            <polygon
              points="0 0 5.25 6 0 12 3.5 12 7 8.28 10.5 12 14 12 8.75 6 14 0 10.5 0 7 3.72 3.5 0 0 0"
            ></polygon>
          </g>
        </svg>
      </button>
    </div>
  `;
  itemEl.innerHTML = errorHTML;
}

async function buyClickHandler(e, itemsArr, index) {
  const itemEl = e.target;
  console.log(itemEl); // TEST

  const itemElDetails = getItemElDetails();

  const itemData = getBazaarItemData(itemElDetails);

  // itemData.userID = getUserID();
  // itemData.amount = e.target.parentElement.parentElement.querySelector(
  //   '.numberInput____trXC.buyAmountInput___CSV2n'
  // ).value;
  // itemData.beforeval = itemData.price;

  const data = await postQuickBuyRequest(itemData);

  if (data.success) {
    renderSuccess(itemsArr[index], data.text);
  }
  if (!data.success) {
    renderFail(itemsArr[index], data.text);
  }
}

const { fetch: origFetch } = unsafeWindow;

unsafeWindow.fetch = async (...args) => {
  // console.log('fetch called with args:', args);

  const response = await origFetch(...args);
  // console.log('fetch interceptor response', response); // TEST

  if (response.url.match(/bazaar\.php\?sid=bazaarData&step=getBazaarItems/)) {
    const clone = await response.clone();
    const data = await clone.json();

    numBazaarItems = data.total;

    if (bazaarItemsDataArr.length < numBazaarItems) {
      bazaarItemsDataArr.push(...data.list);
    } else {
      bazaarItemsDataArr = data.list;
      console.log(bazaarItemsDataArr); // TEST
    }
    console.log(bazaarItemsDataArr); // TEST
  }

  // if (args[0].match(/bazaar\.php\?sid=bazaarData&step=buyItem/)) {
  //   const clone = await response.clone();
  //   const data = await clone.json();
  // }
  /* the original response can be resolved unmodified: */
  return response;
};

// Observer that doesnt include news ticker and countdown timers
function observerCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    // if (
    //   !mutation.target.classList.contains('progress-line-timer___uV1ZZ') &&
    //   !mutation.target.classList.contains('news-ticker-slide') &&
    //   !mutation.target.classList.contains('progress___z5tk3') &&
    //   mutation.target.id !== 'news-ticker-slider-wrapper'
    // ) {
    //   // console.log('👀', mutation); // TEST
    // }
    if (
      mutation.target.classList.contains('item___GYCYJ', 'item___khvF6') &&
      mutation.addedNodes.length > 0 &&
      mutation.addedNodes[0].classList &&
      mutation.addedNodes[0].classList.contains(
        'buyMenu___PJqGH',
        'overPanelContainer___OS4da'
      )
    ) {
      console.log('👀', mutation.addedNodes); // TEST
      const itemsArray = [
        ...document.querySelectorAll('.item___GYCYJ.item___khvF6'),
      ];
      const index = itemsArray.indexOf(mutation.target);

      console.log('itemsArr', itemsArray, 'index', index); // TEST
      console.log(bazaarItemsDataArr[index]); // TEST

      const buyBtn = mutation.addedNodes[0].querySelector('.buy___Obyz6');
      buyBtn.addEventListener('click', (e) =>
        buyClickHandler(e, itemsArray, index)
      );
    }
  }
}

function createObserver() {
  const observer = new MutationObserver(observerCallback);
  observer.observe(document, {
    attributes: false,
    childList: true,
    subtree: true,
  });
}

(async () => {
  console.log('👍 No confirm bazaar script is ON!');
  renderStyleSheet();
  createObserver();
})();
