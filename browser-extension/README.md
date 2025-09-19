# Pokemayne Recorder Browser Extension

A stealthy browser extension for recording e-commerce automation workflows. The extension acts as a "sentry" that connects to the Pokemayne UI (mothership) running on your local machine.

## Features

✅ **Maximum Stealth**: Advanced anti-detection techniques
✅ **UI-Dependent**: Cannot operate without connection to main UI
✅ **Persistent State**: Maintains recording through navigation and refreshes
✅ **Real-time Communication**: WebSocket connection to UI
✅ **Visual Indicators**: Connection and recording status lights

## Installation

1. **Build the extension** (if needed):
   ```bash
   # No build step required - pure JavaScript
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension` folder

3. **Pin the extension** to your toolbar for easy access

## Usage

### Prerequisites
- Pokemayne UI must be running on `localhost:3001`
- WebSocket endpoint `/ws/extension` must be available

### Basic Workflow

1. **Start Pokemayne UI** on your local machine
2. **Click the extension icon** in your browser toolbar
3. **Check connection status**:
   - 🟢 Green light = Connected to UI
   - 🔴 Red light = Disconnected
4. **Start recording**:
   - Click "START" button (only enabled when connected)
   - Recording light turns red and starts pulsing
5. **Navigate and interact** with websites normally
6. **Stop recording**:
   - Click "STOP" button
   - Data is sent to UI and saved

### Status Indicators

**Connection Light**:
- 🟢 **Green**: Connected to Pokemayne UI
- 🔴 **Red**: Disconnected from UI

**Recording Light**:
- 🔴 **Red (pulsing)**: Currently recording
- ⚪ **Gray**: Idle (not recording)

## Architecture

```
Browser Extension (Local)  ←→  Pokemayne UI (Local)  ←→  Backend (Remote)
     (Sentry)                      (Mothership)              (Database)
```

### Components

**Background Script** (`background.js`):
- Manages WebSocket connection to UI
- Coordinates recording state across tabs
- Persists state through browser restarts
- Auto-reconnects to UI

**Content Script** (`content.js`):
- Captures user interactions (clicks, keystrokes, forms)
- Monitors DOM changes and navigation
- Generates multiple selector types for reliability
- Filters sensitive data (passwords, tokens)

**Injected Script** (`injected.js`):
- Runs in page context for network monitoring
- Intercepts fetch() and XMLHttpRequest calls
- Applies anti-detection techniques
- Spoofs browser automation signatures

**Popup** (`popup.html/js`):
- Simple control interface
- Real-time status display
- Start/Stop recording controls
- Connection diagnostics

## Stealth Features

### Anti-Detection Techniques
- **WebDriver Property Hiding**: Removes `navigator.webdriver`
- **Plugin Spoofing**: Simulates real browser plugins
- **Language Spoofing**: Sets realistic language preferences
- **Timing Jitter**: Adds random delays to avoid patterns
- **Chrome Runtime Masking**: Hides extension-related properties

### Data Protection
- **Password Filtering**: Automatically excludes password fields
- **Token Redaction**: Removes sensitive tokens from recordings
- **Selector Diversity**: Generates multiple backup selectors
- **Network Sanitization**: Filters auth headers and tokens

## State Persistence

The extension maintains recording state across:
- **Page Navigation**: Recording continues on new pages
- **Page Refresh**: State restored after reload
- **Browser Restart**: Extension remembers last session
- **Tab Switching**: Recording works across multiple tabs

## Development

### File Structure
```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (main logic)
├── content.js            # Page interaction capture
├── injected.js           # Page context monitoring
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── icons/                # Extension icons
└── README.md             # This file
```

### Key APIs Used
- **Chrome Extensions API**: Core extension functionality
- **WebSocket**: Real-time communication with UI
- **Storage API**: Persistent state management
- **Tabs API**: Cross-tab coordination
- **WebNavigation API**: Navigation tracking

### Communication Flow
```
Content Script → Background Script → WebSocket → UI → Backend
```

1. Content script captures user actions
2. Background script coordinates and persists data
3. WebSocket sends real-time updates to UI
4. UI processes and forwards to remote backend
5. Backend stores final automation scripts

## Troubleshooting

### Extension Not Working
- Check if UI is running on `localhost:3001`
- Verify WebSocket endpoint is available
- Check browser console for errors
- Try reloading the extension

### Connection Issues
- Ensure no firewall blocking localhost:3001
- Check if another service is using port 3001
- Verify SSH tunnel if using remote UI

### Recording Not Capturing
- Check if extension has necessary permissions
- Verify content script is loaded on the page
- Look for JavaScript errors in page console
- Try refreshing the page and restarting recording

## Security Notes

- Extension only works when connected to local UI
- No standalone operation possible
- All data flows through your local machine
- Sensitive data is automatically filtered
- WebSocket uses unencrypted localhost connection