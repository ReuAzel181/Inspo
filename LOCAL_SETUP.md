# Setup Instructions - Local Storage & Auto Screenshots

## What Changed

Your app now:
1. **Stores references locally** in a JSON file (`.data/references.json`) instead of PostgreSQL
2. **Auto-generates screenshots** when you add a reference
3. **Still allows manual editing** of all fields including images

## How to Get Started

### 1. Restart Your Dev Server
```bash
# Kill the current server (Ctrl+C in the terminal)
# Then restart it:
npm run dev
```

### 2. Add a Reference
- Paste a URL (like your Envato link)
- Click "Add"
- Reference is created immediately
- Screenshot generates in the background

### 3. Monitor Screenshot Generation
- Check the terminal for logs like: "Starting background screenshot generation"
- Screenshot appears in the reference when ready
- No need to refresh manually

## Screenshot Services

The app tries to capture screenshots in this order:

1. **External API** (if configured):
   ```
   SCREENSHOT_API_URL=https://api.screenshotapi.io/v1/screenshot
   SCREENSHOT_API_KEY=your_api_key
   ```

2. **Free ScreenshotOne API** (automatic fallback)
   - No configuration needed
   - Works out of the box
   - May have rate limits

## Local Storage Details

- **Data file**: `.data/references.json`
- **Screenshots**: `public/screenshots/` directory
- Both are in `.gitignore` (won't be committed)
- Persist between server restarts
- Fully local - no cloud dependency

## Manual Override

If auto-screenshot fails or you want a custom image:
1. Click the reference to open it
2. Click **✎ Edit**
3. Paste an image URL in the screenshot field
4. Click **✓ Save Changes**

## Troubleshooting

**Screenshots not generating?**
- Check server logs for errors
- Try adding a different URL
- Verify internet connection
- Some sites may block screenshot services

**Want to clear all data?**
- Delete `.data/references.json`
- Delete `public/screenshots/` folder
- Restart server

**Performance issues?**
- Screenshot generation is async (doesn't block UI)
- Large screenshots saved to `public/screenshots/`
- Both folders are git-ignored
