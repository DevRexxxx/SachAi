import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' },
  { code: 'es', label: 'ES' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
            current === lang.code
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
          title={lang.label}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
