function muteVideo() {
    const videos = document.getElementsByTagName('video');
    for (let video of videos) {
        if(!video.paused) {
            video.muted = true;
            video.style.filter = "brightness(0.1) blur(15px)";
        }
    }
}

function unmuteVideo(unmute, unblur) {
    const videos = document.getElementsByTagName('video');
    for (let video of videos) {
        if(unmute && video.muted) {
            video.muted = false;
        }
        if(unblur) {
          video.style.filter = "none";
        }
    }
}
function getElementCoordinates(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
function drawRedDot(x, y) {
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  dot.style.width = '5px';
  dot.style.height = '5px';
  dot.style.backgroundColor = 'red';
  dot.style.borderRadius = '50%';
  dot.style.zIndex = '9999';
  document.body.appendChild(dot);

  // Remove the dot after 2 seconds
  setTimeout(() => {
    document.body.removeChild(dot);
  }, 2000);
}
function getEventListeners(element) {
  if (!element || !element.__zone_symbol__originalInstance) {
    return null;
  }
  return element.__zone_symbol__originalInstance.eventListeners || {};
}
function executeEventListeners(element, eventType) {
  const listeners = getEventListeners(element);
  if (!listeners || !listeners[eventType]) {
    console.log(`No ${eventType} listeners found`);
    return;
  }

  listeners[eventType].forEach(listener => {
    try {
      listener.handler.call(element, new Event(eventType));
    } catch (error) {
      console.error(`Error executing ${eventType} listener:`, error);
    }
  });
}
function findAndClickSkipAdButton() {
    // Get all buttons and similar elements that might be skip ad buttons
    //const elements = document.querySelectorAll('button, div[role="button"], a[role="button"], [class*="skip"], [class*="ad"], [id*="skip"], [id*="ad"]');
    const elements = document.querySelectorAll('button, [class*="skip"], [class*="ad"], [id*="skip"], [id*="ad"]');
    
    for (const element of elements) {
        const text = element.textContent?.toLowerCase() || '';
        const id = element.id?.toLowerCase() || '';
        let classNames = '';
        if (element.className) {
            if (typeof element.className === 'string') {
                classNames = element.className.toLowerCase();
            } else {
                // Handle case where className is a DOMTokenList
                classNames = Array.from(element.classList).join(' ').toLowerCase();
            }
        }
        
        // Check if element matches skip ad criteria
        if ((text.includes('skip') && text.includes('ad')) ||
            (id.includes('skip') && id.includes('ad')) ||
            (classNames.includes('skip') && classNames.includes('ad'))) {
            
            if (element.tagName.toLowerCase() !== 'button') {
              //console.log('Skipping non-button element:', element);
                continue; // Skip to next element if not a button
            }
            // Check if element is visible
            const style = window.getComputedStyle(element);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              //console.log('Found skip ad button:', element);
                return simulateCompleteClick(element);
            }
        }
    }
    
    return false;
}
function simulateCompleteClick(element) {
    if (!element || getComputedStyle(element).display === "none") {
        return false;
    }

    // Get center coordinates of the element
    const { x, y } = getElementCoordinates(element);
    const adjustedX = x + 5;
    const adjustedY = y + 3;
    drawRedDot(adjustedX, adjustedY);
    // Array of event types to simulate
    const mouseEvents = [
        new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: adjustedX,
            clientY: adjustedY
        }),
        new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: adjustedX,
            clientY: adjustedY
        }),
        new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: adjustedX,
            clientY: adjustedY,
            button: 0,
            buttons: 1
        }),
        new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: adjustedX,
            clientY: adjustedY,
            button: 0,
            buttons: 0
        }),
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: adjustedX,
            clientY: adjustedY,
            button: 0,
            buttons: 0
        })
    ];

    try {
        // 1. Native click method
        element.click();

        // 2. Dispatch all mouse events in sequence
        mouseEvents.forEach(event => {
            element.dispatchEvent(event);
        });

        // 3. Try direct onclick handler if it exists
        if (element.onclick && typeof element.onclick === 'function') {
            element.onclick(new Event('click'));
        }

        // 4. Handle if it's a link
        if (element.tagName.toLowerCase() === 'a' && element.href) {
            window.location.href = element.href;
        }

        // 5. Focus and simulate enter key press
        if (element.focus) {
            element.focus();
            
            const enterEvents = [
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    keyCode: 13
                }),
                new KeyboardEvent('keypress', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    keyCode: 13
                }),
                new KeyboardEvent('keyup', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    keyCode: 13
                })
            ];

            enterEvents.forEach(event => {
                element.dispatchEvent(event);
            });
        }

        // 6. Try to trigger any potential React or other framework handlers
        const nativeInputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(nativeInputEvent);

        // 7. Trigger a change event
        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(changeEvent);

        return true;
    } catch (error) {
        console.error('Error simulating click:', error);
        return false;
    }
}
const AdChecker = (function() {
    let prevAdState = false;
    let wasVideoMutedBeforeAd = null; // Track original mute state
    function checkVideoMuteState() {
        const video = document.querySelector('video');
        return video ? video.muted : false;
    }
    function checkForAds() {
        const adElement = document.querySelector('.ad-showing');
        
        if (adElement) {
            muteVideo();
            if (!prevAdState) {
                // Store the video's mute state before muting
                wasVideoMutedBeforeAd = checkVideoMuteState();
                //console.log('Stored initial mute state:', wasVideoMutedBeforeAd);
            }
            prevAdState = true;
        } else {
            if (prevAdState) {
                if (wasVideoMutedBeforeAd === false) {
                  //console.log('Unmuting video because it was not muted before ad');
                    unmuteVideo(true,true);
                } else {
                  //console.log('Keeping video muted as it was muted before ad');
                    unmuteVideo(false,true);
                }
                wasVideoMutedBeforeAd = null;
            }
            prevAdState = false;
        }
        
        findAndClickSkipAdButton();
    }
    
    // Expose public methods
    return {
        checkForAds,
        getPrevState: () => prevAdState,
        setPrevState: (state) => { prevAdState = state; },
        // Optional: Expose mute state for debugging
        getMuteState: () => wasVideoMutedBeforeAd,
        getCurrentVideoMuteState: checkVideoMuteState
    };
})();
if(location.href.includes("www.youtube.com")) {
    setInterval(() => AdChecker.checkForAds(), 500);
} 
