import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Infinity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';

const features = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Seguro y Privado',
    description: 'Tus archivos nunca se guardan. La privacidad es nuestra máxima prioridad.',
  },
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: 'Conversión Rápida',
    description: 'Experimenta una velocidad de conversión ultrarrápida sin esperas innecesarias.',
  },
  {
    icon: <Infinity className="h-10 w-10 text-primary" />,
    title: 'Totalmente Gratis',
    description: 'Sin costes ocultos, sin publicidad, sin necesidad de registrarse. Para siempre.',
  },
];

const Features = () => {
  const cardVariants = {
    offscreen: {
      y: 50,
      opacity: 0
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    }
  };

  return (
    <section id="features" className="py-20 bg-secondary/50 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Por qué Files2Any?</h2>
          <p className="mt-4 text-lg text-muted-foreground">La solución definitiva para todas tus necesidades de conversión de archivos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
            >
              <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="pt-2">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;