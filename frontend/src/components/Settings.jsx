import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Server, Save, Loader2, CheckCircle, Eye, EyeOff, TestTube, ChevronDown, ChevronUp, ExternalLink, Trash2, UserPlus, AlertTriangle, Users, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const SMTP_GUIDES = [
    { name: 'Gmail', host: 'smtp.gmail.com', port: '587', security: 'STARTTLS', noteKey: 'settings.gmail_note', link: 'https://support.google.com/accounts/answer/185833', recommended: true },
    { name: 'Yandex', host: 'smtp.yandex.com', port: '465', security: 'SSL', noteKey: 'settings.yandex_note', link: 'https://yandex.com/support/mail/mail-clients/others.html' },
    { name: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: '587', security: 'STARTTLS', noteKey: 'settings.brevo_note', link: 'https://app.brevo.com/settings/keys/smtp' },
    { name: 'Mailgun', host: 'smtp.mailgun.org', port: '587', security: 'STARTTLS', noteKey: 'settings.mailgun_note', link: 'https://app.mailgun.com/app/sending/domains' },
    { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', security: 'STARTTLS', noteKey: 'settings.sendgrid_note', link: 'https://app.sendgrid.com/settings/api_keys' },
    { name: 'Outlook/Office365', host: 'smtp.office365.com', port: '587', security: 'STARTTLS', noteKey: 'settings.outlook_note', link: 'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings' },
    { name: 'Zoho', host: 'smtp.zoho.com', port: '465', security: 'SSL', noteKey: 'settings.zoho_note', link: 'https://www.zoho.com/mail/help/zoho-smtp.html' }
];

export default function Settings() {
    const { t } = useTranslation();
    const [config, setConfig] = useState({ smtp_host: 'smtp.gmail.com', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '', smtp_from_name: 'Aeterna', owner_email: '', allow_registration: false, can_manage_registration: false });
    const [configLoading, setConfigLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [savedSection, setSavedSection] = useState(null);
    const [testSuccess, setTestSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [webhooks, setWebhooks] = useState([]);
    const [webhookLoading, setWebhookLoading] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [registrationWarningOpen, setRegistrationWarningOpen] = useState(false);
    const [sessionUserId, setSessionUserId] = useState(null);
    const [accountUsers, setAccountUsers] = useState([]);
    const [accountUsersLoading, setAccountUsersLoading] = useState(false);
    const [accountPanelError, setAccountPanelError] = useState(null);
    const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
    const [deleteUserLoading, setDeleteUserLoading] = useState(false);
    const [usersModalOpen, setUsersModalOpen] = useState(false);

    useEffect(() => { fetchConfig(); fetchWebhooks(); }, []);

    const fetchAccountUsers = async () => {
        setAccountPanelError(null);
        setAccountUsersLoading(true);
        try {
            const session = await apiRequest('/auth/session');
            if (session?.user_id) setSessionUserId(session.user_id);
            const list = await apiRequest('/users');
            setAccountUsers(Array.isArray(list) ? list : []);
        } catch (e) {
            setAccountPanelError(e.message || t('settings.errors.load_accounts'));
            setAccountUsers([]);
        } finally {
            setAccountUsersLoading(false);
        }
    };

    const openUsersModal = () => { setUsersModalOpen(true); fetchAccountUsers(); };

    const fetchConfig = async () => {
        setConfigLoading(true);
        try {
            const data = await apiRequest('/settings');
            if (data) setConfig(prev => ({ ...prev, ...data, allow_registration: Boolean(data.allow_registration), can_manage_registration: Boolean(data.can_manage_registration) }));
        } catch (err) {
            console.error('Failed to fetch config', err);
            setError(t('settings.errors.load_settings'));
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchWebhooks = async () => {
        setWebhookLoading(true);
        try {
            const data = await apiRequest('/webhooks');
            setWebhooks(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || t('settings.errors.webhooks_load_failed'));
        } finally {
            setWebhookLoading(false);
        }
    };

    const addWebhook = () => { setWebhooks(prev => ([...prev, { id: null, url: '', secret: '', enabled: true, isNew: true }])); };

    const updateWebhook = (index, patch, isDirty = true) => {
        setWebhooks(prev => prev.map((item, i) => (i === index ? { ...item, ...patch, isDirty } : item)));
    };

    const saveWebhook = async (item, index) => {
        try {
            if (!item.url) { setError(t('settings.errors.webhook_url_required')); return; }
            if (item.id) {
                const updated = await apiRequest(`/webhooks/${item.id}`, { method: 'PUT', body: JSON.stringify({ url: item.url, secret: item.secret, enabled: item.enabled }) });
                updateWebhook(index, { ...updated, isNew: false, confirmingDelete: false }, false);
            } else {
                const created = await apiRequest('/webhooks', { method: 'POST', body: JSON.stringify({ url: item.url, secret: item.secret, enabled: item.enabled }) });
                updateWebhook(index, { ...created, isNew: false, confirmingDelete: false }, false);
            }
            setError(null);
        } catch (e) {
            setError(e.message || t('settings.errors.webhook_save_failed'));
        }
    };

    const deleteWebhook = async (index) => {
        const item = webhooks[index];
        try {
            if (item.id) await apiRequest(`/webhooks/${item.id}`, { method: 'DELETE' });
            setWebhooks(prev => prev.filter((_, i) => i !== index));
        } catch (e) {
            setError(e.message || t('settings.errors.webhook_delete_failed'));
        }
    };

    const applyGuide = (guide) => {
        setSavedSection(null);
        setConfig(prev => ({ ...prev, smtp_host: guide.host, smtp_port: guide.port }));
    };

    const handleSave = async (section) => {
        setLoading(true); setError(null); setSavedSection(null);
        try {
            await apiRequest('/settings', { method: 'POST', body: JSON.stringify(config) });
            setSavedSection(section);
            setTimeout(() => setSavedSection((s) => (s === section ? null : s)), 3000);
            if (section === 'registration' && config.allow_registration) setRegistrationWarningOpen(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.smtp_pass) {
            setError(t('settings.errors.smtp_test_fields')); return;
        }
        setTestLoading(true); setError(null); setTestSuccess(false);
        try {
            await apiRequest('/settings/test', { method: 'POST', body: JSON.stringify(config) });
            setTestSuccess(true);
            setTimeout(() => setTestSuccess(false), 3000);
        } catch (e) {
            setError(e.message);
        } finally {
            setTestLoading(false);
        }
    };

    const formatAccountDate = (iso) => {
        if (!iso) return '—';
        try { return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); }
        catch { return iso; }
    };

    const confirmDeleteUser = async () => {
        if (!pendingDeleteUser) return;
        setDeleteUserLoading(true); setAccountPanelError(null);
        try {
            await apiRequest(`/users/${pendingDeleteUser.id}`, { method: 'DELETE' });
            setPendingDeleteUser(null);
            await fetchAccountUsers();
        } catch (e) {
            setAccountPanelError(e.message || t('settings.errors.delete_user_failed'));
        } finally {
            setDeleteUserLoading(false);
        }
    };

    return (
        <>
        <div className="w-full max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-dark-100">{t('settings.title')}</h1>
                <p className="text-dark-400 text-sm">{t('settings.subtitle')}</p>
            </div>

            {/* SMTP Guide */}
            <Card className="border-dark-700 bg-dark-900">
                <button className="w-full p-4 flex items-center justify-between text-left" onClick={() => setShowGuide(!showGuide)}>
                    <div>
                        <h3 className="text-sm font-medium text-dark-100">{t('settings.guide_title')}</h3>
                        <p className="text-xs text-dark-500">{t('settings.guide_subtitle')}</p>
                    </div>
                    {showGuide ? <ChevronUp className="w-5 h-5 text-dark-400" /> : <ChevronDown className="w-5 h-5 text-dark-400" />}
                </button>
                {showGuide && (
                    <div className="px-4 pb-4 space-y-2">
                        {SMTP_GUIDES.map(guide => (
                            <div key={guide.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-dark-950 rounded-lg border border-dark-800">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-dark-100">{guide.name}</span>
                                        {guide.recommended && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                                {t('settings.recommended')}
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${guide.security === 'SSL' ? 'bg-purple-500/20 text-purple-400' : 'bg-teal-500/20 text-teal-400'}`}>
                                            {guide.security}
                                        </span>
                                        <a href={guide.link} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300">
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <p className="text-xs text-dark-400 mt-0.5">{guide.host}:{guide.port}</p>
                                    <p className="text-xs text-dark-500 mt-1">{t(guide.noteKey)}</p>
                                </div>
                                <Button size="sm" variant="outline" className="border-dark-700 hover:bg-dark-800 text-xs" onClick={() => applyGuide(guide)}>
                                    {t('settings.apply')}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* System Notifications */}
            <Card className="border-teal-500/20 bg-dark-900 shadow-[0_0_15px_rgba(45,212,191,0.05)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium text-teal-400">
                        <Mail className="w-4 h-4" />{t('settings.notifications_title')}
                    </CardTitle>
                    <CardDescription className="text-dark-400">{t('settings.notifications_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.owner_email_label')}</label>
                        <Input placeholder={t('settings.owner_email_placeholder')} value={config.owner_email || ''}
                            onChange={(e) => { setConfig({ ...config, owner_email: e.target.value }); if (error) setError(null); setSavedSection(null); }}
                            className="bg-dark-950 border-dark-700 text-dark-100 placeholder:text-dark-500 focus-visible:ring-teal-500/50" />
                    </div>
                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">
                            {t('settings.email_language_label')}
                        </label>
                        <select
                            value={config.language || 'fr'}
                            onChange={(e) => {
                                setConfig({ ...config, language: e.target.value });
                                setSavedSection(null);
                            }}
                            className="w-full h-9 rounded-md border border-dark-700 bg-dark-950 text-dark-100 text-sm px-3 focus:outline-none focus:border-teal-500"
                        >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="pt">🇵🇹 Português</option>
                        <option value="it">🇮🇹 Italiano</option>
                        <option value="nl">🇳🇱 Nederlands</option>
                        <option value="pl">🇵🇱 Polski</option>
                        </select>
                        <p className="text-xs text-dark-500">{t('settings.email_language_hint')}</p>
                        </div>
                    {savedSection === 'owner' && (
                        <Alert className="mt-4 border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-400">{t('settings.email_saved')}</AlertDescription>
                        </Alert>
                    )}
                    {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
                </CardContent>
                <CardFooter className="flex justify-end pt-2 border-t border-dark-800/40">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-xs" onClick={() => handleSave('owner')} disabled={loading || configLoading}>
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        {t('settings.save_email')}
                    </Button>
                </CardFooter>
            </Card>

            {/* Registration */}
            {config.can_manage_registration && (
            <Card className="border-dark-700 bg-dark-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium text-dark-100">
                        <UserPlus className="w-4 h-4 text-teal-400" />{t('settings.registration_title')}
                    </CardTitle>
                    <CardDescription className="text-dark-400">{t('settings.registration_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-dark-600 bg-dark-950 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
                            checked={Boolean(config.allow_registration)}
                            onChange={(e) => { setConfig({ ...config, allow_registration: e.target.checked }); if (error) setError(null); setSavedSection(null); }} />
                        <span className="text-sm text-dark-200">{t('settings.allow_registration')}</span>
                    </label>
                    {savedSection === 'registration' && (
                        <Alert className="mt-4 border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-400">{t('settings.registration_saved')}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2 border-t border-dark-800/40 sm:flex-row sm:items-center sm:justify-end">
                    <Button size="sm" className="order-1 w-full bg-teal-600 hover:bg-teal-500 text-xs sm:order-2 sm:w-auto"
                        onClick={() => handleSave('registration')} disabled={loading || configLoading}>
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        {t('settings.save_registration')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="order-2 w-full border-dark-700 hover:bg-dark-800 sm:order-1 sm:w-auto" onClick={() => openUsersModal()}>
                        <Users className="w-3.5 h-3.5 mr-1.5" />{t('settings.view_users')}
                    </Button>
                </CardFooter>
            </Card>
            )}

            {/* SMTP */}
            <Card className="glowing-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Mail className="w-4 h-4 text-teal-400" />{t('settings.smtp_title')}
                    </CardTitle>
                    <CardDescription className="text-dark-400">{t('settings.smtp_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-dark-400 flex items-center gap-2"><Server className="w-3 h-3" /> {t('settings.smtp_host')}</label>
                            <Input placeholder="smtp.gmail.com" value={config.smtp_host}
                                onChange={(e) => { setConfig({ ...config, smtp_host: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                className="bg-dark-950 border-dark-700 text-dark-100 placeholder:text-dark-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.smtp_port')}</label>
                            <Input placeholder="587" value={config.smtp_port}
                                onChange={(e) => { setConfig({ ...config, smtp_port: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                className="bg-dark-950 border-dark-800" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.smtp_user')}</label>
                            <Input placeholder="your@email.com" value={config.smtp_user}
                                onChange={(e) => { setConfig({ ...config, smtp_user: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                className="bg-dark-950 border-dark-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.smtp_pass')}</label>
                            <div className="relative">
                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={config.smtp_pass}
                                    onChange={(e) => { setConfig({ ...config, smtp_pass: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                    className="bg-dark-950 border-dark-800 pr-10" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.smtp_from')}</label>
                            <Input placeholder="noreply@yourdomain.com" value={config.smtp_from}
                                onChange={(e) => { setConfig({ ...config, smtp_from: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                className="bg-dark-950 border-dark-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.smtp_from_name')}</label>
                            <Input placeholder="Aeterna Vault" value={config.smtp_from_name}
                                onChange={(e) => { setConfig({ ...config, smtp_from_name: e.target.value }); if (error) setError(null); setSavedSection(null); if (testSuccess) setTestSuccess(false); }}
                                className="bg-dark-950 border-dark-800" />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-dark-800/70" />

                    {/* Webhooks */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-white">{t('settings.webhooks_title')}</div>
                                <div className="text-xs text-dark-500 mt-1">{t('settings.webhooks_desc')}</div>
                            </div>
                            <Button variant="outline" size="sm" className="border-dark-700 hover:bg-dark-800" onClick={addWebhook} disabled={webhookLoading}>
                                {t('settings.add_webhook')}
                            </Button>
                        </div>
                        {webhookLoading && <div className="text-xs text-dark-500">{t('settings.loading_webhooks')}</div>}
                        {webhooks.length === 0 && !webhookLoading && <div className="text-xs text-dark-500">{t('settings.no_webhooks')}</div>}
                        <div className="space-y-3">
                            {webhooks.map((item, index) => (
                                <div key={item.id ?? `new-${index}`} className="rounded-lg border border-dark-800 bg-dark-950/60 p-3 space-y-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-xs text-dark-400">
                                                <input type="checkbox" checked={Boolean(item.enabled)}
                                                    onChange={(e) => updateWebhook(index, { enabled: e.target.checked })}
                                                    className="h-4 w-4 accent-teal-400" />
                                                {t('settings.webhook_enabled')}
                                            </label>
                                            {item.isDirty && (
                                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                                    {t('settings.webhook_unsaved')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button variant="outline" size="sm"
                                                className={`transition-all ${item.isDirty ? 'border-teal-500 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' : 'border-dark-700 hover:bg-dark-800'}`}
                                                onClick={() => saveWebhook(item, index)}>
                                                {item.isDirty ? t('settings.webhook_save_changes') : t('settings.webhook_save')}
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="border-red-500/40 hover:bg-red-500/10 text-red-400">
                                                        <Trash2 className="w-3.5 h-3.5 mr-1" />{t('settings.webhook_delete')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogTitle>{t('settings.webhook_delete_title')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('settings.webhook_delete_desc', { url: item.url || 'this endpoint' })}
                                                    </AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('settings.cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteWebhook(index)} className="bg-red-600 hover:bg-red-700">
                                                            {t('settings.webhook_delete_confirm')}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.webhook_url')}</label>
                                        <Input placeholder={t('settings.webhook_url_placeholder')} value={item.url}
                                            onChange={(e) => updateWebhook(index, { url: e.target.value })} className="bg-dark-950 border-dark-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-dark-500 uppercase tracking-wider">{t('settings.webhook_secret')}</label>
                                        <div className="relative">
                                            <Input type={showWebhookSecret ? "text" : "password"} placeholder="••••••••" value={item.secret}
                                                onChange={(e) => updateWebhook(index, { secret: e.target.value })} className="bg-dark-950 border-dark-800 pr-10" />
                                            <button type="button" onClick={() => setShowWebhookSecret(!showWebhookSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300">
                                                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    {configLoading && <Alert><AlertDescription>{t('settings.loading_settings')}</AlertDescription></Alert>}
                    {savedSection === 'smtp' && (
                        <Alert className="border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-400">{t('settings.smtp_saved')}</AlertDescription>
                        </Alert>
                    )}
                    {testSuccess && (
                        <Alert className="border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-400">{t('settings.smtp_test_success')}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="border-dark-700 hover:bg-dark-800" onClick={handleTest}
                        disabled={testLoading || configLoading || !config.smtp_host || !config.smtp_port || !config.smtp_user || !config.smtp_pass}>
                        {testLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                        {t('settings.test_connection')}
                    </Button>
                    <Button className="flex-1 bg-teal-600 hover:bg-teal-500" onClick={() => handleSave('smtp')} disabled={loading || configLoading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {t('settings.save_settings')}
                    </Button>
                </CardFooter>
            </Card>
        </div>

        {/* Users Modal */}
        <Dialog open={usersModalOpen} onOpenChange={(open) => { setUsersModalOpen(open); if (!open) { setPendingDeleteUser(null); setAccountPanelError(null); } }}>
            <DialogContent className="w-full max-w-2xl max-h-[min(92dvh,42rem)] border-dark-700/90" contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0 pt-12 sm:pt-14">
                <div className="shrink-0 border-b border-dark-800/90 bg-dark-900/95 px-4 pb-3 pt-1 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1 pr-6 text-left">
                            <DialogTitle className="text-lg text-dark-100 sm:text-xl">{t('settings.users_title')}</DialogTitle>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 self-start border-dark-700 hover:bg-dark-800 sm:mt-0.5"
                            onClick={() => fetchAccountUsers()} disabled={accountUsersLoading}>
                            {accountUsersLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('settings.users_refresh')}
                        </Button>
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-5">
                    {accountPanelError && <Alert variant="destructive" className="mb-3"><AlertDescription>{accountPanelError}</AlertDescription></Alert>}
                    {accountUsersLoading && accountUsers.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-teal-500/70" /></div>
                    ) : accountUsers.length === 0 ? (
                        <p className="py-6 text-center text-sm text-dark-500">{t('settings.users_empty')}</p>
                    ) : (
                        <>
                            <ul className="space-y-2 sm:hidden">
                                {accountUsers.map((u) => (
                                    <li key={u.id} className="rounded-xl border border-dark-800 bg-dark-950/70 p-3.5 shadow-inner shadow-black/20">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-dark-100">{u.email}</p>
                                                <p className="mt-1 font-mono text-[11px] text-dark-500">{formatAccountDate(u.created_at)}</p>
                                            </div>
                                            {!u.is_primary && (
                                                <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                    onClick={() => setPendingDeleteUser({ id: u.id, email: u.email })}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                            {u.is_primary && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-[11px] text-teal-400">
                                                    <Shield className="h-3 w-3" />{t('settings.users_primary')}
                                                </span>
                                            )}
                                            {sessionUserId && u.id === sessionUserId && (
                                                <span className="text-[10px] font-medium uppercase tracking-wide text-teal-500/90">{t('settings.users_you')}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="hidden overflow-x-auto rounded-lg border border-dark-800 sm:block">
                                <table className="w-full min-w-[520px] text-sm">
                                    <thead>
                                        <tr className="border-b border-dark-800 bg-dark-950/80 text-left text-xs uppercase tracking-wider text-dark-500">
                                            <th className="px-3 py-2.5 font-medium">{t('settings.users_col_email')}</th>
                                            <th className="px-3 py-2.5 font-medium whitespace-nowrap">{t('settings.users_col_created')}</th>
                                            <th className="px-3 py-2.5 font-medium">{t('settings.users_col_role')}</th>
                                            <th className="w-24 px-3 py-2.5 text-right font-medium">{t('settings.users_col_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-800/80">
                                        {accountUsers.map((u) => (
                                            <tr key={u.id} className="text-dark-200">
                                                <td className="max-w-[200px] px-3 py-2.5">
                                                    <span className="block truncate text-dark-100" title={u.email}>{u.email}</span>
                                                    {sessionUserId && u.id === sessionUserId && (
                                                        <span className="mt-0.5 inline-block text-[10px] uppercase tracking-wide text-teal-500/90">{t('settings.users_you')}</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-dark-400">{formatAccountDate(u.created_at)}</td>
                                                <td className="px-3 py-2.5">
                                                    {u.is_primary ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-xs text-teal-400">
                                                            <Shield className="h-3 w-3" />{t('settings.users_primary')}
                                                        </span>
                                                    ) : <span className="text-dark-500">—</span>}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    {!u.is_primary && (
                                                        <Button type="button" variant="ghost" size="sm" className="h-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                            onClick={() => setPendingDeleteUser({ id: u.id, email: u.email })}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* Registration Warning */}
        <Dialog open={registrationWarningOpen} onOpenChange={setRegistrationWarningOpen}>
            <DialogContent className="border-amber-500/20 sm:max-w-md">
                <DialogHeader>
                    <div className="flex gap-4 pr-8 text-left">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-dark-100">{t('settings.open_registration_title')}</DialogTitle>
                            <DialogDescription className="text-dark-300 leading-relaxed">{t('settings.open_registration_desc')}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" className="bg-teal-600 hover:bg-teal-500" onClick={() => setRegistrationWarningOpen(false)}>
                        {t('settings.got_it')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Delete User */}
        <Dialog open={Boolean(pendingDeleteUser)} onOpenChange={(open) => { if (!open) setPendingDeleteUser(null); }}>
            <DialogContent className="border-red-500/20 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-dark-100">{t('settings.delete_user_title')}</DialogTitle>
                    <DialogDescription className="text-dark-300 leading-relaxed">
                        {pendingDeleteUser && t('settings.delete_user_desc', { email: pendingDeleteUser.email })}
                    </DialogDescription>
                </DialogHeader>
                {accountPanelError && <Alert variant="destructive"><AlertDescription>{accountPanelError}</AlertDescription></Alert>}
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" className="border-dark-700" onClick={() => setPendingDeleteUser(null)} disabled={deleteUserLoading}>
                        {t('settings.cancel')}
                    </Button>
                    <Button type="button" className="bg-red-600 hover:bg-red-500" onClick={() => confirmDeleteUser()} disabled={deleteUserLoading}>
                        {deleteUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('settings.delete_user_confirm')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}