chrome.storage.sync.get(['blacklist', 'titleBlocklist', 'hideViewed', 'hideApplied'], (data) => {
  const blacklist = data.blacklist || [];
  const titleBlocklist = data.titleBlocklist || [];
  const hideViewed = data.hideViewed ?? true;
  const hideApplied = data.hideApplied ?? true;

  function filterJobCards() {
    const jobCards = document.querySelectorAll('div.job-card-container');

    jobCards.forEach((card) => {
      const footer = card.querySelector('.job-card-container__footer-wrapper, .job-card-list__footer-wrapper');
      const footerText = footer ? footer.innerText.toLowerCase() : "";

      const stateEl = card.querySelector('.job-card-container__footer-job-state');
      const stateText = stateEl ? stateEl.innerText.toLowerCase() : "";

      const isViewed = hideViewed && (stateText.includes('viewed') || footerText.includes('viewed'));
      const isApplied = hideApplied && (stateText.includes('applied') || footerText.includes('applied'));
      const isSaved = footerText.includes('saved');

      const titleEl = card.querySelector('a.job-card-list__title--link');
      const titleText = titleEl ? titleEl.innerText.toLowerCase() : '';

      const cardText = card.innerText.toLowerCase();
      const isBlacklisted = blacklist.some(company => cardText.includes(company.toLowerCase()));

      const isTitleBlocked = titleBlocklist.some(keyword => titleText.includes(keyword.toLowerCase()));

      const cardToHide = card.closest('li.jobs-search-results__list-item') || card;

      if (isViewed || isApplied || isSaved || isBlacklisted || isTitleBlocked) {
        cardToHide.style.setProperty('display', 'none', 'important');
      } else {
        cardToHide.style.removeProperty('display');
      }
    });
  }

  filterJobCards();

  let container = null;
  const firstJob = document.querySelector('div.job-card-container');
  if (firstJob) {
    let parent = firstJob.parentElement;
    while (parent) {
      if (parent.querySelectorAll && parent.querySelectorAll('div.job-card-container').length > 1) {
        container = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }
  if (!container) {
    container = document.body;
  }

  const observer = new MutationObserver(() => {
    filterJobCards();
  });

  observer.observe(container, { childList: true, subtree: true });
});
