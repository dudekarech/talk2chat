import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalChatWidget } from '../components/GlobalChatWidget';

/**
 * WidgetEmbedPage
 * This page is designed to be embedded in an iframe on third-party websites.
 * It only renders the GlobalChatWidget and handles tenant-specific configuration via query parameters.
 */
export const WidgetEmbedPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const tenantId = searchParams.get('tenantId');

    useEffect(() => {
        // Apply specific styles for iframe mode
        document.body.style.background = 'transparent';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';

        // Signal to parent that widget is ready
        window.parent.postMessage({ type: 'TKC_WIDGET_READY' }, '*');
    }, []);

    // If no tenantId is provided, it will fallback to global or whatever the widget determines
    // But usually the loader will pass it.
    return (
        <div className="widget-embed-container">
            <GlobalChatWidget
                forceGlobalConfig={!tenantId || tenantId === 'global'}
            />
        </div>
    );
};
