import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

export const GoogleAnalyticsTracker = () => {
  const location = useLocation();
  const { trackPageView, isAnalyticsEnabled } = useGoogleAnalytics();

  useEffect(() => {
    if (isAnalyticsEnabled) {
      trackPageView(location.pathname + location.search, document.title);
    }
  }, [location, trackPageView, isAnalyticsEnabled]);

  return null; // This component doesn't render anything
};
