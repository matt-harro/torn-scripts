// Observer that doesnt include news ticker and countdown timers
function observerCallback(mutationList, observer) {
  for (const mutation of mutationList) {
    if (
      !mutation.target.classList.contains('progress-line-timer___uV1ZZ') &&
      !mutation.target.classList.contains('news-ticker-slide') &&
      !mutation.target.classList.contains('progress___z5tk3') &&
      mutation.target.id !== 'news-ticker-slider-wrapper'
    ) {
      // console.log('👀', mutation); // TEST
    }
  }
}

function createObserver() {
  const observer = new MutationObserver(observerCallback);
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
}
