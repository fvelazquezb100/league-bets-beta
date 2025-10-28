// Google Analytics tracking functions
// These functions use gtag directly as recommended by Google

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-N8SYMCJED4', {
      page_path: pagePath,
      page_title: pageTitle
    });
    console.log('GA Page view tracked:', pagePath, pageTitle);
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
    console.log('GA Event tracked:', eventName, parameters);
  }
};

export const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
  trackEvent('user_action', {
    action,
    category,
    label,
    value
  });
};

export const trackBetPlaced = (betType: string, stake: number, odds: number) => {
  trackEvent('bet_placed', {
    bet_type: betType,
    stake,
    odds,
    currency: 'EUR'
  });
};

export const trackBetWon = (betType: string, payout: number) => {
  trackEvent('bet_won', {
    bet_type: betType,
    payout,
    currency: 'EUR'
  });
};

export const trackLeagueJoined = (leagueId: string, leagueType: string) => {
  trackEvent('league_joined', {
    league_id: leagueId,
    league_type: leagueType
  });
};
