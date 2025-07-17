# Pomodoro Timer Chrome Extension

A sleek and lightweight Pomodoro timer Chrome extension for enhanced productivity. Start your timer on any Chrome tab and stay focused with customizable time presets.

## Features

- ⏱️ **25-minute Pomodoro timer** (default)
- 🎯 **Quick preset buttons** (5m, 10m, 15m, 25m, 30m, 45m, 60m)
- ⚙️ **Custom timer input** (1-999 minutes)
- 🎨 **Sleek, modern UI** with smooth animations
- 📱 **Responsive design** that works on any screen size
- 🔔 **Desktop notifications** when timer completes
- 🔊 **Audio alerts** for timer completion
- 💾 **Persistent timer state** across browser sessions
- 🌐 **Tab overlay** - see timer on any webpage
- 📊 **Visual progress ring** showing time remaining
- 🏷️ **Extension badge** showing remaining time

## Installation

### For Development/Testing:

1. **Download or clone** this repository to your local machine

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** by toggling the switch in the top-right corner

4. **Click "Load unpacked"** and select the folder containing this extension

5. **Pin the extension** to your toolbar for easy access

### For Production:

The extension can be packaged and distributed through the Chrome Web Store (requires developer account and review process).

## Usage

### Basic Timer Operation:

1. **Click the extension icon** in your Chrome toolbar
2. **Select a preset** or enter a custom time
3. **Click "Start"** to begin the timer
4. **Use "Pause"** to pause/resume the timer
5. **Click "Reset"** to reset to the original time

### Timer Presets:

- **5m** - Quick breaks
- **10m** - Short tasks
- **15m** - Medium tasks
- **25m** - Standard Pomodoro (default)
- **30m** - Extended focus sessions
- **45m** - Long tasks
- **60m** - Extended sessions

### Custom Timer:

1. Enter any number of minutes (1-999) in the custom input field
2. Click "Set" or press Enter
3. The timer will be set to your custom duration

### Tab Overlay:

- When a timer is running, a small overlay appears on any webpage
- The overlay shows the current time and basic controls
- Click the overlay buttons to control the timer from any tab

### Notifications:

- Desktop notifications appear when the timer completes
- Audio alerts play to notify you of completion
- The extension badge shows remaining time while running

## File Structure

```
Chrome Pomodoro Timer/
├── manifest.json              # Extension configuration
├── popup/
│   ├── popup.html            # Main popup interface
│   ├── popup.css             # Popup styling
│   └── popup.js              # Popup functionality
├── background/
│   └── background.js         # Background script
├── content/
│   ├── content.js            # Content script
│   └── content.css           # Overlay styling
├── icons/                    # Extension icons (to be added)
└── README.md                 # This file
```

## Technical Details

### Permissions Used:

- `storage` - Save timer state across sessions
- `notifications` - Show completion notifications
- `activeTab` - Access current tab for overlay
- `tabs` - Manage tab interactions

### Key Features:

- **Manifest V3** - Latest Chrome extension standard
- **Service Worker** - Background script for persistent functionality
- **Content Scripts** - Inject overlay into web pages
- **Chrome Storage API** - Persistent data storage
- **Chrome Notifications API** - Desktop notifications
- **Audio Context API** - Custom notification sounds

## Customization

### Changing Default Timer:

Edit `popup/popup.js` line 3:
```javascript
this.totalSeconds = 25 * 60; // Change 25 to your preferred default
```

### Adding New Presets:

Edit `popup/popup.html` to add new preset buttons:
```html
<button class="preset-btn" data-time="20">20m</button>
```

### Styling Modifications:

- Edit `popup/popup.css` for popup styling
- Edit `content/content.css` for overlay styling
- Colors and gradients can be customized in the CSS files

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Development

### Testing Changes:

1. Make your modifications to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

### Debugging:

- Use Chrome DevTools on the popup (right-click extension icon → Inspect)
- Check the background script in the extensions page
- View console logs in the extension's background page

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

---

**Happy Pomodoro-ing! 🍅⏰** 