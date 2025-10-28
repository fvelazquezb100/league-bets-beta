import { useCookieConsent } from './useCookieConsent';

export const useGoogleAnalytics = () => {
  const { consent } = useCookieConsent();

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!consent?.analytics || !window.gtag) {
      console.log('Google Analytics not available - no consent or not loaded');
      return;
    }

    window.gtag('event', eventName, parameters);
    console.log('GA Event tracked:', eventName, parameters);
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (!consent?.analytics || !window.gtag) {
      console.log('Google Analytics not available - no consent or not loaded');
      return;
    }

    window.gtag('config', 'G-N8SYMCJED4', {
      page_path: pagePath,
      page_title: pageTitle
    });
    console.log('GA Page view tracked:', pagePath, pageTitle);
  };

  const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
    trackEvent('user_action', {
      action,
      category,
      label,
      value
    });
  };

  const trackBetPlaced = (betType: string, stake: number, odds: number) => {
    trackEvent('bet_placed', {
      bet_type: betType,
      stake,
      odds,
      currency: 'EUR'
    });
  };

  const trackBetWon = (betType: string, payout: number) => {
    trackEvent('bet_won', {
      bet_type: betType,
      payout,
      currency: 'EUR'
    });
  };

  const trackLeagueJoined = (leagueId: string, leagueType: string) => {
    trackEvent('league_joined', {
      league_id: leagueId,
      league_type: leagueType
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackBetPlaced,
    trackBetWon,
    trackLeagueJoined,
    isAnalyticsEnabled: consent?.analytics || false
  };
};
