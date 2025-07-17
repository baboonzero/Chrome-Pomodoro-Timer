class PomodoroTimerUI {
    constructor() {
        this.state = {
            isRunning: false,
            isPaused: false,
            remainingSeconds: 25 * 60,
            totalSeconds: 25 * 60,
            currentPreset: 25,
            timeString: '25:00'
        };

        this.initializeElements();
        this.bindEvents();
        this.loadState();
        this.setupMessageListener();
        
        // Set initial display
        this.updateDisplay();
    }

    initializeElements() {
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusText = document.getElementById('statusText');
        this.customMinutesInput = document.getElementById('customMinutes');
        this.setCustomBtn = document.getElementById('setCustomBtn');
        this.progressFill = document.querySelector('.progress-fill');
        this.presetButtons = document.querySelectorAll('.preset-btn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.setCustomBtn.addEventListener('click', () => this.setCustomTimer());

        // Preset button events
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.time);
                this.setPreset(minutes);
            });
        });

        // Custom input enter key
        this.customMinutesInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.setCustomTimer();
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'timerStarted':
                    this.updateState({
                        isRunning: true,
                        isPaused: false
                    });
                    this.updateStatus('Timer running...');
                    break;
                case 'timerPaused':
                    this.updateState({
                        isRunning: false,
                        isPaused: true
                    });
                    this.updateStatus('Timer paused');
                    break;
                case 'timerReset':
                    this.updateState({
                        isRunning: false,
                        isPaused: false,
                        remainingSeconds: this.state.totalSeconds
                    });
                    this.updateStatus('Timer reset');
                    break;
                case 'timerCompleted':
                    this.updateState({
                        isRunning: false,
                        isPaused: false,
                        remainingSeconds: this.state.totalSeconds
                    });
                    this.updateStatus('Timer completed! Ready to start again.');
                    this.showCompletionAnimation();
                    break;
                case 'presetChanged':
                    this.updateState({
                        currentPreset: message.data.preset,
                        totalSeconds: message.data.preset * 60,
                        remainingSeconds: message.data.preset * 60
                    });
                    this.updatePresetButtons(message.data.preset);
                    this.updateStatus(`Timer set to ${message.data.preset} minutes`);
                    break;
                case 'timerUpdate':
                    this.updateState({
                        remainingSeconds: message.data.remainingSeconds
                    });
                    break;
            }
        });
    }

    async loadState() {
        try {
            // Get current state from background
            const response = await chrome.runtime.sendMessage({ action: 'getState' });
            if (response) {
                this.updateState(response);
                this.updatePresetButtons(response.currentPreset);
            }
        } catch (error) {
            console.log('Error loading state:', error);
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.updateDisplay();
        this.updateProgressRing();
        this.updateButtonStates();
    }

    startTimer() {
        chrome.runtime.sendMessage({ action: 'start' });
    }

    pauseTimer() {
        chrome.runtime.sendMessage({ action: 'pause' });
    }

    resetTimer() {
        chrome.runtime.sendMessage({ action: 'reset' });
    }

    setPreset(minutes) {
        chrome.runtime.sendMessage({ action: 'setPreset', data: minutes });
    }

    setCustomTimer() {
        const minutes = parseInt(this.customMinutesInput.value);
        if (minutes && minutes > 0 && minutes <= 999) {
            chrome.runtime.sendMessage({ action: 'setCustom', data: minutes });
            this.customMinutesInput.value = '';
        } else {
            this.updateStatus('Please enter a valid time (1-999 minutes)');
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.state.remainingSeconds / 60);
        const seconds = this.state.remainingSeconds % 60;

        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    updateProgressRing() {
        const progress = (this.state.remainingSeconds / this.state.totalSeconds) * 100;
        const circumference = 2 * Math.PI * 54; // r = 54
        const offset = circumference - (progress / 100) * circumference;
        
        this.progressFill.style.strokeDashoffset = offset;
    }

    updateButtonStates() {
        this.startBtn.disabled = this.state.isRunning;
        this.pauseBtn.disabled = !this.state.isRunning;
        
        if (this.state.isRunning) {
            this.startBtn.textContent = 'Running...';
        } else if (this.state.isPaused) {
            this.startBtn.textContent = 'Resume';
        } else {
            this.startBtn.textContent = 'Start';
        }
    }

    updatePresetButtons(activePreset) {
        this.presetButtons.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === activePreset) {
                btn.classList.add('active');
            }
        });
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    showCompletionAnimation() {
        document.querySelector('.timer-display').classList.add('timer-complete');
        setTimeout(() => {
            document.querySelector('.timer-display').classList.remove('timer-complete');
        }, 3000);
    }
}

// Initialize the timer UI when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimerUI();
}); 