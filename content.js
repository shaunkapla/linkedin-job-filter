let blacklist = [];
let titleBlocklist = [];
let hideViewed = false;
let hideApplied = false;

const clickedJobKeys = new Set();

const savedKeys = sessionStorage.getItem('clickedJobKeys');
if (savedKeys) {
  try {
    JSON.parse(savedKeys).forEach(key => clickedJobKeys.add(key));
  } catch (e) {
    console.warn('[Init] Failed to parse clicked job keys from sessionStorage');
  }
}

function saveClickedKeys() {
  sessionStorage.setItem('clickedJobKeys', JSON.stringify([...clickedJobKeys]));
}

function getJobUrl(card) {
  const link = card.querySelector('a.job-card-list__title--link, a.job-card-list__title');
  return link?.href || '';
}
function getCompanyName(card) {
  const companyEl = card.querySelector('.job-card-container__company-name, .job-card-list__company-name');
  return companyEl?.innerText.trim().toLowerCase() || '';
}
function getJobTitle(card) {
  const titleEl = card.querySelector('a.job-card-list__title, a.job-card-list__title--link');
  return titleEl?.innerText.trim().toLowerCase() || '';
}

// this makes a unique identifier based on the job (think almost something like a hash of some sorts)
function getJobKey(card) {
  return `${getJobTitle(card)}||${getCompanyName(card)}||${getJobUrl(card)}`;
}

// what happens when you click a job so that it doesn't just go away instantly
document.addEventListener('click', (e) => {
  const card = e.target.closest('div.job-card-container');
  if (card) {
    const key = getJobKey(card);
    if (key) {
      clickedJobKeys.add(key);
      saveClickedKeys();
    }
  }
});

// self explanatory but function to filter out the jobs on linkedin job search based on parameters
function filterJobCards() {
  try {
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

      cardToStyle.style.removeProperty('display');
      cardToStyle.style.removeProperty('opacity');

      if (isApplied || isSaved || isBlacklisted || isTitleBlocked) {
        cardToStyle.style.setProperty('display', 'none', 'important');
      } else if (isViewed && clickedPreviously) {
        cardToStyle.style.setProperty('opacity', '0.5');
      } else if (isViewed) {
        cardToStyle.style.setProperty('display', 'none', 'important');
      }
    });

  } catch (err) {
    console.error('Error in filterJobCards:', err);
  }
}

// initial loading of the preferences and running the filter
chrome.storage.sync.get(['blacklist', 'titleBlocklist', 'hideViewed', 'hideApplied'], (data) => {
  blacklist = data.blacklist || [];
  titleBlocklist = data.titleBlocklist || [];
  hideViewed = data.hideViewed ?? false;
  hideApplied = data.hideApplied ?? false;

  filterJobCards();
});

// this function watches for any change to the popup to update the DOM
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return;

  if (changes.blacklist) {
    blacklist = changes.blacklist.newValue || [];
  }
  if (changes.titleBlocklist) {
    titleBlocklist = changes.titleBlocklist.newValue || [];
  }
  if (changes.hideViewed !== undefined) {
    hideViewed = changes.hideViewed.newValue ?? false;
  }
  if (changes.hideApplied !== undefined) {
    hideApplied = changes.hideApplied.newValue ?? false;
  }

  console.log('[Storage] Filters updated — refiltering');
  filterJobCards();
});

// Lazy loading problem where if you scroll, linkedin lazy loads jobs so !!without!! this it wouldn't 
// remove jobs when you scroll
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

// this watches for new job cards on the page and refilter after DOM mutations
let filterTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(filterTimeout);
  filterTimeout = setTimeout(filterJobCards, 300);
});
observer.observe(container, { childList: true, subtree: true });

// Cleanup on unload of the page
window.addEventListener('beforeunload', () => {
  clickedJobKeys.clear();
  saveClickedKeys();
  console.log('[Unload] Cleared clicked job keys');
});
