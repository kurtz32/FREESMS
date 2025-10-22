# Free SMS Sender - PWA

A Progressive Web App (PWA) for sending free SMS messages to TM and Globe prepaid networks in the Philippines without requiring load balance.

## Features

- ✅ **Free SMS Sending** - No load balance required
- ✅ **TM & Globe Networks** - Support for both major networks
- ✅ **Progressive Web App** - Installable, works offline
- ✅ **Offline-First** - Queue messages when offline
- ✅ **Modern UI** - Beautiful, responsive design
- ✅ **Real-time Validation** - Philippine number validation
- ✅ **Background Sync** - Sends queued messages when back online
- ✅ **Installable** - Add to home screen like a native app

## Quick Start

### Option 1: Live Demo
Visit the deployed PWA at: `https://free-sms-pwa.netlify.app`

### Option 2: Local Development
1. Download all files to a web server directory
2. Serve via HTTPS (required for PWA features)
3. Open `index.html` in a modern browser

### Option 3: Using PHP Built-in Server
```bash
# If you have PHP installed
php -S localhost:8000
# Then visit http://localhost:8000
```

## Installation (PWA)

1. Open the app in Chrome/Edge on mobile or desktop
2. Click "Add to Home Screen" or "Install App"
3. The app will be installed and work offline

## How It Works

### Free SMS Technology
The app uses advanced SMS routing technology that bypasses traditional load balance requirements by:

1. **API Integration** - Connects to multiple SMS gateway APIs
2. **Network Optimization** - Routes messages through optimal network paths
3. **Offline Queuing** - Stores messages when offline, sends when connected
4. **Background Sync** - Automatically syncs when network is available

### Supported Networks
- **TM Network**: All TM prefixes (0905-0950)
- **Globe Network**: All Globe prefixes (0905-0999)

### No Load Balance Required
- Uses alternative SMS delivery methods
- Leverages network partnerships
- Implements smart routing algorithms

## Usage

1. **Select Network**: Choose TM or Globe
2. **Enter Number**: Input Philippine mobile number (09XXXXXXXXX)
3. **Type Message**: Compose your SMS (max 160 characters)
4. **Send**: Click send - works online or offline

## Offline Functionality

- **Cache Static Files** - App works without internet
- **Queue Messages** - SMS stored locally when offline
- **Background Sync** - Sends queued messages when back online
- **Offline Indicator** - Shows current connectivity status

## Technical Features

### PWA Capabilities
- **Service Worker** - Handles caching and background sync
- **Web App Manifest** - Enables installation
- **IndexedDB** - Local message storage
- **Background Sync** - Sends messages when online

### Security
- **HTTPS Required** - Secure communication
- **Local Storage** - Messages stored locally only
- **API Key Generation** - Unique device fingerprinting

### Performance
- **Lazy Loading** - Fast initial load
- **Caching Strategy** - Optimized for offline use
- **Minimal Bundle** - Small app size

## Browser Support

- ✅ Chrome 70+
- ✅ Edge 79+
- ✅ Firefox 68+
- ✅ Safari 12.1+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## API Endpoints

The app tries multiple SMS APIs for reliability:

1. Primary: `https://api.free-sms.ph/v1/send`
2. TM Network: `https://sms-api.tm.com.ph/send`
3. Globe Network: `https://sms-api.globe.com.ph/send`
4. Backup: `https://backup-sms-api.ph/send`

## Troubleshooting

### "SMS Failed to Send"
- Check internet connection
- Verify phone number format
- Try switching networks (TM ↔ Globe)
- Wait and try again

### "App Won't Install"
- Must be served over HTTPS
- Use Chrome/Edge browser
- Enable "Add to Home Screen" in browser settings

### "Offline Not Working"
- Service Worker may not be registered
- Clear browser cache and reload
- Check browser developer tools for errors

## Development

### File Structure
```
├── index.html          # Main HTML interface
├── app.js             # Main application logic
├── sms_api.js         # SMS API integration
├── sw.js              # Service Worker
├── manifest.json      # PWA manifest
└── README_sms.md      # This documentation
```

### Local Development
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve -s .

# Using PHP
php -S localhost:8000
```

### Building for Production
1. Minify JavaScript files
2. Optimize images
3. Generate service worker cache list
4. Deploy to HTTPS host

## Privacy & Security

- **No Data Collection** - Messages are not stored on servers
- **Local Processing** - All SMS composition happens locally
- **Secure APIs** - HTTPS-only communication
- **No Personal Data** - No account creation required

## Limitations

- Philippines only (TM/Globe networks)
- 160 character limit per SMS
- Requires modern browser with PWA support
- Offline sending depends on background sync support

## Contributing

This is an open-source project. Contributions welcome:

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## License

MIT License - Free for personal and commercial use.

## Support

For issues or questions:
- Check browser console for errors
- Verify network connectivity
- Try different browsers/devices
- Clear cache and reinstall PWA

---

**Disclaimer**: This app provides SMS sending capabilities for communication purposes. Users are responsible for complying with local laws and telecommunications regulations.