let backgroundUsageTimeMessageQueue = Promise.resolve();
const API_KEY = "sk-VHJ1c3RlZEFQSUtleUZvclNlY3VyZUFjY2Vzcw=="
let previousUrl = new Map();
const serverUrl = "http://172.105.54.24:3000"


function generateUserID(){
    return (() => crypto.randomUUID())();
}

// Gets the userID from the extension's storage
async function getUserID(){
    const result = await  chrome.storage.local.get('userID-yt-intentor');
    return result['userID-yt-intentor'];
}

// Sends the data to the server
async function sendDataToServer(){
    chrome.storage.local.get('totalVideoPlayTime').then(async (result) => {
        const totalVideoPlayTime = result['totalVideoPlayTime'];
        if (totalVideoPlayTime === 0){
            return;
        }
        const userID = await getUserID();

        // Send data to the server
        fetch(serverUrl + '/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify({
                id: userID,
                time: totalVideoPlayTime
            })
        })
        .then(response => {
            if (!response.ok) {
                if(response.status === 401){
                    console.log('Unauthorized');
                }
                else if(response.status === 409){
                    fetch(serverUrl + '/put/' + userID, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': API_KEY
                        },
                        body: JSON.stringify({
                            id: userID,
                            time: totalVideoPlayTime
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Data sent to server:', data);
                    })
                    .catch(error => {
                        console.error('Error sending data to server:', error);
                    });
                }
                else{
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(data => {
            console.log('Data sent to server:', data);
        })
        .catch(error => {
            console.error('Error sending data to server:', error);
        });
    });
    chrome.storage.local.set({ 'totalVideoPlayTime': 0 });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle heartbeat messages from content scripts.
    
    backgroundUsageTimeMessageQueue = backgroundUsageTimeMessageQueue
        .then(() => new Promise((resolve, reject) => {
            // console.log('message', message);
            if (message.type === 'increment') {
                // console.log('Processing increment from tab:', sender.tab.id);

                chrome.storage.local.get(['totalVideoPlayTime', 'dailyVideoPlayTime', 'limitExceeded', 'usageTimeLimit']).then(async (result) => {
                    const currentCount = result['totalVideoPlayTime'] || 0;
                    const currentDailyCount = result['dailyVideoPlayTime'] || 0;
                    
                    const limitExceeded = result['limitExceeded'] || false;
                    const usageTimeLimit = result['usageTimeLimit'] || 99;

                    const newCount = currentCount + message.value;
                    const newDailyCount = currentDailyCount + message.value;
                    if(newDailyCount > usageTimeLimit){
                        await chrome.storage.local.set({ 'limitExceeded': true });
                    }
                    // console.log(`Incrementing total counter: ${currentCount} -> ${newCount}`);
                    // console.log(`Incrementing daily counter: ${currentDailyCount} -> ${newDailyCount}`);
                    // console.log(`Usage time limit: ${usageTimeLimit}`);
                    // console.log(`Limit exceeded: ${limitExceeded}`);
                    return chrome.storage.local.set({ 'totalVideoPlayTime': newCount, 'dailyVideoPlayTime': newDailyCount });
                })
                .then(() => {
                    sendResponse({ success: true });
                    resolve();
                })
                .catch(error => {
                    // console.error('Error in increment:', error);
                    sendResponse({ success: false, error: error.message });
                    reject(error);
                });
            } else if (message.type === 'get-counter') {
                chrome.storage.local.get('dailyVideoPlayTime').then(result => {
                    sendResponse(result['dailyVideoPlayTime'] || 0);
                    resolve();
                })
                .catch(error => {
                    // console.error('Error getting counter:', error);
                    sendResponse(0);
                    reject(error);
                });
            } else if (message.type === 'reset-counter') {
                chrome.storage.local.set({ 'totalVideoPlayTime': 0 })
                    .then(() => {
                        sendResponse({ success: true });
                        resolve();
                    })
                    .catch(error => {
                        // console.error('Error resetting counter:', error);
                        sendResponse({ success: false, error: error.message });
                        reject(error);
                    });
            } 
            else if (message.type === 'getBlockingState') {
                chrome.storage.local.get('blockingEnabled').then(result => {
                    sendResponse({ blockingEnabled: result.blockingEnabled });
                    resolve();
                });
            }
            else {
                resolve(); // For any other message type, just resolve immediately
            }
        }));

    return true; // Keep message port open for async response
});

// Function to reset daily video play time
function resetDailyVideoPlayTime() {
    chrome.storage.local.set({ 'dailyVideoPlayTime': 0 }).then(() => {
        // console.log('Daily video play time reset to 0');
    });
}

// Function to create the daily reset alarm
function createDailyResetAlarm() {
    chrome.alarms.get('resetDailyCounter', (alarm) => {
        if (!alarm) {
            chrome.alarms.create('resetDailyCounter', {
                when: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
            });
            // console.log('Daily reset alarm created');
        } else {
            // console.log('Daily reset alarm already exists');
        }
    });
}

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'resetDailyCounter') {
        resetDailyVideoPlayTime();
        chrome.storage.local.set({ 'limitExceeded': false });   
        createDailyResetAlarm();

    }
});

// On installation, reset the total video play time and set the userID if it doesn't exist
chrome.runtime.onInstalled.addListener(async () => {
    chrome.storage.local.set({ 'totalVideoPlayTime': 0,  'dailyVideoPlayTime': 0, 'limitExceeded': false}).then(() => {
        console.log('Total video play time reset to 0');
        console.log('Daily video play time reset to 0');
        console.log('Limit exceeded reset to false');
    });
    if (!await getUserID()){
        await chrome.storage.local.set({ 'userID-yt-intentor': generateUserID()});
    }
    
    chrome.tabs.query({url: "*://*.youtube.com/*"}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
        })
    })

    createDailyResetAlarm(); // Create the alarm only if it doesn't exist
});

async function getUrl(){
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0]) {
            const currentUrl = tabs[0].url;
            // console.log('Current URL:', currentUrl);
            return currentUrl;
        }
    } catch (error) {
        return undefined;
    }
}

// Sends the data to the server every minute
const interval = setInterval(async () => {
    await sendDataToServer();
    // Get current active tab URL

    
    const result = await chrome.storage.local.get(['usageTimeLimit', 'dailyVideoPlayTime', 'limitExceeded', 'blockingEnabled']);
    const usageTimeLimit = result['usageTimeLimit'];
    const dailyVideoPlayTime = result['dailyVideoPlayTime'];
    const blockingEnabled = result['blockingEnabled'];
    const limitExceededHere = dailyVideoPlayTime > usageTimeLimit;
    chrome.storage.local.set({ 'limitExceeded': limitExceededHere });
    // console.log('Limit exceeded:', limitExceededHere);
    // console.log('Blocking enabled:', blockingEnabled);
    // console.log('Daily video play time:', dailyVideoPlayTime);
    // console.log('Usage time limit:', usageTimeLimit);
    if(limitExceededHere && blockingEnabled){
        // console.log('Blocking all YouTube tabs');
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            tabs.forEach(tab => {
                if(tab.url.includes('youtube.com')){
                    // console.log('Blocking tab:', tab.url);
                    chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        files: ['loader_scripts/loader_block_all.js']
                    });
                }
            });
        });
    }
    const url = await getUrl();
    if (!url || !url.includes('youtube.com')){
        return;
    }
    let activeTabs = await chrome.tabs.query({active: true, currentWindow: true});
    activeTabs.forEach(tab => {
        if(previousUrl && previousUrl.has(tab.id)){
            if (previousUrl.get(tab.id) !== url){
                previousUrl.set(tab.id, url);
                chrome.tabs.reload(tab.id);
            }
        }
        else{
            previousUrl.set(tab.id, url);
        }
    });
}, 100);




// // Listen for changes in blockingEnabled. When it changes, reload all Youtube tabs.
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local' && changes.blockingEnabled) {
        console.log('Blocking mode changed, reloading YouTube tabs.');
        previousUrl = new Map();
        chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.reload(tab.id);
            });
        });
    }
    if (areaName === 'local' && changes.usageTimeLimit) {
        const result = await chrome.storage.local.get(['blockingEnabled','limitExceeded']);
        const blockingEnabled = result.blockingEnabled;
        const limitExceeded = result.limitExceeded;
        if (blockingEnabled && limitExceeded) {
            console.log('Usage time limit changed, reloading YouTube tabs.');
            chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.reload(tab.id);
                });
            });
        }
    }
});