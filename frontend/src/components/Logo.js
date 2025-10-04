import { Brain } from 'lucide-react';
import branding from '../config/branding';

/**
 * Logo Component
 * 
 * Displays the application logo based on branding configuration.
 * Can show either an image logo or an icon with text.
 */
const Logo = ({ size = 'default', showText = true, darkMode = false }) => {
  const sizes = {
    small: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-base',
      tagline: 'text-xs',
    },
    default: {
      container: 'w-10 h-10',
      icon: 'w-6 h-6',
      text: 'text-xl',
      tagline: 'text-xs',
    },
    large: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-2xl',
      tagline: 'text-sm',
    },
  };

  const sizeConfig = sizes[size] || sizes.default;

  if (branding.logo.useImageLogo) {
    // Image Logo
    return (
      <div className="flex items-center gap-3">
        <img
          src={branding.logo.imagePath}
          alt={branding.logo.imageAlt}
          width={branding.logo.imageWidth}
          height={branding.logo.imageHeight}
          className="object-contain"
        />
        {showText && (
          <div>
            <h1 className={`${sizeConfig.text} font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {branding.appName}
            </h1>
            <p className={`${sizeConfig.tagline} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {branding.appTagline}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Icon + Text Logo (default)
  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeConfig.container} bg-gradient-to-br ${branding.logo.iconGradient} rounded-xl flex items-center justify-center shadow-lg`}>
        <Brain className={`${sizeConfig.icon} text-white`} />
      </div>
      {showText && (
        <div>
          <h1 className={`${sizeConfig.text} font-bold bg-gradient-to-r ${branding.colors.textGradient} bg-clip-text text-transparent`}>
            {branding.appName}
          </h1>
          <p className={`${sizeConfig.tagline} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {branding.appTagline}
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
