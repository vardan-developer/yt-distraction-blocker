import { waitForElm } from './utils.js';

export function hideHome() { // Working
    const intervalId = setInterval(() => {
        try {
            waitForElm("#contents").then(ele => {
                ele.classList.add('none')
            });

        waitForElm("#masthead-ad").then(ele => {
                document.querySelectorAll("#masthead-ad").forEach(item => {
                    item.style.display = 'none';
                });
            });
        } catch (e) {
            console.log(e);
        }
    }, 100);
}