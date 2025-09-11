import { Header } from './Header';
import { Navigation } from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background">
        <Header />
        <Navigation />
      </div>
      <main className="container mx-auto px-6 py-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
};