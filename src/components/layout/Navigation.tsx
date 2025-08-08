import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, DollarSign, History } from 'lucide-react';

const navigationItems = [
  {
    name: 'Inicio',
    href: '/home',
    icon: Home,
  },
  {
    name: 'Apostar',
    href: '/bets',
    icon: DollarSign,
  },
  {
    name: 'Historial',
    href: '/bet-history',
    icon: History,
  },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-card border-b border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};