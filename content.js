chrome.storage.sync.get(['blacklist', 'titleBlocklist', 'hideViewed', 'hideApplied'], (data) => {
  const blacklist = data.blacklist || [];
  const titleBlocklist = data.titleBlocklist || [];
  const hideViewed = data.hideViewed ?? true;
  const hideApplied = data.hideApplied ?? true;

  const clickedJobKeys = new Set();

  const savedKeys = sessionStorage.getItem('clickedJobKeys');
  if (savedKeys) {
    try {
      JSON.parse(savedKeys).forEach(key => clickedJobKeys.add(key));
    } catch (e) {
      console.warn('[Init] Failed to parse clicked job keys from sessionStorage');
    }
  }

  function getJobUrl(card) {
    const link = card.querySelector('a.job-card-list__title--link, a.job-card-list__title');
    return link?.href || '';
  }
  function getCompanyName(card) {
    const companyEl = card.querySelector('.job-card-container__company-name, .job-card-list__company-name');
    if (companyEl) return companyEl.innerText.trim().toLowerCase();
    return '';
  }
  function getJobTitle(card) {
    const titleEl = card.querySelector('a.job-card-list__title, a.job-card-list__title--link');
    return titleEl ? titleEl.innerText.trim().toLowerCase() : '';
  }
  function getJobKey(card) {
    const title = getJobTitle(card);
    const company = getCompanyName(card);
    const url = getJobUrl(card);
    return `${title}||${company}||${url}`;
  }

  function saveClickedKeys() {
    sessionStorage.setItem('clickedJobKeys', JSON.stringify([...clickedJobKeys]));
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('div.job-card-container');
    if (card) {
      const key = getJobKey(card);
      if (key) {
        clickedJobKeys.add(key);
        saveClickedKeys();
      } else {
        console.log('[Click] Could not generate key for clicked card');
      }
    }
  });

  function filterJobCards() {
    const jobCards = document.querySelectorAll('div.job-card-container');

    jobCards.forEach(card => {
      const listItem = card.closest('li.jobs-search-results__list-item');
      const cardToStyle = listItem || card;

      const footer = card.querySelector('.job-card-container__footer-wrapper, .job-card-list__footer-wrapper');
      const footerText = footer ? footer.innerText.toLowerCase() : "";

      const stateEl = card.querySelector('.job-card-container__footer-job-state');
      const stateText = stateEl ? stateEl.innerText.toLowerCase() : "";

      const isViewed = hideViewed && (stateText.includes('viewed') || footerText.includes('viewed'));
      const isApplied = hideApplied && (stateText.includes('applied') || footerText.includes('applied'));
      const isSaved = footerText.includes('saved');

      const titleText = getJobTitle(card);
      const cardText = card.innerText.toLowerCase();

      const isBlacklisted = blacklist.some(company => cardText.includes(company.toLowerCase()));
      const isTitleBlocked = titleBlocklist.some(keyword => titleText.includes(keyword.toLowerCase()));

      const jobKey = getJobKey(card);
      const clickedPreviously = jobKey ? clickedJobKeys.has(jobKey) : false;

      if (isApplied || isSaved || isBlacklisted || isTitleBlocked) {
        cardToStyle.style.setProperty('display', 'none', 'important');
        cardToStyle.style.removeProperty('opacity');
        return;
      }

      if (isViewed && clickedPreviously) {
        cardToStyle.style.removeProperty('display');
        cardToStyle.style.setProperty('opacity', '0.5');
        return;
      }

      if (isViewed) {
        cardToStyle.style.setProperty('display', 'none', 'important');
        cardToStyle.style.removeProperty('opacity');
        return;
      }

      cardToStyle.style.removeProperty('display');
      cardToStyle.style.removeProperty('opacity');
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
  if (!container) container = document.body;

  const observer = new MutationObserver(() => {
    setTimeout(filterJobCards, 400);
  });

  observer.observe(container, { childList: true, subtree: true });

  window.addEventListener('beforeunload', () => {
    clickedJobKeys.clear();
    saveClickedKeys();
    console.log('[Page unload] Cleared clicked job keys');
  });
});
