import React from 'react';
import { FileTerminal, Github } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const Footer = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const handleGithubClick = () => {
    toast({
      title: '¡Función no implementada!',
      description: "Esta característica aún no está implementada",
    });
  };

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <FileTerminal className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">Files2Any</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} Files2Any. Todos los derechos reservados. <br/> Una herramienta simple, segura y gratuita para todos.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleGithubClick}>
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;