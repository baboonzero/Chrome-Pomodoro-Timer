// Background script for Pomodoro Timer extension - Single Source of Truth

class TimerManager {
    constructor() {
        this.timerInterval = null;
        this.remainingSeconds = 0;
        this.totalSeconds = 25 * 60; // Default 25 minutes
        this.isRunning = false;
        this.isPaused = false;
        this.currentPreset = 25;
        this.debugMode = true; // Enable debugging
        
        this.initialize();
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[Pomodoro Background] ${message}`, data || '');
        }
    }

    async initialize() {
        // Load saved state on startup
        await this.loadState();
        
        // Set up message listeners
        this.setupMessageListeners();
        
        // Set initial badge
        this.updateBadge();
        
        // Resume timer if it was running
        if (this.isRunning && this.remainingSeconds > 0) {
            this.startTimer();
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.log('Received message:', message.action);
            
            switch (message.action) {
                case 'start':
                case 'overlayStart':
                    this.startTimer();
                    break;
                case 'pause':
                case 'overlayPause':
                    this.pauseTimer();
                    break;
                case 'reset':
                case 'overlayReset':
                    this.resetTimer();
                    break;
                case 'resetAndOpenPopup':
                    this.resetTimer();
                    // Open popup after a short delay to ensure reset is processed
                    setTimeout(() => {
                        try {
                            chrome.action.openPopup();
                        } catch (error) {
                            this.log('Could not open popup:', error);
                        }
                    }, 100);
                    break;
                case 'toggleTimer':
                    this.toggleTimer();
                    break;
                case 'setPreset':
                    this.setPreset(message.data);
                    break;
                case 'setCustom':
                    this.setCustomTimer(message.data);
                    break;
                case 'getState':
                    // Send immediate response for state requests
                    const state = this.getState();
                    sendResponse(state);
                    break;
            }
            
            // Always return false to indicate no async response
            return false;
        });
    }

    // Toggle timer between start/pause
    toggleTimer() {
        this.log('Toggling timer state');
        if (this.isRunning) {
            this.pauseTimer();
        } else if (this.isPaused) {
            this.startTimer();
        } else {
            // Timer is stopped, start it
            this.startTimer();
        }
    }

    // Helper method to get valid tabs for overlay operations
    getValidTabs() {
        return new Promise((resolve) => {
            chrome.tabs.query({}, (tabs) => {
                const validTabs = tabs.filter(tab => 
                    tab.url && 
                    !tab.url.startsWith('chrome://') && 
                    !tab.url.startsWith('chrome-extension://')
                );
                resolve(validTabs);
            });
        });
    }

    // Helper method to send message to all valid tabs
    async sendMessageToAllTabs(message) {
        const validTabs = await this.getValidTabs();
        this.log('Found valid tabs:', validTabs.length);
        
        validTabs.forEach(tab => {
            this.log('Sending message to tab:', tab.id, tab.url);
            try {
                chrome.tabs.sendMessage(tab.id, message).then(() => {
                    this.log('Message sent successfully to tab:', tab.id);
                }).catch((error) => {
                    this.log('Failed to send message to tab:', tab.id, error);
                });
            } catch (error) {
                this.log('Error sending message to tab:', tab.id, error);
            }
        });
    }

    // Helper method to inject content script into existing tabs
    async injectContentScripts() {
        const validTabs = await this.getValidTabs();
        this.log('Injecting content scripts into existing tabs:', validTabs.length);
        
        validTabs.forEach(tab => {
            try {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content/content.js']
                }).then(() => {
                    this.log('Content script injected into tab:', tab.id);
                }).catch((error) => {
                    this.log('Failed to inject content script into tab:', tab.id, error);
                });
            } catch (error) {
                this.log('Error injecting content script into tab:', tab.id, error);
            }
        });
    }

    async loadState() {
        try {
            const result = await chrome.storage.local.get([
                'timerState',
                'remainingSeconds',
                'totalSeconds',
                'currentPreset'
            ]);

            if (result.timerState) {
                this.isRunning = result.timerState === 'running';
                this.isPaused = result.timerState === 'paused';
                this.remainingSeconds = result.remainingSeconds || this.totalSeconds;
                this.totalSeconds = result.totalSeconds || this.totalSeconds;
                this.currentPreset = result.currentPreset || 25;
            } else {
                // Set default state if no saved state exists
                this.remainingSeconds = this.totalSeconds;
                this.currentPreset = 25;
            }
        } catch (error) {
            console.log('Error loading state:', error);
        }
    }

    async saveState() {
        try {
            await chrome.storage.local.set({
                timerState: this.isRunning ? 'running' : (this.isPaused ? 'paused' : 'stopped'),
                remainingSeconds: this.remainingSeconds,
                totalSeconds: this.totalSeconds,
                currentPreset: this.currentPreset
            });
        } catch (error) {
            console.log('Error saving state:', error);
        }
    }

    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            remainingSeconds: this.remainingSeconds,
            totalSeconds: this.totalSeconds,
            currentPreset: this.currentPreset,
            timeString: this.formatTime(this.remainingSeconds)
        };
    }

    startTimer() {
        this.log('Starting timer...');
        if (this.isRunning) {
            this.log('Timer already running, ignoring start');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.log('Timer started, injecting content scripts and showing overlay on all tabs');
        // Inject content scripts into existing tabs first
        this.injectContentScripts().then(() => {
            // Small delay to ensure content scripts are initialized
            setTimeout(() => {
                // Show overlay on all tabs
                this.showOverlayOnAllTabs();
                // Send initial overlay update
                this.updateOverlayOnAllTabs();
                // Send timer state update
                this.updateOverlayTimerState();
            }, 500);
        });
        
        // Update badge immediately
        this.updateBadge();
        
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            
            // Update badge and overlay
            this.updateBadge();
            this.updateOverlayOnAllTabs();
            
            // Send real-time update to popup
            this.notifyPopup('timerUpdate', {
                remainingSeconds: this.remainingSeconds,
                timeString: this.formatTime(this.remainingSeconds)
            });
            
            if (this.remainingSeconds <= 0) {
                this.timerComplete();
            }
        }, 1000);

        this.saveState();
        this.notifyPopup('timerStarted');
        this.log('Timer start completed');
    }

    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.updateBadge();
        // Don't hide overlay on pause - keep it visible
        this.updateOverlayTimerState();
        this.saveState();
        this.notifyPopup('timerPaused');
    }

    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.remainingSeconds = this.totalSeconds;
        this.updateBadge();
        this.hideOverlayOnAllTabs();
        this.updateOverlayTimerState();
        this.saveState();
        this.notifyPopup('timerReset');
        this.log('Timer reset completed');
    }

    setPreset(minutes) {
        this.currentPreset = minutes;
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        
        this.updateBadge();
        this.saveState();
        this.notifyPopup('presetChanged', { preset: minutes });
    }

    setCustomTimer(minutes) {
        if (minutes && minutes > 0 && minutes <= 999) {
            this.setPreset(minutes);
        }
    }

    timerComplete() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.isRunning = false;
        this.isPaused = false;
        
        // Reset to original time instead of 0
        this.remainingSeconds = this.totalSeconds;
        
        this.updateBadge();
        this.hideOverlayOnAllTabs();
        this.saveState();
        this.showTimerCompleteNotification();
        this.notifyPopup('timerCompleted');
    }

    updateBadge() {
        if (this.remainingSeconds <= 0) {
            chrome.action.setBadgeText({ text: '' });
            return;
        }
        
        const timeString = this.formatTime(this.remainingSeconds);
        chrome.action.setBadgeText({ text: timeString });
        chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
    }

    updateOverlayOnAllTabs() {
        if (this.remainingSeconds <= 0) {
            return;
        }
        const timeString = this.formatTime(this.remainingSeconds);
        this.log('Updating overlay on all tabs with time:', timeString);
        // Fire-and-forget async
        this.sendMessageToAllTabs({
            action: 'updateTimer',
            data: timeString
        });
    }

    showOverlayOnAllTabs() {
        this.log('Showing overlay on all tabs');
        // Fire-and-forget async
        this.sendMessageToAllTabs({
            action: 'showOverlay'
        });
    }

    hideOverlayOnAllTabs() {
        this.log('Hiding overlay on all tabs');
        // Fire-and-forget async
        this.sendMessageToAllTabs({
            action: 'hideOverlay'
        });
    }

    notifyPopup(action, data = null) {
        try {
            chrome.runtime.sendMessage({ action, data }).catch(() => {
                // Popup might not be open, ignore error
            });
        } catch (error) {
            // Ignore connection errors
        }
    }

    showTimerCompleteNotification() {
        // Create notification with proper icon path
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: 'Pomodoro Timer',
            message: 'Time is up! Your Pomodoro session has completed.',
            priority: 2
        });
        
        // Play notification sound
        this.playNotificationSound();
        
        // Update badge
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#48bb78' });
        
        // Reset badge after 5 seconds
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 5000);
    }

    playNotificationSound() {
        try {
            chrome.tts.speak('Timer completed', {
                rate: 1.0,
                pitch: 1.0,
                volume: 0.7,
                lang: 'en-US'
            });
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateOverlayTimerState() {
        this.log('Updating overlay timer state');
        this.sendMessageToAllTabs({
            action: 'updateTimerState',
            data: {
                isRunning: this.isRunning,
                isPaused: this.isPaused,
                remainingSeconds: this.remainingSeconds,
                totalSeconds: this.totalSeconds,
                currentPreset: this.currentPreset,
                timeString: this.formatTime(this.remainingSeconds)
            }
        });
    }
}



// Initialize timer manager
const timerManager = new TimerManager();

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.action.openPopup();
});

// Handle new tabs - inject content script if timer is running
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        tab.url && 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('chrome-extension://') &&
        timerManager.isRunning) {
        
        timerManager.log('New tab loaded, injecting content script and showing overlay');
        
        // Inject content script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        }).then(() => {
            // Small delay to ensure content script is initialized
            setTimeout(() => {
                // Show overlay and send current timer state
                chrome.tabs.sendMessage(tabId, { action: 'showOverlay' });
                chrome.tabs.sendMessage(tabId, {
                    action: 'updateTimer',
                    data: timerManager.formatTime(timerManager.remainingSeconds)
                });
            }, 500);
        }).catch((error) => {
            timerManager.log('Failed to inject content script into new tab:', error);
        });
    }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Pomodoro Timer extension installed');
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Pomodoro Timer extension started');
}); 