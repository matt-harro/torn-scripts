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

function modalController() {
  // document.querySelector('.hand-history__peek').addEventListener('click', peekClickHandler);
}
