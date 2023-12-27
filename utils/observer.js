// Observer that doesnt include news ticker and countdown timers
async function observer(mutationList, observer) {
  for (const mutation of mutationList) {
    if (!mutation.target.classList.contains('progress-line-timer___uV1ZZ') && !mutation.target.id !== 'news-ticker-slider-wrapper') {
      console.log('👀', mutation); // TEST
    }
  }
}

function createObserver() {
  const observer = new MutationObserver(Observer);
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
}
