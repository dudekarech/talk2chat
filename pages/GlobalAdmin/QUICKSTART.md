# Global Admin Quick Start Guide

## 🚀 Quick Access

### Login to Global Admin
1. Navigate to: `http://localhost:5173/#/global/admin`
2. Enter credentials:
   - **Email:** `gilbert@mind-firm.com`
   - **Password:** `admin123`
3. Click "Access Dashboard"

### Navigation Menu
Once logged in, use the sidebar to access:

- **📊 Overview** - System dashboard with key metrics
- **🏢 Tenants** - Manage all tenant accounts
- **💳 Billing & Subs** - Revenue and invoice management
- **👥 User Management** - Cross-tenant user administration
- **📈 Analytics** - Platform-wide performance metrics
- **🔒 Security & Audit** - Security policies and logs
- **🔔 Notifications** - Send global messages

## 🎯 Common Tasks

### Create a New Tenant
1. Go to **Tenants** page
2. Click "Add New Tenant"
3. Fill in company details
4. Assign subscription plan
5. Set up tenant admin

### Send Platform Announcement
1. Go to **Notifications** page
2. Select recipient group (All Tenants, Enterprise only, etc.)
3. Enter message title and body
4. Click "Send Notification"

### Review Security Logs
1. Go to **Security & Audit** page
2. Scroll to "Recent Audit Logs"
3. Filter by action, user, or tenant
4. Click "View All Logs" for complete history

### Generate Financial Report
1. Go to **Billing & Subs** page
2. Review revenue metrics
3. Click "Export Report"
4. Download PDF or CSV

### Suspend a Tenant
1. Go to **Tenants** page
2. Find the tenant in the table
3. Hover over the row to reveal actions
4. Click the suspend icon (ban symbol)
5. Confirm suspension

## 🔐 Security Features

### Two-Factor Authentication
- Enable in **Security & Audit** → Authentication
- Toggle "Two-Factor Authentication"
- Requires all admins to use 2FA

### IP Whitelisting
- Configure in **Security & Audit** → Authentication
- Toggle "IP Whitelisting"
- Add allowed IP addresses

### Password Policy
- Set in **Security & Audit** → Password Policy
- Configure minimum length
- Require special characters
- Require uppercase letters

## 📊 Dashboard Metrics

### Key Statistics
- **Total Tenants** - Number of active companies
- **Active Users** - Total users across all tenants
- **Monthly Revenue** - Current MRR
- **System Load** - Platform resource usage

### System Alerts
- **Critical** - Immediate attention required (red)
- **Warning** - Monitor closely (orange)
- **Info** - General notifications (blue)

## 🎨 UI Features

### Search & Filter
- Global search in header (searches tenants, users, logs)
- Page-specific filters on each management page
- Quick actions on hover in tables

### Responsive Design
- Works on desktop, tablet, and mobile
- Collapsible sidebar on smaller screens
- Touch-friendly controls

### Dark Theme
- Premium dark interface
- Reduced eye strain
- Professional appearance

## 🔄 Logout
Click the **Sign Out** button at the bottom of the sidebar to log out securely.

## 💡 Tips & Tricks

1. **Use keyboard shortcuts** - Tab through forms quickly
2. **Bookmark frequently used pages** - Save direct links to specific admin pages
3. **Monitor alerts daily** - Check the dashboard for system issues
4. **Export reports regularly** - Keep historical records for analysis
5. **Review audit logs weekly** - Stay informed of platform changes

## 🆘 Troubleshooting

### Can't Login
- Verify email: `gilbert@mind-firm.com`
- Check password: `admin123`
- Clear browser cache and try again
- Check if cookies are enabled

### Page Not Loading
- Ensure dev server is running (`npm run dev`)
- Check browser console for errors
- Verify you're using the hash router URL format (`/#/global/...`)

### Missing Data
- This is a demo with mock data
- In production, data comes from Supabase backend
- Check network tab for API errors

## 📞 Support

For issues or questions:
- Check the full README.md in the GlobalAdmin folder
- Review the codebase documentation
- Contact the development team

---

**Happy Administrating! 🎉**
