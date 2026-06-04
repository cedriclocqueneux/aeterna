import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Mail, Clock, Loader2, AlertCircle, CheckCircle, Send, Paperclip, X, Upload, Settings as SettingsIcon, Plus, ArrowRight, MessageSquare, Pencil } from 'lucide-react';
import { Select } from "@/components/ui/select"
import { apiRequest, uploadFile, createFarewellLetter, uploadFarewellAttachment } from "@/lib/api"
import FarewellLetters from "@/components/FarewellLetters"
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_FILES, MAX_TOTAL_SIZE, EMAIL_REGEX, TIME_PRESETS, REMINDER_PRESETS, FAREWELL_DELAY_PRESETS } from "@/lib/constants"
import { formatFileSize, formatMinutes, formatFarewellDelay } from "@/lib/formatters"
import { parseRecipientEmails } from "@/lib/parsers"
import { applyDurationToReminders, addReminderValue, removeReminderValue } from "@/lib/reminder-utils"

export default function CreateSwitch({ setRoute }) {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [recipientInput, setRecipientInput] = useState('');
    const [recipientEmails, setRecipientEmails] = useState([]);
    const [duration, setDuration] = useState(1440);
    const [reminders, setReminders] = useState([720]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [showAttachments, setShowAttachments] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [smtpError, setSmtpError] = useState(false);
    const [createdMessageId, setCreatedMessageId] = useState(null);
    const [pendingLetters, setPendingLetters] = useState([]);
    const [showLetterForm, setShowLetterForm] = useState(false);
    const [editingLetterIdx, setEditingLetterIdx] = useState(null);
    const [letterRecipient, setLetterRecipient] = useState('');
    const [letterSubject, setLetterSubject] = useState('');
    const [letterContent, setLetterContent] = useState('');
    const [letterDelay, setLetterDelay] = useState(1440);
    const [letterFormError, setLetterFormError] = useState(null);
    const [letterFiles, setLetterFiles] = useState([]);
    const fileInputRef = useRef(null);

    const resetLetterForm = () => {
        setLetterRecipient('');
        setLetterSubject('');
        setLetterContent('');
        setLetterDelay(1440);
        setLetterFiles([]);
        setEditingLetterIdx(null);
        setShowLetterForm(false);
        setLetterFormError(null);
    };

    const savePendingLetter = () => {
        const recipient = letterRecipient.trim();
        const subject = letterSubject.trim();
        const content = letterContent;
        if (!EMAIL_REGEX.test(recipient)) {
            setLetterFormError(t('errors.invalid_email'));
            return;
        }
        if (!subject) {
            setLetterFormError(t('errors.subject_required'));
            return;
        }
        if (!content.trim()) {
            setLetterFormError(t('errors.content_empty'));
            return;
        }
        const payload = {
            recipient_email: recipient,
            subject,
            content,
            delay_minutes: letterDelay,
            files: letterFiles,
        };
        if (editingLetterIdx != null) {
            setPendingLetters(prev => prev.map((l, i) => i === editingLetterIdx ? { ...l, ...payload } : l));
        } else {
            setPendingLetters(prev => [...prev, payload]);
        }
        resetLetterForm();
    };

    const editPendingLetter = (idx) => {
        const l = pendingLetters[idx];
        setLetterRecipient(l.recipient_email);
        setLetterSubject(l.subject);
        setLetterContent(l.content);
        setLetterDelay(l.delay_minutes);
        setLetterFiles(l.files || []);
        setEditingLetterIdx(idx);
        setShowLetterForm(true);
        setLetterFormError(null);
    };

    const removePendingLetter = (idx) => {
        setPendingLetters(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDurationChange = (newDuration) => {
        setDuration(newDuration);
        setReminders((prev) => applyDurationToReminders(prev, newDuration));
    };

    const addReminder = (value) => {
        setReminders((prev) => addReminderValue(prev, value, duration));
    };

    const removeReminder = (value) => {
        setReminders((prev) => removeReminderValue(prev, value));
    };

    const validateFile = (file) => {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return t('errors.file_type', { name: file.name });
        }
        if (file.size > MAX_FILE_SIZE) {
            return t('errors.file_size', { name: file.name });
        }
        return null;
    };

    const addFiles = (newFiles) => {
        setError(null);
        const fileArray = Array.from(newFiles);

        if (files.length + fileArray.length > MAX_FILES) {
            setError(t('errors.max_files', { max: MAX_FILES }));
            return;
        }

        const currentTotal = files.reduce((sum, f) => sum + f.size, 0);
        const newTotal = fileArray.reduce((sum, f) => sum + f.size, 0);
        if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
            setError(t('errors.total_size'));
            return;
        }

        for (const file of fileArray) {
            const err = validateFile(file);
            if (err) {
                setError(err);
                return;
            }
        }

        const existingNames = new Set(files.map(f => f.name));
        const uniqueNew = fileArray.filter(f => !existingNames.has(f.name));
        setFiles(prev => [...prev, ...uniqueNew]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const addRecipientsFromText = (text) => {
        const parsed = parseRecipientEmails(text);
        if (parsed.length === 0) return { added: 0, invalid: null };

        let invalid = null;
        let added = 0;

        setRecipientEmails((prev) => {
            const seen = new Set(prev.map((email) => email.toLowerCase()));
            const next = [...prev];

            for (const email of parsed) {
                if (!EMAIL_REGEX.test(email)) {
                    if (!invalid) invalid = email;
                    continue;
                }
                const key = email.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    next.push(email);
                    added += 1;
                }
            }

            return next;
        });

        return { added, invalid };
    };

    const handleAddRecipients = () => {
        const { invalid } = addRecipientsFromText(recipientInput);
        if (invalid) {
            setError(t('errors.invalid_email_address', { email: invalid }));
        } else if (error) {
            setError(null);
        }
        setRecipientInput('');
        if (success) setSuccess(false);
    };

    const removeRecipient = (emailToRemove) => {
        setRecipientEmails((prev) => prev.filter((email) => email !== emailToRemove));
    };

    const handleRecipientKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
            e.preventDefault();
            if (recipientInput.trim()) {
                handleAddRecipients();
            }
        }
    };

    const handleRecipientPaste = (e) => {
        const pasted = e.clipboardData.getData('text');
        if (/[\n,;]/.test(pasted)) {
            e.preventDefault();
            const { invalid } = addRecipientsFromText(pasted);
            if (invalid) {
                setError(t('errors.invalid_email_address', { email: invalid }));
            } else if (error) {
                setError(null);
            }
            if (success) setSuccess(false);
        }
    };

    const handleCreate = async () => {
        const pendingRecipients = parseRecipientEmails(recipientInput);
        const mergedRecipients = [...recipientEmails];
        const seen = new Set(mergedRecipients.map((email) => email.toLowerCase()));

        for (const email of pendingRecipients) {
            if (!EMAIL_REGEX.test(email)) {
                setError(t('errors.invalid_email_address', { email }));
                return;
            }
            const key = email.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                mergedRecipients.push(email);
            }
        }

        if (!message.trim()) {
            setError(t('errors.no_message'));
            return;
        }
        if (mergedRecipients.length === 0) {
            setError(t('errors.no_recipient'));
            return;
        }

        setRecipientEmails(mergedRecipients);
        setLoading(true);
        setError(null);
        setSuccess(false);
        setUploadProgress('');

        try {
            const result = await apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify({
                    content: message,
                    recipient_email: mergedRecipients[0],
                    recipient_emails: mergedRecipients,
                    trigger_duration: duration,
                    reminders: reminders
                })
            }).catch(err => {
                if (err.message.includes('SMTP_NOT_CONFIGURED') || err.message.includes('SMTP_CONNECTION_FAILED')) {
                    setSmtpError(true);
                }
                throw err;
            });

            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    setUploadProgress(`${i + 1}/${files.length}...`);
                    try {
                        await uploadFile(result.id, files[i]);
                    } catch (uploadErr) {
                        setError(t('errors.file_upload_failed', { name: files[i].name, error: uploadErr.message }));
                        setLoading(false);
                        setUploadProgress('');
                        setFiles([]);
                        setMessage('');
                        setRecipientInput('');
                        setRecipientEmails([]);
                        return;
                    }
                }
            }

            const letterErrors = [];
            for (let i = 0; i < pendingLetters.length; i++) {
                const letterData = pendingLetters[i];
                setUploadProgress(`${i + 1}/${pendingLetters.length}...`);
                try {
                    const savedLetter = await createFarewellLetter(result.id, {
                        recipient_email: letterData.recipient_email,
                        subject: letterData.subject,
                        content: letterData.content,
                        delay_minutes: letterData.delay_minutes,
                    });
                    for (const file of letterData.files || []) {
                        await uploadFarewellAttachment(result.id, savedLetter.id, file);
                    }
                } catch (letterErr) {
                    letterErrors.push(`"${letterData.subject}": ${letterErr.message}`);
                }
            }

            setMessage('');
            setRecipientInput('');
            setRecipientEmails([]);
            setFiles([]);
            setPendingLetters([]);
            resetLetterForm();
            setUploadProgress('');
            setCreatedMessageId(result.id);
            if (letterErrors.length > 0) {
                setError(t('errors.letters_failed', { count: letterErrors.length, errors: letterErrors.join('; ') }));
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    if (createdMessageId) {
        return (
            <div className="w-full max-w-2xl space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-dark-100">{t('success.switch_activated_title')}</h1>
                    <p className="text-dark-400 text-sm max-w-md mx-auto">
                        {t('success.switch_activated_subtitle')}
                    </p>
                </div>

                <Alert className="border-teal-500/20 bg-teal-500/10">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <AlertDescription className="text-teal-400">
                        {t('success.switch_created')}
                    </AlertDescription>
                </Alert>

                <Card className="glowing-card">
                    <CardContent className="pt-6">
                        <FarewellLetters messageId={createdMessageId} />
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setCreatedMessageId(null)}
                        className="border-dark-700 bg-dark-900 hover:bg-dark-800 text-dark-200"
                    >
                        <Plus className="w-4 h-4 mr-2" /> {t('success.create_another')}
                    </Button>
                    <Button
                        onClick={() => setRoute?.('dashboard')}
                        className="bg-teal-600 hover:bg-teal-500 text-white"
                    >
                        {t('success.go_to_dashboard')} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold text-dark-100">
                    {t('create.title')}
                </h1>
                <p className="text-dark-400 text-sm max-w-md mx-auto">
                    {t('create.subtitle')}
                </p>
            </div>

            <Card className="glowing-card">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Send className="w-4 h-4 text-teal-400" />
                        {t('create.card_title')}
                    </CardTitle>
                    <CardDescription className="text-dark-400">
                        {t('create.card_description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> {t('create.your_message')}
                        </label>
                        <Textarea
                            placeholder={t('create.your_message_placeholder')}
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (error) setError(null);
                                if (success) setSuccess(false);
                            }}
                            className="min-h-[120px] bg-dark-950 border-dark-700 focus:border-teal-500 resize-none text-dark-100 placeholder:text-dark-500"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="show-attachments"
                            checked={showAttachments}
                            onChange={(e) => {
                                setShowAttachments(e.target.checked);
                                if (!e.target.checked) setFiles([]);
                            }}
                            className="h-4 w-4 rounded border-dark-700 bg-dark-950 text-teal-600 focus:ring-teal-500 accent-teal-500"
                        />
                        <label htmlFor="show-attachments" className="text-xs font-medium text-dark-300 cursor-pointer">
                            {t('create.send_attachments')}
                        </label>
                    </div>

                    {showAttachments && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                                <Paperclip className="w-3 h-3" /> {t('create.attachments')}
                                <span className="text-dark-600 font-normal">({files.length}/{MAX_FILES})</span>
                            </label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${dragOver
                                    ? 'border-teal-400 bg-teal-500/5'
                                    : 'border-dark-700 hover:border-dark-500 bg-dark-950'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept={ALLOWED_EXTENSIONS.join(',')}
                                    onChange={(e) => {
                                        if (e.target.files?.length) addFiles(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                                <Upload className="w-5 h-5 text-dark-500 mx-auto mb-2" />
                                <p className="text-xs text-dark-400">
                                    {t('create.drag_drop')} <span className="text-teal-400 underline">{t('create.browse')}</span>
                                </p>
                                <p className="text-[10px] text-dark-600 mt-1">
                                    {t('create.file_limits', { max: MAX_FILES })}
                                </p>
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-1.5">
                                    {files.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between bg-dark-900 border border-dark-700 rounded-lg px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Paperclip className="w-3 h-3 text-teal-400 shrink-0" />
                                                <span className="text-xs text-dark-200 truncate">{file.name}</span>
                                                <span className="text-[10px] text-dark-500 shrink-0">{formatFileSize(file.size)}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                className="text-dark-500 hover:text-red-400 transition-colors p-0.5"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-dark-600 text-right">
                                        {t('create.total_size', { size: formatFileSize(files.reduce((sum, f) => sum + f.size, 0)) })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> {t('create.recipient_emails')}
                            </label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder={t('create.recipient_placeholder')}
                                        value={recipientInput}
                                        onChange={(e) => {
                                            setRecipientInput(e.target.value);
                                            if (error) setError(null);
                                            if (success) setSuccess(false);
                                        }}
                                        onKeyDown={handleRecipientKeyDown}
                                        onPaste={handleRecipientPaste}
                                        className="bg-dark-950 border-dark-700 focus:border-teal-500 text-dark-100 placeholder:text-dark-500"
                                        aria-invalid={Boolean(error)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddRecipients}
                                        className="border-dark-700 bg-dark-900 hover:bg-dark-800 text-dark-200"
                                        disabled={!recipientInput.trim()}
                                    >
                                        <Plus className="w-4 h-4 mr-1" /> {t('create.add')}
                                    </Button>
                                </div>

                                {recipientEmails.length > 0 && (
                                    <div className="flex flex-wrap gap-2 bg-dark-900 border border-dark-700 rounded-lg p-2.5">
                                        {recipientEmails.map((email) => (
                                            <div key={email} className="flex items-center gap-1.5 bg-dark-800 text-dark-200 text-xs px-2 py-1 rounded max-w-full min-w-0">
                                                <Mail className="w-3 h-3 text-teal-400 shrink-0" />
                                                <span className="truncate max-w-[220px] sm:max-w-[300px]" title={email}>{email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipient(email)}
                                                    className="text-dark-400 hover:text-red-400 shrink-0"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="text-[10px] text-dark-600">
                                    {t('create.recipient_hint')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {t('create.trigger_after')}
                            </label>
                            <Select
                                value={duration}
                                onChange={(e) => handleDurationChange(Number(e.target.value))}
                                className="bg-dark-950 border-dark-700 text-dark-100"
                            >
                                {TIME_PRESETS.map(preset => (
                                    <option key={preset.value} value={preset.value}>
                                        {t(preset.label)}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-teal-400" /> {t('create.reminders')}
                        </label>
                        <div className="flex flex-col gap-2 bg-dark-900 border border-dark-700 rounded-lg p-3">
                            {reminders.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {reminders.map(r => {
                                        const preset = REMINDER_PRESETS.find(p => p.value === r);
                                        const label = preset ? t(preset.label) : formatMinutes(r);
                                        return (
                                            <div key={r} className="flex items-center gap-1 bg-dark-800 text-dark-200 text-xs px-2 py-1 rounded">
                                                <span>{label}</span>
                                                <button type="button" onClick={() => removeReminder(r)} className="text-dark-400 hover:text-red-400">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-dark-500">{t('create.no_reminders')}</p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                <Select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            addReminder(Number(e.target.value));
                                            e.target.value = '';
                                        }
                                    }}
                                    className="bg-dark-950 border-dark-700 text-dark-100 text-xs h-8"
                                    value={""}
                                >
                                    <option value="" disabled>{t('create.add_reminder')}</option>
                                    {REMINDER_PRESETS.filter(p => !reminders.includes(p.value) && p.value < duration).map(preset => (
                                        <option key={preset.value} value={preset.value}>
                                            {t(preset.label)}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-dark-400 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> {t('create.farewell_letters')}
                                <span className="text-dark-600 font-normal">{t('create.optional')}</span>
                            </label>
                            {!showLetterForm && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setShowLetterForm(true); setEditingLetterIdx(null); }}
                                    className="border-dark-700 bg-dark-900 hover:bg-dark-800 text-dark-200 h-7 text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> {t('create.add_letter')}
                                </Button>
                            )}
                        </div>

                        {showLetterForm && (
                            <div className="space-y-3 p-3 border border-dark-700 rounded-lg bg-dark-900">
                                {letterFormError && (
                                    <p className="text-xs text-red-400">{letterFormError}</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-dark-400 flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {t('create.recipient_email')}
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder={t('create.recipient_email_placeholder')}
                                            value={letterRecipient}
                                            onChange={(e) => setLetterRecipient(e.target.value)}
                                            className="bg-dark-950 border-dark-700 focus:border-teal-500 text-dark-100 placeholder:text-dark-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-dark-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {t('create.send_delay')}
                                        </label>
                                        <select
                                            value={letterDelay}
                                            onChange={(e) => setLetterDelay(Number(e.target.value))}
                                            className="w-full h-9 rounded-md border border-dark-700 bg-dark-950 text-dark-100 text-sm px-3 focus:outline-none focus:border-teal-500"
                                        >
                                            {FAREWELL_DELAY_PRESETS.map(p => (
                                                <option key={p.value} value={p.value}>{t(p.label)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-dark-400">{t('create.subject')}</label>
                                    <Input
                                        type="text"
                                        placeholder={t('create.subject_placeholder')}
                                        value={letterSubject}
                                        onChange={(e) => setLetterSubject(e.target.value)}
                                        className="bg-dark-950 border-dark-700 focus:border-teal-500 text-dark-100 placeholder:text-dark-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-dark-400">{t('create.message')}</label>
                                    <Textarea
                                        placeholder={t('create.message_placeholder')}
                                        value={letterContent}
                                        onChange={(e) => setLetterContent(e.target.value)}
                                        className="min-h-[100px] bg-dark-950 border-dark-700 focus:border-teal-500 text-dark-100 placeholder:text-dark-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-dark-400 flex items-center gap-1">
                                            <Paperclip className="w-3 h-3" /> {t('create.attachments')}
                                            <span className="text-dark-600 font-normal">({letterFiles.length}/{MAX_FILES})</span>
                                        </label>
                                        {letterFiles.length < MAX_FILES && (
                                            <label className="cursor-pointer flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                                                <Upload className="w-3 h-3" /> {t('create.add_file')}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept={ALLOWED_EXTENSIONS.join(',')}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const err = validateFile(file);
                                                        if (err) { setLetterFormError(err); e.target.value = ''; return; }
                                                        const totalSize = letterFiles.reduce((s, f) => s + f.size, 0);
                                                        if (totalSize + file.size > MAX_TOTAL_SIZE) {
                                                            setLetterFormError(t('errors.total_size_letter'));
                                                            e.target.value = '';
                                                            return;
                                                        }
                                                        setLetterFiles(prev => [...prev, file]);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    {letterFiles.length > 0 && (
                                        <div className="space-y-1">
                                            {letterFiles.map((file, idx) => (
                                                <div key={`${file.name}-${idx}`} className="flex items-center justify-between bg-dark-900 border border-dark-700 rounded px-2 py-1.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Paperclip className="w-3 h-3 text-dark-400 shrink-0" />
                                                        <span className="text-xs text-dark-200 truncate">{file.name}</span>
                                                        <span className="text-xs text-dark-500 shrink-0">{formatFileSize(file.size)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLetterFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="text-dark-500 hover:text-red-400 ml-2"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={resetLetterForm}
                                        className="border-dark-700 bg-dark-900 hover:bg-dark-800 text-dark-200"
                                    >
                                        {t('create.cancel')}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={savePendingLetter}
                                        className="bg-teal-600 hover:bg-teal-500 text-white"
                                    >
                                        {editingLetterIdx != null ? t('create.update_letter') : t('create.add_letter')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {pendingLetters.length > 0 && (
                            <div className="space-y-1.5">
                                {pendingLetters.map((letter, idx) => (
                                    <div key={idx} className="flex items-start justify-between gap-3 p-3 border border-dark-700 rounded-lg bg-dark-900">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <span className="text-xs font-medium text-dark-100 truncate block">{letter.subject}</span>
                                            <div className="flex items-center gap-3 text-xs text-dark-400">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{letter.recipient_email}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatFarewellDelay(letter.delay_minutes)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button size="sm" variant="ghost" onClick={() => editPendingLetter(idx)}
                                                className="h-7 w-7 p-0 text-dark-400 hover:text-dark-100 hover:bg-dark-800">
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => removePendingLetter(idx)}
                                                className="h-7 w-7 p-0 text-dark-400 hover:text-red-400 hover:bg-red-950/30">
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="space-y-3">
                                <p>{error.replace(/^SMTP_.*?: /, '')}</p>
                                {smtpError && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-red-500/50 hover:bg-red-500/20 text-red-500 transition-colors mt-2"
                                        onClick={() => setRoute?.('settings')}
                                    >
                                        <SettingsIcon className="w-3.5 h-3.5 mr-2" />
                                        {t('create.go_to_settings')}
                                    </Button>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-teal-500/20 bg-teal-500/10">
                            <CheckCircle className="h-4 w-4 text-teal-400" />
                            <AlertDescription className="text-teal-400">
                                {t('success.activated_alert')}
                            </AlertDescription>
                        </Alert>
                    )}

                    {uploadProgress && (
                        <div className="flex items-center gap-2 text-xs text-teal-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {uploadProgress}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium py-5"
                        onClick={handleCreate}
                        disabled={loading || !message.trim() || (recipientEmails.length === 0 && !recipientInput.trim())}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        {t('create.activate')}
                    </Button>
                </CardFooter>
            </Card>

            <div className="text-center text-xs text-dark-500 space-y-1">
                <p>{t('create.footer_hint')}</p>
            </div>
        </div>
    );
}