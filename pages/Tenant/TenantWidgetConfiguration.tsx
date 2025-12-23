import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { WidgetConfiguration } from '../GlobalAdmin/WidgetConfiguration';
import { TenantWidgetPreview } from '../../components/TenantWidgetPreview';

/**
 * Tenant Widget Configuration Page
 * Wraps the global WidgetConfiguration component but with tenant-specific preview
 */
export const TenantWidgetConfiguration: React.FC = () => {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            {/* Widget Configuration with tenant-specific preview button */}
            <div className="relative">
                {/* Preview Button - Fixed Position */}
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 font-medium"
                    >
                        <Eye className="w-5 h-5" />
                        Preview Widget
                    </button>
                </div>

                {/* Render the standard WidgetConfiguration component */}
                <WidgetConfiguration />
            </div>

            {/* Tenant-Specific Preview Modal */}
            <TenantWidgetPreview
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
            />
        </>
    );
};
