import { waitForElm } from './utils.js';

export function hideTrendingBar() { // Working
    waitForElm("#chips").then(ele => {
        ele.classList.add('none')
    });
}

export function hideShortsButton() { // Working
    waitForElm("#sections > ytd-guide-section-renderer > div#items").then(ele => {
        ele.querySelectorAll("ytd-guide-entry-renderer")[1].classList.add('none');
    })
}

export function clearTopBar() { // Working
    waitForElm("#container.style-scope.ytd-masthead").then(ele => {
        try {
            ele.querySelector("#end").remove();
            ele.querySelector("#start").remove();
            ele.querySelector("#center").classList.add('center');
        } catch (e) {
            // console.log(e);
        }

    })
}

export function hideExplore() { // Working
    waitForElm('#sections').then(ele => {

        const intervalId = setInterval(() => {
            for (const item of Array.from(ele.children)) {
                if (item.querySelector('h3') && item.querySelector('h3').innerText === 'Explore') {
                    item.remove();
                    clearInterval(intervalId);
                }
            }
        }, 500);
    });
}

export function hideShorts() { // Working
    const intervalId = setInterval(() => {
        try {
            document.querySelectorAll("#overlays > ytd-thumbnail-overlay-time-status-renderer > div.thumbnail-overlay-badge-shape.style-scope.ytd-thumbnail-overlay-time-status-renderer > badge-shape > div").forEach(item => {
                if (item.innerText.toLowerCase() === "shorts") {
                    // Find the parent ytd-rich-item-renderer or ytd-grid-video-renderer and remove it
                    const parentVideo = item.closest('div#dismissible');
                    if (parentVideo) {
                        parentVideo.remove();
                    }
                }
            });
        } catch (e) {
            console.log(e);
        }

        try {
            document.querySelectorAll("ytd-reel-shelf-renderer").forEach(item => {
                item.remove();
            });
        } catch (e) {
            console.log(e);
        }
    }, 1000);
}