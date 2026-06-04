import { useState } from 'react';
import { LayoutDashboard, PlusCircle, LogOut, Settings, Menu, X, Sun, Moon, SunMoon } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-dark-900 border border-dark-700 text-dark-300 text-xs rounded px-2 py-1 cursor-pointer hover:border-dark-500"
    >
      <option value="fr">🇫🇷 FR</option>
      <option value="en">🇬🇧 EN</option>
      <option value="de">🇩🇪 DE</option>
      <option value="es">🇪🇸 ES</option>
      <option value="pt">🇵🇹 PT</option>
      <option value="it">🇮🇹 IT</option>
      <option value="nl">🇳🇱 NL</option>
      <option value="pl">🇵🇱 PL</option>
    </select>
  );
}

function ThemeSwitcher({ mode, onChange }) {
  const { t } = useTranslation();
  const icons = {
    light: <Sun className="w-3.5 h-3.5" />,
    dark: <Moon className="w-3.5 h-3.5" />,
    auto: <SunMoon className="w-3.5 h-3.5" />,
  };
  return (
    <div className="flex items-center gap-0.5 bg-dark-900 border border-dark-700 rounded px-1 py-0.5">
      {['light', 'auto', 'dark'].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={t(`theme.${m}`)}
          className={`p-1 rounded transition-colors ${
            mode === m
              ? 'bg-teal-600 text-white'
              : 'text-dark-400 hover:text-dark-100'
          }`}
        >
          {icons[m]}
        </button>
      ))}
    </div>
  );
}

function NavButton({ route, icon, label, currentRoute, onNavigate }) {
    const IconComponent = icon;
    return (
        <Button
            variant="ghost"
            size="sm"
            className={`text-dark-400 hover:text-dark-100 hover:bg-dark-800 w-full md:w-auto justify-start md:justify-center ${currentRoute === route ? 'bg-dark-800 text-dark-100' : ''}`}
            onClick={() => onNavigate(route)}
        >
            <IconComponent className="w-4 h-4 mr-2" />
            {label}
        </Button>
    );
}

export default function Header({ currentRoute, setRoute, onLogout, themeMode, onThemeChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useTranslation();

    const handleNavigate = (route) => {
        setRoute(route);
        setMobileMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-700 bg-dark-950/95 backdrop-blur-sm">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div
                    className="flex items-center gap-2.5 cursor-pointer group"
                    onClick={() => {
                        setRoute('home');
                        setMobileMenuOpen(false);
                    }}
                >
                    <span className="text-lg font-bold tracking-[0.2em] text-dark-100 group-hover:text-teal-400 transition-colors">
                        UN DERNIER MESSAGE
                    </span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    <NavButton route="home" icon={PlusCircle} label={t('nav.create')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                    <NavButton route="dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                    <NavButton route="settings" icon={Settings} label={t('nav.settings')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                    <LanguageSwitcher />
                    <ThemeSwitcher mode={themeMode} onChange={onThemeChange} />
                    {onLogout && (
                        <>
                            <div className="w-px h-4 bg-dark-700 mx-2" />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-dark-500 hover:text-red-400 hover:bg-dark-800"
                                onClick={onLogout}
                                title={t('nav.logout')}
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-dark-400 hover:text-dark-100 hover:bg-dark-800"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-dark-700 bg-dark-950/98 backdrop-blur-sm">
                    <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
                        <NavButton route="home" icon={PlusCircle} label={t('nav.create')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                        <NavButton route="dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                        <NavButton route="settings" icon={Settings} label={t('nav.settings')} currentRoute={currentRoute} onNavigate={handleNavigate} />
                        <div className="py-2 flex items-center gap-2">
                            <LanguageSwitcher />
                            <ThemeSwitcher mode={themeMode} onChange={onThemeChange} />
                        </div>
                        {onLogout && (
                            <>
                                <div className="h-px bg-dark-700 my-2" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-dark-500 hover:text-red-400 hover:bg-dark-800 w-full justify-start"
                                    onClick={() => {
                                        onLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    {t('nav.logout')}
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
