import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Lock, ChevronRight, Loader2, Check, X, Copy, AlertTriangle, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

const fieldClass =
    'h-11 rounded-lg border-dark-700/90 bg-dark-950/80 px-3.5 text-left text-sm text-dark-100 placeholder:text-dark-500 shadow-inner shadow-black/30';

function VaultBackdrop({ children }) {
    return (
        <div className="relative w-full max-w-[440px] mx-auto">
            <div className="pointer-events-none absolute -inset-x-12 -top-16 -bottom-8 overflow-hidden opacity-90" aria-hidden>
                <div className="absolute -left-20 -top-8 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
                <div className="absolute -right-24 top-24 h-56 w-56 rounded-full bg-blue-600/15 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/5 blur-2xl" />
            </div>
            <div className="relative">{children}</div>
        </div>
    );
}

export default function VaultLock({ onUnlock }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [configured, setConfigured] = useState(null);
    const [allowRegistration, setAllowRegistration] = useState(false);
    const [showRecoveryKey, setShowRecoveryKey] = useState('');
    const [isResetMode, setIsResetMode] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [newsletterConsent, setNewsletterConsent] = useState(true);

    const brevoEnabled = import.meta.env.VITE_BREVO_ENABLED === 'true';
    const showNewsletterCheckbox = brevoEnabled && (configured === false || isRegisterMode) && !isResetMode;

    const passwordRules = [
        { id: 'length', label: t('vault.password_strength.rules.length'), test: (p) => p.length >= 8 },
        { id: 'upper',  label: t('vault.password_strength.rules.upper'),  test: (p) => /[A-Z]/.test(p) },
        { id: 'lower',  label: t('vault.password_strength.rules.lower'),  test: (p) => /[a-z]/.test(p) },
        { id: 'number', label: t('vault.password_strength.rules.number'), test: (p) => /[0-9]/.test(p) },
        { id: 'special',label: t('vault.password_strength.rules.special'),test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
    ];

    useEffect(() => {
        const checkConfigured = async () => {
            try {
                const data = await apiRequest('/setup/status');
                setConfigured(Boolean(data?.configured));
                setAllowRegistration(Boolean(data?.allow_registration));
            } catch (e) {
                setConfigured(false);
                const errorMessage = e.message || '';
                if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway') ||
                    errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                    setError(t('vault.errors.backend_unavailable'));
                }
            }
        };
        checkConfigured();
    }, []);

    useEffect(() => {
        if (!allowRegistration) setIsRegisterMode(false);
    }, [allowRegistration]);

    const showAuthTabs = configured === true && allowRegistration && !isResetMode;

    const headline = useMemo(() => {
        if (configured === null) return { title: t('vault.badge'), subtitle: t('vault.checking') };
        if (isResetMode) return { title: t('vault.titles.reset_password'), subtitle: t('vault.subtitles.reset_password') };
        if (configured === false) return { title: t('vault.titles.create_vault'), subtitle: t('vault.subtitles.create_vault') };
        if (isRegisterMode) return { title: t('vault.titles.create_account'), subtitle: t('vault.subtitles.create_account') };
        return { title: t('vault.titles.default'), subtitle: t('vault.subtitles.default') };
    }, [configured, isResetMode, isRegisterMode, t]);

    const passwordStrength = useMemo(() => {
        const passed = passwordRules.filter(rule => rule.test(password));
        return {
            passed,
            score: passed.length,
            isValid: passed.length === passwordRules.length,
            percentage: (passed.length / passwordRules.length) * 100,
        };
    }, [password, t]);

    const strengthLabel = useMemo(() => {
        if (password.length === 0) return { text: '', color: '' };
        if (passwordStrength.score <= 2) return { text: t('vault.password_strength.weak'), color: 'bg-red-500' };
        if (passwordStrength.score <= 3) return { text: t('vault.password_strength.fair'), color: 'bg-orange-500' };
        if (passwordStrength.score <= 4) return { text: t('vault.password_strength.good'), color: 'bg-yellow-500' };
        return { text: t('vault.password_strength.strong'), color: 'bg-teal-500' };
    }, [password, passwordStrength.score, t]);

    const headerIcon = isResetMode ? KeyRound : (configured === false || isRegisterMode) ? UserPlus : LogIn;
    const HeaderIcon = headerIcon;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isResetMode) {
                if (!passwordStrength.isValid) { setError(t('vault.errors.password_requirements')); setLoading(false); return; }
                if (password !== confirmPassword) { setError(t('vault.errors.passwords_mismatch')); setLoading(false); return; }
                if (!recoveryKeyInput) { setError(t('vault.errors.recovery_key_required')); setLoading(false); return; }
                const res = await apiRequest('/auth/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ email: email.trim(), recovery_key: recoveryKeyInput, new_password: password })
                });
                if (res?.recovery_key) setShowRecoveryKey(res.recovery_key);
                else onUnlock('dashboard');
            } else if (configured === true && isRegisterMode) {
                if (!passwordStrength.isValid) { setError(t('vault.errors.password_requirements')); setLoading(false); return; }
                if (password !== confirmPassword) { setError(t('vault.errors.passwords_mismatch')); setLoading(false); return; }
                if (!email.trim()) { setError(t('vault.errors.email_required')); setLoading(false); return; }
                const res = await apiRequest('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ email: email.trim(), password, owner_email: ownerEmail.trim() || email.trim(), newsletter_consent: newsletterConsent })
                });
                if (res?.recovery_key) setShowRecoveryKey(res.recovery_key);
                else onUnlock('home');
            } else if (configured === false) {
                if (!passwordStrength.isValid) { setError(t('vault.errors.password_requirements')); setLoading(false); return; }
                if (password !== confirmPassword) { setError(t('vault.errors.passwords_mismatch')); setLoading(false); return; }
                const accountEmail = email.trim() || ownerEmail.trim();
                if (!accountEmail) { setError(t('vault.errors.email_required')); setLoading(false); return; }
                const res = await apiRequest('/setup', {
                    method: 'POST',
                    body: JSON.stringify({ email: accountEmail, password, owner_email: ownerEmail.trim() || accountEmail, newsletter_consent: newsletterConsent })
                });
                if (res?.recovery_key) setShowRecoveryKey(res.recovery_key);
                else onUnlock('home');
            } else {
                if (!email.trim()) { setError(t('vault.errors.email_required')); setLoading(false); return; }
                await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
                onUnlock('dashboard');
            }
        } catch (e) {
            const errorMessage = e.message || '';
            if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
                setError(t('vault.errors.backend_unavailable'));
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setError(t('vault.errors.cannot_connect'));
            } else if (errorMessage.includes('already_configured')) {
                setError(t('vault.errors.already_configured'));
                setConfigured(true);
            } else {
                setError(errorMessage || t('vault.errors.invalid_credentials'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (showRecoveryKey) {
        return (
            <VaultBackdrop>
                <Card className="overflow-hidden rounded-2xl border border-dark-700/90 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent" aria-hidden />
                    <CardHeader className="space-y-4 px-6 pb-2 pt-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-dark-950 ring-1 ring-red-500/25 shadow-lg">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-red-400/90">{t('vault.recovery.badge')}</p>
                            <CardTitle className="text-xl font-semibold tracking-tight text-dark-100">{t('vault.recovery.title')}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed text-dark-400">
                                {t('vault.recovery.subtitle')}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-dark-700/80 bg-dark-950/90 p-4 shadow-inner">
                            <code className="break-all font-mono text-sm tracking-wider text-teal-400">{showRecoveryKey}</code>
                            <Button variant="ghost" size="sm" type="button" className="shrink-0 text-dark-400 hover:text-teal-400"
                                onClick={() => { navigator.clipboard.writeText(showRecoveryKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-8">
                        <Button className="h-12 w-full rounded-xl bg-red-600 text-base font-semibold shadow-lg shadow-red-950/40 hover:bg-red-500"
                            onClick={() => onUnlock()}>
                            {t('vault.recovery.saved')}
                        </Button>
                    </CardFooter>
                </Card>
            </VaultBackdrop>
        );
    }

    return (
        <VaultBackdrop>
            <Card className="overflow-hidden rounded-2xl border border-dark-700/90 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" aria-hidden />
                <CardHeader className="space-y-5 px-6 pb-2 pt-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/15 to-dark-950 ring-1 ring-teal-500/20 shadow-lg">
                        {configured === null ? <Lock className="h-6 w-6 text-teal-400/80" /> : <HeaderIcon className="h-6 w-6 text-teal-400" strokeWidth={1.75} />}
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-teal-500/90">{t('vault.badge')}</p>
                        <CardTitle className="text-2xl font-semibold tracking-tight text-dark-100">{headline.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-dark-400">{headline.subtitle}</CardDescription>
                    </div>

                    {showAuthTabs && (
                        <div className="flex rounded-xl border border-dark-800 bg-dark-950/90 p-1 shadow-inner" role="tablist">
                            <button type="button" role="tab" aria-selected={!isRegisterMode}
                                className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                                    !isRegisterMode ? 'bg-dark-800 text-dark-100 shadow-sm ring-1 ring-dark-600/50' : 'text-dark-500 hover:text-dark-300')}
                                onClick={() => { setIsRegisterMode(false); setError(''); setPassword(''); setConfirmPassword(''); setOwnerEmail(''); }}>
                                <LogIn className="h-4 w-4 opacity-80" />{t('vault.tabs.sign_in')}
                            </button>
                            <button type="button" role="tab" aria-selected={isRegisterMode}
                                className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                                    isRegisterMode ? 'bg-dark-800 text-dark-100 shadow-sm ring-1 ring-dark-600/50' : 'text-dark-500 hover:text-dark-300')}
                                onClick={() => { setIsRegisterMode(true); setError(''); setPassword(''); setConfirmPassword(''); setOwnerEmail(''); }}>
                                <UserPlus className="h-4 w-4 opacity-80" />{t('vault.tabs.register')}
                            </button>
                        </div>
                    )}
                </CardHeader>

                {configured === null ? (
                    <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-teal-500/80" aria-hidden />
                        <p className="text-sm text-dark-500">{t('vault.loading')}</p>
                    </CardContent>
                ) : (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 px-6">
                        {configured === true && !isResetMode && !isRegisterMode && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-dark-300" htmlFor="vault-email">{t('vault.fields.email')}</label>
                                <Input id="vault-email" type="email" autoComplete="username"
                                    placeholder={t('vault.fields.email_placeholder')} value={email}
                                    onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
                            </div>
                        )}
                        {(configured === false || isRegisterMode) && !isResetMode && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-dark-300" htmlFor="vault-account-email">{t('vault.fields.account_email')}</label>
                                <Input id="vault-account-email" type="email" autoComplete="email"
                                    placeholder={t('vault.fields.email_placeholder')} value={email}
                                    onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
                            </div>
                        )}
                        {isResetMode && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-dark-300" htmlFor="vault-reset-email">{t('vault.fields.account_email')}</label>
                                    <Input id="vault-reset-email" type="email" autoComplete="username"
                                        placeholder={t('vault.fields.email_placeholder')} value={email}
                                        onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-dark-300" htmlFor="vault-recovery-key">{t('vault.fields.recovery_key')}</label>
                                    <Input id="vault-recovery-key" type="text" placeholder="RK-…" value={recoveryKeyInput}
                                        onChange={(e) => setRecoveryKeyInput(e.target.value)}
                                        className={cn(fieldClass, 'font-mono text-sm')} autoFocus />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-dark-300" htmlFor="vault-password">
                                {isResetMode ? t('vault.fields.new_password') : (configured === false || isRegisterMode) ? t('vault.fields.create_password') : t('vault.fields.password')}
                            </label>
                            <Input id="vault-password" type="password"
                                autoComplete={(configured === false || isRegisterMode) ? 'new-password' : 'current-password'}
                                placeholder={isResetMode ? t('vault.fields.password_placeholder_new_reset') : (configured === false || isRegisterMode) ? t('vault.fields.password_placeholder_new') : t('vault.fields.password_placeholder_login')}
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className={cn(fieldClass, 'font-mono')}
                                autoFocus={!isResetMode && !(configured === true && isRegisterMode)} />
                        </div>
                        {(configured === false || isRegisterMode || isResetMode) && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-dark-300" htmlFor="vault-confirm">
                                        {isResetMode ? t('vault.fields.confirm_new_password') : t('vault.fields.confirm_password')}
                                    </label>
                                    <Input id="vault-confirm" type="password" placeholder={t('vault.fields.confirm_placeholder')}
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={cn(fieldClass, 'font-mono')} />
                                </div>
                                {!isResetMode && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-dark-300" htmlFor="vault-owner-email">{t('vault.fields.reminder_email')}</label>
                                        <Input id="vault-owner-email" type="email" placeholder={t('vault.fields.defaults_to_account')}
                                            value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={fieldClass} />
                                        <p className="text-xs leading-relaxed text-dark-500">{t('vault.fields.reminder_email_hint')}</p>
                                    </div>
                                )}
                                {password.length > 0 && (
                                    <div className="rounded-xl border border-dark-800/90 bg-dark-950/50 p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-dark-400">{t('vault.password_strength.label')}</span>
                                                <span className={cn('font-medium',
                                                    strengthLabel.text === t('vault.password_strength.strong') ? 'text-teal-400' :
                                                    strengthLabel.text === t('vault.password_strength.good') ? 'text-yellow-400' :
                                                    strengthLabel.text === t('vault.password_strength.fair') ? 'text-orange-400' : 'text-red-400'
                                                )}>{strengthLabel.text || '—'}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-dark-800">
                                                <div className={cn('h-full rounded-full transition-all duration-300', strengthLabel.color || 'bg-dark-600')}
                                                    style={{ width: `${passwordStrength.percentage}%` }} />
                                            </div>
                                            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                {passwordRules.map(rule => {
                                                    const passed = rule.test(password);
                                                    return (
                                                        <li key={rule.id} className={cn('flex items-center gap-2 text-xs', passed ? 'text-teal-400' : 'text-dark-500')}>
                                                            {passed ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                                                            <span>{rule.label}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {showNewsletterCheckbox && (
                            <div className="rounded-xl border border-dark-800/90 bg-dark-950/50 p-4 space-y-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newsletterConsent}
                                        onChange={(e) => setNewsletterConsent(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
                                    />
                                    <span className="text-xs leading-relaxed text-dark-300">
                                        {t('vault.newsletter.consent')}
                                    </span>
                                </label>
                                <p className="text-[10px] leading-relaxed text-dark-600 pl-7">
                                    {t('vault.newsletter.privacy_note')}
                                </p>
                            </div>
                        )}
                        {error && (
                            <div role="alert" className="rounded-xl border border-red-500/35 bg-red-500/[0.07] px-4 py-3 text-center text-sm text-red-300">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col gap-4 border-t border-dark-800/80 bg-dark-950/30 px-6 pb-8 pt-6">
                        <Button className="h-12 w-full rounded-xl bg-teal-600 text-base font-semibold shadow-lg shadow-teal-950/50 hover:bg-teal-500"
                            type="submit"
                            disabled={loading || configured === null || !password || !email.trim() ||
                                ((configured === false || isRegisterMode || isResetMode) && !confirmPassword) ||
                                (isResetMode && !recoveryKeyInput) ||
                                ((configured === false || isRegisterMode || isResetMode) && !passwordStrength.isValid)}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                    {isResetMode ? t('vault.buttons.reset_password') :
                                     configured === false ? t('vault.buttons.create_vault') :
                                     isRegisterMode ? t('vault.buttons.create_account') :
                                     t('vault.buttons.sign_in')}
                                    {!loading && <ChevronRight className="ml-2 h-4 w-4" />}
                                </>
                            )}
                        </Button>
                        {configured === true && isRegisterMode && !isResetMode && !showAuthTabs && (
                            <button type="button" className="text-sm text-dark-500 underline-offset-4 hover:text-teal-400 hover:underline"
                                onClick={() => { setIsRegisterMode(false); setError(''); setPassword(''); setConfirmPassword(''); setOwnerEmail(''); }}>
                                {t('vault.buttons.sign_in_instead')}
                            </button>
                        )}
                        {configured === true && !isRegisterMode && (
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
                                <button type="button" className="text-sm text-dark-500 underline-offset-4 hover:text-teal-400 hover:underline"
                                    onClick={() => { setIsResetMode(!isResetMode); setError(''); setPassword(''); setConfirmPassword(''); setRecoveryKeyInput(''); }}>
                                    {isResetMode ? t('vault.buttons.back_to_sign_in') : t('vault.buttons.forgot_password')}
                                </button>
                                {allowRegistration && !isResetMode && !showAuthTabs && (
                                    <button type="button" className="text-sm font-medium text-teal-500/90 underline-offset-4 hover:text-teal-400 hover:underline"
                                        onClick={() => { setIsRegisterMode(true); setError(''); setPassword(''); setConfirmPassword(''); setOwnerEmail(''); }}>
                                        {t('vault.buttons.create_an_account')}
                                    </button>
                                )}
                            </div>
                        )}
                    </CardFooter>
                </form>
                )}
            </Card>
            <p className="mt-8 text-center text-xs text-dark-600">{t('vault.authorized_only')}</p>
        </VaultBackdrop>
    );
}