import { useState, useEffect } from 'react';
import { widgetConfigService, type WidgetConfig } from '../services/widgetConfigService';

// Helper to convert snake_case to camelCase
const snakeToCamel = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(snakeToCamel);
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            result[camelKey] = snakeToCamel(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

// Helper to convert camelCase to snake_case
const camelToSnake = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(camelToSnake);
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            result[snakeKey] = camelToSnake(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

export function useWidgetConfig(forceGlobal: boolean = false) {
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Load configuration on mount
    useEffect(() => {
        loadConfig();
    }, [forceGlobal]);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            // If forceGlobal is true, tell service to get config with NULL tenantId
            const { config: dbConfig, error } = await widgetConfigService.getConfig(forceGlobal ? null : undefined);

            if (error) {
                console.error('Error loading widget config:', error);
                // Use defaults on error
                setConfig(getDefaultConfig());
            } else if (dbConfig) {
                // Convert snake_case from database to camelCase for UI
                const camelConfig = snakeToCamel(dbConfig);
                setConfig(camelConfig);
            }
        } catch (err) {
            console.error('Exception loading config:', err);
            setConfig(getDefaultConfig());
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfig = async (updates: Partial<any>) => {
        setIsSaving(true);
        setSaveSuccess(false);
        setSaveError(null);

        try {
            // Convert camelCase to snake_case for database
            const snakeUpdates = camelToSnake(updates);

            // Pass the forceGlobal context to the service
            const { config: updatedConfig, error } = await widgetConfigService.updateConfig(
                snakeUpdates,
                forceGlobal ? null : undefined
            );

            if (error) {
                console.error('Error saving widget config:', error);
                setSaveError(error.message || 'Failed to save configuration');
                return false;
            }

            if (updatedConfig) {
                // Update local state with new config
                const camelConfig = snakeToCamel(updatedConfig);
                setConfig(camelConfig);
                setSaveSuccess(true);

                // Hide success message after 3 seconds
                setTimeout(() => setSaveSuccess(false), 3000);
                return true;
            }
        } catch (err: any) {
            console.error('Exception saving config:', err);
            setSaveError(err.message || 'Failed to save configuration');
            return false;
        } finally {
            setIsSaving(false);
        }

        return false;
    };

    const resetToDefaults = async () => {
        setIsSaving(true);
        try {
            // Pass the forceGlobal context to the service
            const { config: defaultConfig, error } = await widgetConfigService.resetToDefaults(
                forceGlobal ? null : undefined
            );

            if (error) {
                console.error('Error resetting to defaults:', error);
                setSaveError('Failed to reset to defaults');
                return false;
            }

            if (defaultConfig) {
                const camelConfig = snakeToCamel(defaultConfig);
                setConfig(camelConfig);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                return true;
            }
        } catch (err: any) {
            console.error('Exception resetting to defaults:', err);
            setSaveError(err.message || 'Failed to reset');
            return false;
        } finally {
            setIsSaving(false);
        }

        return false;
    };

    return {
        config,
        setConfig,
        isLoading,
        isSaving,
        saveSuccess,
        saveError,
        saveConfig,
        resetToDefaults,
        reloadConfig: loadConfig
    };
}

// Default configuration (fallback)
function getDefaultConfig() {
    return {
        // Appearance
        primaryColor: '#8b5cf6',
        secondaryColor: '#ec4899',
        backgroundColor: '#0f172a',
        position: 'bottom-right',
        widgetShape: 'rounded',
        fontSize: 'medium',
        theme: 'dark',

        // Branding
        teamName: 'TalkChat Support',
        companyLogo: '',
        avatarStyle: 'initials',
        showPoweredBy: true,

        // Content
        welcomeMessage: 'Hi! Welcome to TalkChat Studio. How can we help you today?',
        offlineMessage: 'We\'re currently offline. Leave us a message!',
        preChatMessage: 'Start a Conversation',
        thankYouMessage: 'Thanks for chatting with us!',

        // Behavior
        autoOpen: false,
        autoOpenDelay: 5,
        autoOpenOnScroll: false,
        scrollPercentage: 50,
        showOnPages: 'all',
        hideOnMobile: false,
        soundNotifications: true,

        // Pre-Chat Form
        requireName: true,
        requireEmail: false,
        requirePhone: false,
        customFields: [],

        // AI Features
        aiEnabled: true,
        aiProvider: 'gemini',
        aiModel: 'gemini-1.5-flash',
        aiTemperature: 0.7,
        aiAutoRespond: true,
        aiGreeting: true,
        aiSmartSuggestions: true,
        aiSentimentAnalysis: true,
        aiLanguageDetection: true,

        // Quick Replies
        quickRepliesEnabled: true,
        quickReplies: [
            { id: '1', text: 'What are your hours?', category: 'General' },
            { id: '2', text: 'How much does it cost?', category: 'Pricing' },
            { id: '3', text: 'How do I get started?', category: 'Getting Started' },
        ],

        // Canned Responses
        cannedResponses: [
            { id: '1', shortcut: '/hours', text: 'We\'re available Monday-Friday, 9AM-5PM EST', category: 'General' },
            { id: '2', shortcut: '/pricing', text: 'Our pricing starts at $29/month.', category: 'Pricing' },
            { id: '3', shortcut: '/support', text: 'I\'ll connect you with a specialist.', category: 'Support' },
        ],

        // Visitor Tracking
        trackVisitors: true,
        trackPageViews: true,
        trackMouseMovement: true,
        trackClicks: true,
        trackScrollDepth: true,
        trackTimeOnPage: true,
        captureScreenshots: false,
        sessionRecording: false,

        // Visitor Intelligence
        showVisitorInfo: true,
        showLocation: true,
        showDevice: true,
        showBrowser: true,
        showReferrer: true,
        showPreviousVisits: true,
        enrichVisitorData: true,

        // Notifications
        emailNotifications: true,
        desktopNotifications: true,
        mobileNotifications: false,
        notifyOnNewChat: true,
        notifyOnMessage: true,
        notificationSound: 'default',

        // Integrations
        googleAnalytics: '',
        facebookPixel: '',
        webhookUrl: '',
        zapierEnabled: false,

        // Security
        allowedDomains: ['talkchat.studio', 'localhost'],
        enableCaptcha: false,
        captchaProvider: 'recaptcha',
        rateLimit: 10,
        blockVpn: false,
        ipWhitelist: [],

        // Business Hours
        enabled24_7: true,
        timezone: 'America/New_York',
        businessHours: {
            monday: { enabled: true, start: '09:00', end: '17:00' },
            tuesday: { enabled: true, start: '09:00', end: '17:00' },
            wednesday: { enabled: true, start: '09:00', end: '17:00' },
            thursday: { enabled: true, start: '09:00', end: '17:00' },
            friday: { enabled: true, start: '09:00', end: '17:00' },
            saturday: { enabled: false, start: '09:00', end: '17:00' },
            sunday: { enabled: false, start: '09:00', end: '17:00' },
        },

        // Advanced
        typingIndicator: true,
        readReceipts: true,
        fileUpload: true,
        maxFileSize: 5,
        allowedFileTypes: ['image/*', 'application/pdf'],
        emojiPicker: true,
        messageCharacterLimit: 1000,
    };
}
