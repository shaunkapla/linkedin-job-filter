const input = document.getElementById('company-input');
const addBtn = document.getElementById('add-company-btn');
const blacklistEl = document.getElementById('company-list');

const titleInput = document.getElementById('title-input');
const addTitleBtn = document.getElementById('add-title-btn');
const titleListEl = document.getElementById('title-list');

const hideViewedEl = document.getElementById('hideViewed');
const hideAppliedEl = document.getElementById('hideApplied');

chrome.storage.sync.get(['blacklist', 'titleBlocklist', 'hideViewed', 'hideApplied'], (data) => {
  (data.blacklist || []).forEach(addToList);
  (data.titleBlocklist || []).forEach(addTitleToList);

  hideViewedEl.checked = data.hideViewed ?? true;
  hideAppliedEl.checked = data.hideApplied ?? true;
});

function addToList(company) {
  const li = document.createElement('li');
  li.textContent = company;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'remove';
  removeBtn.style.marginLeft = '8px';
  removeBtn.style.cursor = 'pointer';

  removeBtn.onclick = () => {
    chrome.storage.sync.get(['blacklist'], (data) => {
      const newList = (data.blacklist || []).filter((c) => c !== company);
      chrome.storage.sync.set({ blacklist: newList }, () => location.reload());
    });
  };

  li.appendChild(removeBtn);
  blacklistEl.appendChild(li);
}

function addTitleToList(title) {
  const li = document.createElement('li');
  li.textContent = title;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'remove';
  removeBtn.style.marginLeft = '8px';
  removeBtn.style.cursor = 'pointer';

  removeBtn.onclick = () => {
    chrome.storage.sync.get(['titleBlocklist'], (data) => {
      const newList = (data.titleBlocklist || []).filter((t) => t !== title);
      chrome.storage.sync.set({ titleBlocklist: newList }, () => location.reload());
    });
  };

  li.appendChild(removeBtn);
  titleListEl.appendChild(li);
}

addBtn.onclick = () => {
  const company = input.value.trim();
  if (!company) return;

  chrome.storage.sync.get(['blacklist'], (data) => {
    const list = new Set(data.blacklist || []);
    list.add(company);
    chrome.storage.sync.set({ blacklist: Array.from(list) }, () => location.reload());
  });
};

addTitleBtn.onclick = () => {
  const title = titleInput.value.trim();
  if (!title) return;

  chrome.storage.sync.get(['titleBlocklist'], (data) => {
    const list = new Set(data.titleBlocklist || []);
    list.add(title);
    chrome.storage.sync.set({ titleBlocklist: Array.from(list) }, () => location.reload());
  });
};

hideViewedEl.onchange = () =>
  chrome.storage.sync.set({ hideViewed: hideViewedEl.checked });

hideAppliedEl.onchange = () =>
  chrome.storage.sync.set({ hideApplied: hideAppliedEl.checked });
