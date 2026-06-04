export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES = 5;
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TIME_PRESETS = [
    { label: 'presets.time.1_minute', value: 1 },
    { label: 'presets.time.15_minutes', value: 15 },
    { label: 'presets.time.1_hour', value: 60 },
    { label: 'presets.time.1_day', value: 1440 },
    { label: 'presets.time.3_days', value: 4320 },
    { label: 'presets.time.1_week', value: 10080 },
    { label: 'presets.time.2_weeks', value: 20160 },
    { label: 'presets.time.1_month', value: 43200 },
    { label: 'presets.time.3_months', value: 129600 },
    { label: 'presets.time.6_months', value: 259200 },
    { label: 'presets.time.1_year', value: 525600 },
];

export const REMINDER_PRESETS = [
    { label: 'presets.reminder.15_minutes', value: 15 },
    { label: 'presets.reminder.1_hour', value: 60 },
    { label: 'presets.reminder.12_hours', value: 720 },
    { label: 'presets.reminder.1_day', value: 1440 },
    { label: 'presets.reminder.2_days', value: 2880 },
    { label: 'presets.reminder.3_days', value: 4320 },
    { label: 'presets.reminder.5_days', value: 7200 },
    { label: 'presets.reminder.10_days', value: 14400 },
];

export const FAREWELL_DELAY_PRESETS = [
    { label: 'presets.farewell.immediately', value: 0 },
    { label: 'presets.farewell.1_hour', value: 60 },
    { label: 'presets.farewell.6_hours', value: 360 },
    { label: 'presets.farewell.12_hours', value: 720 },
    { label: 'presets.farewell.1_day', value: 1440 },
    { label: 'presets.farewell.3_days', value: 4320 },
    { label: 'presets.farewell.1_week', value: 10080 },
    { label: 'presets.farewell.2_weeks', value: 20160 },
];
