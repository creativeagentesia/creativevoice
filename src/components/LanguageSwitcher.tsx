import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-1">
      <button
        onClick={() => switchLanguage('pt')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'pt'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        PT
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        EN
      </button>
    </div>
  );
}
