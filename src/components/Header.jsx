import React from 'react';
import { FileTerminal, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const Header = ({ theme, setTheme }) => {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = React.useState(false);

  const toggleTheme = () => {
    if (isToggling) return;
    
    setIsToggling(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    toast({
      title: `Cambiado a modo ${newTheme === 'light' ? 'claro' : 'oscuro'}`,
      description: '¡La interfaz se ha actualizado!',
    });

    // Cooldown de 1 segundo para evitar spam
    setTimeout(() => {
      setIsToggling(false);
    }, 1000);
  };

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTerminal className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Files2Any</span>
        </div>
        <Button onClick={toggleTheme} variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;