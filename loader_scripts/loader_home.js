(async () => {
    
    const src = chrome.runtime.getURL('scripts/home.js');
    const contentScript = await import(src);

    // Heartbeat: notify the background service worker that loader_all.js is loaded.
    let blockingEnabled = false;
    chrome.runtime.sendMessage({ type: 'getBlockingState' }, async (response) => {
        blockingEnabled = response.blockingEnabled;
        if (blockingEnabled){
            contentScript.hideHome();
        }
    });
})(); 