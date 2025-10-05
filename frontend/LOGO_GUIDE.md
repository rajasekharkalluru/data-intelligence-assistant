# Logo System Guide

## Centralized Logo Configuration

All logo and branding settings are centralized in `src/config/branding.js`.

## Components

### 1. Logo Component (`src/components/Logo.js`)
Main logo component used in headers and navigation.

**Usage:**
```jsx
import Logo from './components/Logo';

// Default size with text
<Logo darkMode={darkMode} />

// Large size without text
<Logo size="large" showText={false} />

// Small size
<Logo size="small" darkMode={darkMode} />
```

**Props:**
- `size`: 'small' | 'default' | 'large'
- `showText`: boolean (default: true)
- `darkMode`: boolean (default: false)

### 2. LogoIcon Component (`src/components/LogoIcon.js`)
Simplified logo icon for avatars and small spaces (e.g., chat messages).

**Usage:**
```jsx
import LogoIcon from './components/LogoIcon';

// Default size
<LogoIcon />

// Custom size
<LogoIcon size="w-8 h-8" />

// With custom className
<LogoIcon size="w-5 h-5" className="rounded-full shadow-lg" />
```

**Props:**
- `size`: Tailwind size classes (default: 'w-5 h-5')
- `className`: Additional CSS classes

## Where Logos Are Used

1. **Main Header** - `Logo` component in App.js
2. **Auth Form** - `Logo` component (large, no text)
3. **Chat Messages** - `LogoIcon` for assistant avatar
4. **Loading States** - `LogoIcon` for thinking indicator
5. **Browser Tab** - SVG favicon in `public/favicon.svg`

## Customization

### Change Logo Icon
Edit `src/config/branding.js`:
```javascript
logo: {
  iconGradient: 'from-blue-600 to-indigo-600', // Change gradient colors
}
```

### Use Image Logo Instead
Edit `src/config/branding.js`:
```javascript
logo: {
  useImageLogo: true,
  imagePath: '/logo.png', // Place image in public folder
  imageWidth: 40,
  imageHeight: 40,
}
```

### Change App Name/Title
Edit `src/config/branding.js`:
```javascript
appName: 'DIA',
appTagline: 'Data Intelligence Assistant',
```

The page title will automatically update to: "DIA - Data Intelligence Assistant"

### Change Favicon
Replace `public/favicon.svg` with your own SVG or add `favicon.ico`.

## Benefits of Centralization

✅ Single source of truth for all branding
✅ Consistent logo appearance across the app
✅ Easy to switch between icon and image logos
✅ Simple customization without touching multiple files
✅ Automatic page title updates
