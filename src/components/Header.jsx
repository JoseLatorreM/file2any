import React from 'react';
import { FileTerminal, Moon, Sun, Languages, Coffee } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { useTranslation } from 'react-i18next';

const Header = ({ theme, setTheme }) => {
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
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTerminal className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Files2Any</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={toggleLanguage} variant="ghost" size="sm" className="w-12">
            <span className="font-bold">{i18n.language === 'es' ? 'ES' : 'EN'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('https://buymeacoffee.com/shindara', '_blank')}
            title={t('header.buyMeACoffee')}
          >
            <Coffee className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t('header.buyMeACoffee')}</span>
          </Button>
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t('header.changeTheme')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;