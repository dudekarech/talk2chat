interface WidgetConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  buttonText?: string;
}

class CallNestWidget {
  private uuid: string;
  private config: WidgetConfig;
  private widgetElement: HTMLElement | null = null;

  constructor(uuid: string, config: WidgetConfig = {}) {
    this.uuid = uuid;
    this.config = {
      position: 'bottom-right',
      primaryColor: '#007bff',
      buttonText: 'Call Us',
      ...config
    };

    this.init();
  }

  private init(): void {
    this.createWidgetButton();
    document.body.appendChild(this.widgetElement!);
  }

  private createWidgetButton(): void {
    this.widgetElement = document.createElement('div');
    this.widgetElement.innerHTML = `
      <div class="callnest-widget-button" style="
        position: fixed;
        ${this.config.position?.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${this.config.position?.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        width: 60px;
        height: 60px;
        background: ${this.config.primaryColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </div>
    `;

    const button = this.widgetElement.querySelector('.callnest-widget-button') as HTMLElement;
    button.addEventListener('click', () => this.handleCall());
  }

  private handleCall(): void {
    console.log('CallNest Widget: Initiating call for company:', this.uuid);
    // TODO: Implement call functionality
    alert('Call functionality coming soon!');
  }

  public destroy(): void {
    if (this.widgetElement) {
      document.body.removeChild(this.widgetElement);
    }
  }
}

// Auto-initialize widget
(function() {
  const script = document.currentScript as HTMLScriptElement;
  const uuid = script.getAttribute('data-uuid');
  
  if (!uuid) {
    console.error('CallNest Widget: data-uuid attribute is required');
    return;
  }

  (window as any).CallNestWidget = new CallNestWidget(uuid);
})();

export default CallNestWidget;
