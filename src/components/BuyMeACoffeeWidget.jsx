import React from 'react';
import { Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const BuyMeACoffeeWidget = () => {
  const { t } = useTranslation();

  return (
    <motion.a
      href="https://buymeacoffee.com/shindara"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-3 text-black shadow-xl hover:bg-gray-50 transition-colors font-medium border border-gray-200"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={t('header.buyMeACoffee')}
    >
      <Coffee className="h-5 w-5" />
      <span className="hidden sm:inline">{t('header.buyMeACoffee')}</span>
    </motion.a>
  );
};

export default BuyMeACoffeeWidget;
