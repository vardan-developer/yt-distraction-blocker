// content_scripts/pause_video.js
(function() {
    // Function to pause the video
    function pauseVideo() {
        const video = document.querySelector('video');
        if (video) {
            video.pause();
            console.log('Video paused');
        } else {
            console.log('No video found to pause');
        }
    }

    // Call the function to pause the video
    pauseVideo();
})(); 