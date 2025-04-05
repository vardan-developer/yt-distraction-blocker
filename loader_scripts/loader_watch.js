var videoPlayStartTimestamp = null;
var counterDiv = null;
var counterDivSetInterval = null;

// Function to get the element when it appears on the page
function getElementWhenLoadedByClassName(selector) {
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver((mutationsList, observer) => {
            // Look through all mutations that just occurred
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // Check if the element is now in the DOM
                    const element = document.getElementsByClassName(selector)[0];
                    if (element) {
                        observer.disconnect();
                        resolve(element);
                    }
                }
            }
        });

        // Start observing the document for child additions
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => reject('Element not found in time'), 10000);
    });
}

console.log("Watch script loaded");

// Add this near the top of the file
function updateWatchTime() {
    if (videoPlayStartTimestamp) {
        const playDuration = new Date().getTime() - videoPlayStartTimestamp;
        console.log('Play duration on URL change:', playDuration);
        chrome.runtime.sendMessage({ type: 'increment', value: playDuration });
        videoPlayStartTimestamp = null;
    }
}

// Add this message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'url-changed') {
        updateWatchTime();
    }
});

function startCounter() {
    if (counterDivSetInterval) return;
    chrome.runtime.sendMessage({type: 'get-counter'}, async (response) => {
        let totalVideoPlayTime = Math.ceil(response/1000);
        let minutes = Math.floor(totalVideoPlayTime/60);
        let seconds = totalVideoPlayTime % 60;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        counterDiv.textContent = `${minutes}:${seconds}`;
        counterDivSetInterval = setInterval(async () => {
            totalVideoPlayTime++;
            minutes = Math.floor(totalVideoPlayTime/60);
            seconds = totalVideoPlayTime % 60;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            counterDiv.textContent = `${minutes}:${seconds}`;
        }, 1000)
    })
}

getElementWhenLoadedByClassName('ytp-play-button')
    .then(playButton => {
        
        if (playButton.getAttribute('data-title-no-tooltip') === 'Pause') {
            videoPlayStartTimestamp = new Date().getTime();
        }

        const playButtonMutationObserver = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach((mutation) => {

                if (mutation.target.getAttribute('data-title-no-tooltip') === 'Pause') {
                    videoPlayStartTimestamp = new Date().getTime();
                    startCounter();
                } else {
                    if (videoPlayStartTimestamp) {
                        const playDuration = new Date().getTime() - videoPlayStartTimestamp;
                        console.log('Play duration:', playDuration);
                        chrome.runtime.sendMessage({ type: 'increment', value: playDuration });
                        videoPlayStartTimestamp = null;
                        clearInterval(counterDivSetInterval);
                        counterDivSetInterval = null;
                    }
                }
            });
        });

        playButtonMutationObserver.observe(playButton, {
            attributes: true,
            attributeFilter: ['data-title-no-tooltip']
        });
    })
    .catch(error => {
        console.error('Error: ', error);
    });

getElementWhenLoadedByClassName('style-scope ytd-masthead center')
    .then(siblingElement => {
        const parentElement = siblingElement.parentNode
        counterDiv = document.createElement('div');
        counterDiv.style.color = "white";
        counterDiv.style.fontSize = '14px';
        counterDiv.style.fontWeight = 'bold';
        counterDiv.style.padding = '8px 12px';
        counterDiv.style.backgroundColor = '#282828';
        counterDiv.style.borderRadius = '4px';
        counterDiv.style.margin = '0 10px';
        parentElement.appendChild(counterDiv);
        chrome.runtime.sendMessage({type: 'get-counter'}, async (response) => {
            let totalVideoPlayTime = Math.ceil(response/1000);
            let minutes = Math.floor(totalVideoPlayTime/60);
            let seconds = totalVideoPlayTime % 60;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            counterDiv.textContent = `${minutes}:${seconds}`;
        })
    })