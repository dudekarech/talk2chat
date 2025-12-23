/**
 * TalkChat Widget Loader
 * This script is responsible for bootstrapping the chat widget on external websites.
 */
(function () {
    // Prevent multiple instances
    if (window.TalkChatLoaded) return;
    window.TalkChatLoaded = true;

    // Command queue for handling 'tkc(...)' calls before script is fully initialized
    var tkc = window.tkc || function () {
        (tkc.q = tkc.q || []).push(arguments);
    };
    window.tkc = tkc;

    // Default configuration
    var config = {
        tenantId: 'global',
        baseUrl: window.location.origin, // Default to current origin if not specified
        position: 'bottom-right'
    };

    // Process 'init' command
    tkc.q = tkc.q || [];
    for (var i = 0; i < tkc.q.length; i++) {
        if (tkc.q[i][0] === 'init') {
            var options = tkc.q[i][1];
            if (typeof options === 'string') {
                config.tenantId = options;
            } else if (typeof options === 'object') {
                Object.assign(config, options);
            }
        }
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'talkchat-widget-iframe';

    // Set source with tenantId and base URL
    // Use path /widget-embed instead of hash #/widget-embed to satisfy Vercel headers
    var embedUrl = config.baseUrl + '/widget-embed?tenantId=' + (config.tenantId || 'global');
    iframe.src = embedUrl;

    // Basic styling
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '100px'; // Initial size for the bubble
    iframe.style.height = '100px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '9999999';
    iframe.style.transition = 'width 0.3s ease, height 0.3s ease';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.colorScheme = 'auto';

    // Handle messages from the widget (e.g. resizing)
    window.addEventListener('message', function (event) {
        // In production, check event.origin for security
        // if (event.origin !== config.baseUrl) return;

        if (event.data.type === 'TKC_WIDGET_RESIZE') {
            iframe.style.width = event.data.width;
            iframe.style.height = event.data.height;
        }

        if (event.data.type === 'TKC_WIDGET_OPEN') {
            iframe.style.width = '420px';
            iframe.style.height = '700px';
        }

        if (event.data.type === 'TKC_WIDGET_CLOSE') {
            iframe.style.width = '100px';
            iframe.style.height = '100px';
        }
    });

    // Add to page
    document.body.appendChild(iframe);

    console.log('[TalkChat] Widget loaded successfully for tenant:', config.tenantId);
})();
