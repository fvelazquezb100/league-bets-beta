import { Header } from './Header';
import { Navigation } from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background md:sticky">
        <Header />
        <Navigation />
      </div>
      <main className="container mx-auto px-6 py-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
};