(async () => {
    const src = chrome.runtime.getURL('scripts/all.js');
    const contentScript = await import(src);
    let blockingEnabled = false;
    chrome.runtime.sendMessage({ type: 'getBlockingState' }, async (response) => {
        blockingEnabled = response.blockingEnabled;
        if (blockingEnabled){
            contentScript.hideTrendingBar();
            contentScript.hideShortsButton();
            contentScript.clearTopBar();
            contentScript.hideExplore();
            contentScript.hideShorts();
        }
    });
})();   
