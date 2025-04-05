document.addEventListener('DOMContentLoaded', function() {
    const blockingSwitch = document.getElementById('blockingSwitch');
    const usageTimeLimit = document.getElementById('usageTimeLimit');
    const saveUsageLimitBtn = document.getElementById('saveUsageLimit');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const statusMessage = document.getElementById('statusMessage');
    const timeRemaining = document.getElementById('timeRemaining');
    
    let originalTimeLimit = 0;
    let isProcessing = false;
    
    // Helper function to enable/disable all controls
    function setControlsState(enabled) {
        blockingSwitch.disabled = !enabled;
        usageTimeLimit.disabled = !enabled;
        saveUsageLimitBtn.disabled = !enabled;
        
        if (!enabled) {
            blockingSwitch.parentElement.classList.add('disabled');
            saveUsageLimitBtn.classList.add('disabled');
        } else {
            blockingSwitch.parentElement.classList.remove('disabled');
            saveUsageLimitBtn.classList.remove('disabled');
        }
    }
    
    // Function to update progress bar
    function updateProgressBar(percent) {
        progressBar.style.width = percent + '%';
    }
    
    // Function to show/hide progress bar
    function toggleProgressBar(show, message = '') {
        progressContainer.classList.toggle('hidden', !show);
        statusMessage.textContent = message;
        if (!show) {
            updateProgressBar(0);
            timeRemaining.textContent = '';
        }
    }
    
    // Function to handle delay with progress bar
    function handleDelay(seconds, message, callback) {
        toggleProgressBar(true, message);
        isProcessing = true;
        setControlsState(false);
        
        const startTime = Date.now();
        const totalTime = seconds * 1000;
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const percent = Math.min((elapsed / totalTime) * 100, 100);
            const secondsLeft = Math.ceil((totalTime - elapsed) / 1000);
            
            updateProgressBar(percent);
            timeRemaining.textContent = `Time remaining: ${secondsLeft} seconds`;
            
            if (elapsed < totalTime) {
                requestAnimationFrame(updateProgress);
            } else {
                toggleProgressBar(false);
                isProcessing = false;
                setControlsState(true);
                
                // Update usageTimeLimit disabled state based on blocking switch
                usageTimeLimit.disabled = !blockingSwitch.checked;
                
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(updateProgress);
    }

    // Load stored values from chrome.storage.sync
    chrome.storage.local.get(['blockingEnabled', 'usageTimeLimit'], function(result) {
        // Set the blocking switch based on stored value, default is off (false)
        blockingSwitch.checked = result.blockingEnabled || false;
        
        // Set the usage time limit field (if nothing stored, it remains empty)
        if(result.usageTimeLimit !== undefined) {
          usageTimeLimit.value = result.usageTimeLimit/60000;
          originalTimeLimit = result.usageTimeLimit/60000;
        }
        
        // Disable usage time limit input if blocking is off
        usageTimeLimit.disabled = !blockingSwitch.checked;
    });

    // Save the new blocking setting when the switch is toggled
    blockingSwitch.addEventListener('change', function() {
        if (isProcessing) return;
        
        const blocking = this.checked;
        
        // If turning ON blocking, apply immediately
        if (blocking) {
            chrome.storage.local.set({ 'blockingEnabled': blocking }, function() {
                console.log('Blocking setting is now:', blocking);
                usageTimeLimit.disabled = !blocking;
            });
        } 
        // If turning OFF blocking, delay by 15 seconds
        else {
            // Reset switch to ON during delay
            this.checked = true;
            
            handleDelay(15, "Waiting 15 seconds to disable blocking...", function() {
                blockingSwitch.checked = false;
                chrome.storage.local.set({ 'blockingEnabled': false }, function() {
                    console.log('Blocking setting is now: false');
                    usageTimeLimit.disabled = true;
                });
            });
        }
    });

    // Save the usage time limit when the button is clicked
    saveUsageLimitBtn.addEventListener('click', function() {
        if (isProcessing) return;
        
        const usageTimeLimitValue = parseInt(usageTimeLimit.value, 10);
        
        if (isNaN(usageTimeLimitValue)) {
            alert("Please enter a valid number for the usage time limit.");
            return;
        }
        
        // If decreasing time limit, apply immediately
        if (usageTimeLimitValue <= originalTimeLimit) {
            chrome.storage.local.set({ 'usageTimeLimit': usageTimeLimitValue*60*1000 }, function() {
                console.log('Usage time limit saved:', usageTimeLimitValue);
                originalTimeLimit = usageTimeLimitValue;
                alert("Usage time limit saved!");
            });
        } 
        // If increasing time limit, apply after delay
        else {
            const increaseAmount = usageTimeLimitValue - originalTimeLimit;
            const delaySeconds = Math.max(10, 10 * Math.pow(Math.log10(increaseAmount), 2));
            
            handleDelay(
                delaySeconds, 
                `Waiting ${delaySeconds.toFixed(1)} seconds to increase usage limit...`,
                function() {
                    chrome.storage.local.set({ 'usageTimeLimit': usageTimeLimitValue*60*1000 }, function() {
                        console.log('Usage time limit saved:', usageTimeLimitValue);
                        originalTimeLimit = usageTimeLimitValue;
                        alert("Usage time limit saved!");
                    });
                }
            );
        }
    });
}); 