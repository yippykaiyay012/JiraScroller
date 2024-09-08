chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ isEnabled: true });
});

chrome.action.onClicked.addListener((tab) => {
    chrome.storage.sync.get(['isEnabled'], (result) => {
        const newState = !result.isEnabled;
        chrome.storage.sync.set({ isEnabled: newState }, () => {
            updateIcon(newState);
            chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension', isEnabled: newState });
        });
    });
});

function updateIcon(isEnabled) {
    const iconPath = isEnabled ? 'icon.png' : 'icon_disabled.png';
    chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getState') {
        chrome.storage.sync.get(['isEnabled'], (result) => {
            sendResponse({ isEnabled: result.isEnabled });
        });
        return true;
    }
});