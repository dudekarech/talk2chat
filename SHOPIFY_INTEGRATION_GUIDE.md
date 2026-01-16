# 🛍️ TalkChat for Shopify - Installation & Integration Guide

## Overview
This guide explains how to install the TalkChat widget on your Shopify store to enable:
- Real-time AI customer support
- Cart abandonment tracking (Coming Soon)
- Visitor behavior tracking

---

## 🚀 Easy Installation (2 Minutes)

Since TalkChat is script-based, it works on **any Shopify theme** (Dawn, Impulse, etc.) without needing a custom App.

### **Step 1: Get Your Embed Code**
1. Log in to your TalkChat Tenant Dashboard.
2. Go to **Settings** -> **Widget Installation**.
3. Copy your unique embed code. It looks like this:
   ```html
   <script 
     src="https://your-domain.com/widget.js" 
     data-tenant-id="YOUR_TENANT_ID"
     async
   ></script>
   ```

### **Step 2: Add to Shopify Theme**
1. Log in to your **Shopify Admin**.
2. Go to **Online Store** -> **Themes**.
3. Click the **... (Three dots)** button next to your current theme.
4. Select **Edit code**.
5. In the file list, find and click `theme.liquid` (usually under "Layout").
6. Scroll down to the closing `</body>` tag (near the bottom).
7. **Paste your embed code** just above the `</body>` tag.
8. Click **Save**.

**✅ That's it!** The chat widget will now appear on every page of your store.

---

## 🛒 Enabling Cart Tracking (Phase 2 Feature)

To better assist customers, you can pass cart information to the chat widget.

### **Option 1: Basic Event Tracking (Paste below embed code)**
Add this script right after your widget embed code in `theme.liquid` to track when customers view products.

```html
<script>
  // Wait for widget to load
  window.addEventListener('load', function() {
    if (window.Shopify) {
      
      // Track Product Views
      {% if template contains 'product' %}
        if (window.talkChat) {
          window.talkChat.trackEvent('product_view', {
            productId: '{{ product.id }}',
            productName: '{{ product.title | escape }}',
            price: '{{ product.price | money_without_currency }}'
          });
        }
      {% endif %}

      // Track Cart Updates (AJAX)
      // Note: This varies by theme, but most broadcast event changes
      document.addEventListener('cart:add', function(evt) {
         if (window.talkChat) {
           window.talkChat.trackEvent('add_to_cart', evt.detail);
         }
      });
    }
  });
</script>
```

---

## 🎨 Tuning for E-commerce

### **Recommended Widget Settings**
For best results on Shopify stores:

1. **Color Scheme**: Match your brand's "Add to Cart" button color.
2. **Welcome Message**: 
   > "Hi there! 👋 I'm here to help with sizing, shipping, or any other questions about our products."
3. **Prompt Triggers**:
   - **Time on Page**: 30 seconds (ask if they have questions)
   - **Scroll Depth**: 50% (engage interested browsers)

---

## ❓ Troubleshooting

**Widget not showing up?**
- Ensure you clicked **Save** in the Code Editor.
- Check if you have other chat apps installed (Tidio, Gorgias) that might conflict.
- Verify your `data-tenant-id` is correct.

**Need Help?**
Contact our support team at [support@talkchat.ai](mailto:support@talkchat.ai).
