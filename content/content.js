// Content script for Pomodoro Timer overlay

// Global flag to prevent duplicate initialization
if (window.pomodoroOverlayInitialized) {
    console.log('[Pomodoro Overlay] Already initialized, skipping');
} else {
    window.pomodoroOverlayInitialized = true;

    class TimerOverlay {
        constructor() {
            this.overlay = null;
            this.isVisible = false;
            this.debugMode = true; // Enable debugging
            this.init();
        }

        log(message, data = null) {
            if (this.debugMode) {
                console.log(`[Pomodoro Overlay] ${message}`, data || '');
            }
        }

        // Helper method for safe Chrome API calls
        safeChromeCall(apiCall, fallback = null) {
            try {
                if (chrome && chrome.runtime) {
                    return apiCall();
                }
            } catch (error) {
                this.log('Chrome API call failed:', error);
            }
            return fallback;
        }

        // Helper method to send message to background
        sendMessage(action, data = null) {
            return this.safeChromeCall(() => {
                return chrome.runtime.sendMessage({ action, data });
            });
        }

        init() {
            this.log('Initializing overlay...');
            
            // Create overlay element
            this.createOverlay();
            
            // Listen for messages from background script
            this.safeChromeCall(() => {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    this.log('Received message:', message);
                    try {
                        if (message.action === 'updateTimer') {
                            this.log('Updating timer display:', message.data);
                            this.updateTimerDisplay(message.data);
                        } else if (message.action === 'showOverlay') {
                            this.log('Showing overlay');
                            this.show();
                        } else if (message.action === 'hideOverlay') {
                            this.log('Hiding overlay');
                            this.hide();
                        } else if (message.action === 'updateTimerState') {
                            this.log('Updating timer state:', message.data);
                            this.updateTimerState(message.data);
                        }
                    } catch (error) {
                        this.log('Message handling error:', error);
                    }
                });
                this.log('Message listener set up successfully');
            });

            // Check if timer is running on page load (only once)
            this.checkTimerState();
        }

        createOverlay() {
            this.log('Creating overlay...');
            
            // Check if overlay already exists
            if (document.getElementById('pomodoro-timer-overlay')) {
                this.log('Overlay already exists, reusing');
                this.overlay = document.getElementById('pomodoro-timer-overlay');
                return;
            }

            this.overlay = document.createElement('div');
            this.overlay.id = 'pomodoro-timer-overlay';
            this.overlay.innerHTML = `
                <div class="timer-container">
                    <div class="timer-display clickable">
                        <span class="timer-time">--:--</span>
                    </div>
                    <button class="reset-btn">↺</button>
                </div>
            `;

            // Add event listeners for simplified interactions
            this.addSimplifiedListeners();
            this.insertOverlayIntoDOM();
            
            // Initially hidden
            this.overlay.style.display = 'none';
            this.log('Overlay created and hidden');
        }

        addSimplifiedListeners() {
            // Timer click handler - toggle pause/resume
            const timerDisplay = this.overlay.querySelector('.timer-display');
            timerDisplay.addEventListener('click', () => {
                this.log('Timer display clicked - toggling timer');
                this.sendMessage('toggleTimer');
            });

            // Reset button handler
            const resetBtn = this.overlay.querySelector('.reset-btn');
            resetBtn.addEventListener('click', () => {
                this.log('Reset button clicked');
                this.sendMessage('resetAndOpenPopup');
                this.hide();
            });
        }

        insertOverlayIntoDOM() {
            const insertMethods = [
                () => {
                    if (document.body) {
                        document.body.appendChild(this.overlay);
                        this.log('Overlay added to body successfully');
                        return true;
                    }
                    return false;
                },
                () => {
                    document.addEventListener('DOMContentLoaded', () => {
                        if (document.body) {
                            document.body.appendChild(this.overlay);
                            this.log('Overlay added to body after DOMContentLoaded');
                        }
                    });
                    return false;
                },
                () => {
                    setTimeout(() => {
                        if (document.body) {
                            document.body.appendChild(this.overlay);
                            this.log('Overlay added via timeout fallback');
                        }
                    }, 1000);
                    return false;
                }
            ];

            for (const method of insertMethods) {
                try {
                    if (method()) break;
                } catch (error) {
                    this.log('Overlay insertion method failed:', error);
                }
            }
        }

        show() {
            this.log('Show method called, current visibility:', this.isVisible);
            
            if (!this.overlay) {
                this.log('No overlay to show, creating one');
                this.createOverlay();
            }
            
            if (!this.isVisible) {
                // Make sure overlay is in DOM
                if (!document.body.contains(this.overlay)) {
                    this.log('Overlay not in DOM, re-adding');
                    document.body.appendChild(this.overlay);
                }
                
                // Show immediately without transition first
                this.overlay.style.display = 'block';
                this.overlay.style.transform = 'translateX(0)';
                this.overlay.classList.add('visible');
                this.isVisible = true;
                
                this.log('Overlay shown successfully');
            } else {
                this.log('Overlay already visible');
            }
        }

        hide() {
            this.log('Hide method called, current visibility:', this.isVisible);
            
            if (this.isVisible && this.overlay) {
                this.overlay.classList.remove('visible');
                setTimeout(() => {
                    if (this.overlay) {
                        this.overlay.style.display = 'none';
                        this.overlay.style.transform = 'translateX(100%)';
                    }
                }, 300); // Wait for transition
                this.isVisible = false;
                this.log('Overlay hidden');
            } else {
                this.log('Overlay already hidden or not available');
            }
        }

        updateTimerDisplay(timeString) {
            if (!this.overlay) {
                this.log('No overlay available for timer update');
                return;
            }
            
            const timeElement = this.overlay.querySelector('.timer-time');
            if (timeElement) {
                // Only update if the new time is different to prevent flickering
                if (timeElement.textContent !== timeString) {
                    timeElement.textContent = timeString;
                    this.log('Timer display updated:', timeString);
                }
            } else {
                this.log('Timer time element not found');
            }
        }

        updateTimerState(state) {
            if (!this.overlay) {
                this.log('No overlay available for state update');
                return;
            }
            
            const timerDisplay = this.overlay.querySelector('.timer-display');
            if (timerDisplay) {
                if (state.isPaused) {
                    timerDisplay.classList.add('paused');
                    this.log('Timer display set to paused state');
                } else {
                    timerDisplay.classList.remove('paused');
                    this.log('Timer display set to running state');
                }
            } else {
                this.log('Timer display element not found');
            }
        }

        async checkTimerState() {
            try {
                const result = await this.safeChromeCall(() => 
                    chrome.storage.local.get(['timerState', 'remainingSeconds'])
                );
                
                if (result) {
                    this.log('Timer state check result:', result);
                    
                    // Show overlay if timer is running OR paused (don't hide on pause)
                    if ((result.timerState === 'running' || result.timerState === 'paused') && result.remainingSeconds > 0) {
                        this.log('Timer is active, showing overlay');
                        this.show();
                        this.updateTimerDisplay(this.formatTime(result.remainingSeconds));
                    } else if (result.timerState === 'stopped' || result.remainingSeconds <= 0) {
                        this.log('Timer is stopped, hiding overlay');
                        this.hide();
                    }
                } else {
                    this.log('Chrome storage not available for state check');
                }
            } catch (error) {
                this.log('Error checking timer state:', error);
            }
        }

        formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    // Initialize overlay when content script loads
    function initializeOverlay() {
        try {
            console.log('[Pomodoro Overlay] Initializing overlay...');
            new TimerOverlay();
        } catch (error) {
            console.log('[Pomodoro Overlay] Error initializing overlay:', error);
            // Retry after a short delay
            setTimeout(initializeOverlay, 1000);
        }
    }

    // Try to initialize immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOverlay);
    } else {
        initializeOverlay();
    }
} 