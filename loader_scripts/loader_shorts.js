// Heartbeat: notify the background service worker that loader_all.js is loaded.

function hideShorts(){
    document.querySelector("#page-manager").remove();
}

(async () => {
    var blockingEnabled = false;
    chrome.runtime.sendMessage({ type: 'getBlockingState' }, async (response) => {
        console.log('response', response);
        blockingEnabled = response.blockingEnabled;
        if (blockingEnabled){
            console.log('blockingEnabled', blockingEnabled);
            hideShorts();
        }
    });
})();