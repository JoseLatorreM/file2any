import React from 'react';
import { FileTerminal, Moon, Sun, Languages, Coffee, Users, Code2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useTranslation } from 'react-i18next';

const Header = ({ theme, setTheme, mainView, setMainView }) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isToggling, setIsToggling] = React.useState(false);

  const toggleTheme = () => {
    if (isToggling) return;
    
    setIsToggling(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    toast({
      title: t('header.themeChanged', { theme: newTheme === 'light' ? t('header.light') : t('header.dark') }),
      description: t('header.interfaceUpdated'),
    });

    // Cooldown de 1 segundo para evitar spam
    setTimeout(() => {
      setIsToggling(false);
    }, 1000);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 w-full border-b">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FileTerminal className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold hidden sm:inline">Files2Any</span>
            <span className="text-lg font-bold sm:hidden">F2A</span>
          </div>
          
          {/* Main Navigation - Center (Desktop) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2">
            <Button
              variant={mainView === 'usertools' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMainView('usertools')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {t('header.userTools', 'UserTools')}
            </Button>
            <Button
              variant={mainView === 'devtools' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMainView('devtools')}
              className="gap-2"
            >
              <Code2 className="h-4 w-4" />
              {t('header.devTools', 'DevTools')}
            </Button>
          </div>
          
          {/* Mobile Navigation Dropdown - Center (Mobile) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden">
            <select
              value={mainView}
              onChange={(e) => setMainView(e.target.value)}
              className="px-3 py-1.5 rounded-md border bg-background text-xs sm:text-sm font-medium"
            >
              <option value="usertools">{t('header.userTools', 'UserTools')}</option>
              <option value="devtools">{t('header.devTools', 'DevTools')}</option>
            </select>
          </div>
          
          {/* Actions - Right */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button onClick={toggleLanguage} variant="ghost" size="sm" className="w-10 sm:w-12 text-xs sm:text-sm">
              <span className="font-bold">{i18n.language === 'es' ? 'ES' : 'EN'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open('https://buymeacoffee.com/shindara', '_blank')}
              title={t('header.buyMeACoffee')}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <Coffee className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem]" />
              <span className="sr-only">{t('header.buyMeACoffee')}</span>
            </Button>
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t('header.changeTheme')}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;