/**
 * Branding Configuration
 * 
 * Centralized place to customize the application branding.
 * Update these values to match your organization's branding.
 */

export const branding = {
  // Application Name
  appName: 'DIA',
  appTagline: 'Data Intelligence Assistant',
  appDescription: 'Your Enterprise Data Intelligence Assistant',

  // Logo Configuration
  logo: {
    // Set to true to use an image logo, false to use icon + text
    useImageLogo: false,
    
    // Path to your logo image (relative to public folder)
    // Example: '/logo.png' or '/images/company-logo.svg'
    imagePath: '/logo.png',
    
    // Alt text for logo image
    imageAlt: 'Company Logo',
    
    // Logo image dimensions
    imageWidth: 40,
    imageHeight: 40,
    
    // Icon configuration (used when useImageLogo is false)
    iconGradient: 'from-blue-600 to-indigo-600', // Tailwind gradient classes
    iconSize: 'w-6 h-6', // Icon size classes
  },

  // Colors (Tailwind classes)
  colors: {
    // Primary gradient (used for buttons, accents)
    primaryGradient: 'from-blue-600 to-indigo-600',
    primaryGradientHover: 'from-blue-700 to-indigo-700',
    
    // Text gradient (used for app name)
    textGradient: 'from-blue-600 to-indigo-600',
    
    // Accent colors
    accentColor: 'blue-600',
    accentColorHover: 'blue-700',
  },

  // Company Information
  company: {
    name: 'Your Company Name',
    website: 'https://yourcompany.com',
    supportEmail: 'support@yourcompany.com',
  },

  // Features to show/hide
  features: {
    showTeams: true,
    showSlackIntegration: true,
    showCLI: true,
  },

  // Footer (optional)
  footer: {
    show: false,
    text: '© 2024 Your Company. All rights reserved.',
    links: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
      { label: 'Support', url: '/support' },
    ],
  },
};

export default branding;
