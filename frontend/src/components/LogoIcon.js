import { Brain } from 'lucide-react';
import branding from '../config/branding';

/**
 * LogoIcon Component
 * 
 * Centralized logo icon used throughout the application.
 * Uses the same icon and gradient as the main logo for consistency.
 */
const LogoIcon = ({ size = 'w-5 h-5', className = '' }) => {
  return (
    <div className={`bg-gradient-to-br ${branding.logo.iconGradient} rounded-lg flex items-center justify-center ${className}`}>
      <Brain className={`${size} text-white`} />
    </div>
  );
};

export default LogoIcon;
