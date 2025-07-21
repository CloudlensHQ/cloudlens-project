# 📧 Email Setup Guide for CloudLens

This guide explains how to configure email functionality for password reset and notifications in your CloudLens deployment.

## 🎯 **Overview**

CloudLens uses SMTP configuration to send emails, making it compatible with any email service provider. This approach ensures your deployment remains truly open source without vendor lock-in.

## ⚙️ **Environment Variables**

Add these variables to your backend `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@cloudlens.com
SMTP_FROM_NAME=CloudLens
SMTP_USE_TLS=true

# Password Reset Settings
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=1
PASSWORD_RESET_BASE_URL=http://localhost:3000
```

## 🔧 **Popular SMTP Providers**

### 1. **Gmail (Free - Recommended for Development)**

**Limits**: 500 emails/day  
**Cost**: Free

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # See setup below
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true
```

**Setup Steps**:
1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use the generated password (not your regular password)

---

### 2. **Mailgun (Great for Production)**

**Limits**: 5,000 emails/month free  
**Cost**: $35/month for 50,000 emails

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_USE_TLS=true
```

**Setup Steps**:
1. Sign up at [Mailgun](https://www.mailgun.com)
2. Verify your domain or use sandbox domain for testing
3. Get SMTP credentials from your Mailgun dashboard

---

### 3. **SendGrid**

**Limits**: 100 emails/day free  
**Cost**: $19.95/month for 50,000 emails

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_USE_TLS=true
```

**Setup Steps**:
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key with mail sending permissions
3. Use "apikey" as username and your API key as password

---

### 4. **Amazon SES (Very Cost-Effective)**

**Limits**: 200 emails/day free in sandbox  
**Cost**: $0.10 per 1,000 emails after free tier

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-iam-smtp-username
SMTP_PASSWORD=your-iam-smtp-password
SMTP_FROM_EMAIL=verified-email@your-domain.com
SMTP_USE_TLS=true
```

**Setup Steps**:
1. Enable SES in your AWS account
2. Verify your sender email/domain
3. Create SMTP credentials in SES console
4. Request production access (removes sandbox limitations)

---

### 5. **Self-Hosted SMTP (Advanced Users)**

If you have your own mail server:

```env
SMTP_HOST=your-mail-server.com
SMTP_PORT=587  # or 25, 465 depending on your setup
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_USE_TLS=true  # or false for unencrypted
```

## 📋 **Backend Dependencies**

The following packages are already added to `pyproject.toml`:

```toml
"aiosmtplib>=3.0.1",  # For async SMTP sending
"jinja2>=3.1.4",      # For email templates
```

Install dependencies:
```bash
cd fastapi-backend
uv sync
```

## 🗄️ **Database Migration**

Run the migration to add password reset fields:

```bash
cd fastapi-backend
uv run alembic revision --autogenerate -m "Add password reset fields"
uv run alembic upgrade head
```

## 🧪 **Testing Email Configuration**

### 1. **Development Testing with MailHog**

For development without sending real emails:

```bash
# Install MailHog
go install github.com/mailhog/MailHog@latest

# Run MailHog
MailHog
```

Configuration for MailHog:
```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL=test@cloudlens.local
SMTP_USE_TLS=false
```

View emails at: http://localhost:8025

### 2. **Production Testing**

Test your production configuration:

```bash
curl -X POST "http://localhost:8000/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🔒 **Security Best Practices**

1. **Use App Passwords**: Never use your main email password
2. **Environment Variables**: Store credentials in `.env` files, never in code
3. **Rate Limiting**: Implement rate limiting on forgot password endpoint
4. **Token Expiration**: Keep reset tokens short-lived (1 hour recommended)
5. **HTTPS**: Always use HTTPS in production for password reset URLs

## 🚀 **Production Deployment**

### **Docker Environment Variables**

```dockerfile
ENV SMTP_HOST=smtp.mailgun.org
ENV SMTP_PORT=587
ENV SMTP_USER=postmaster@your-domain.mailgun.org
ENV SMTP_PASSWORD=your-mailgun-password
ENV SMTP_FROM_EMAIL=noreply@your-domain.com
ENV PASSWORD_RESET_BASE_URL=https://your-domain.com
```

### **Kubernetes Secret**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cloudlens-email
type: Opaque
stringData:
  smtp-user: postmaster@your-domain.mailgun.org
  smtp-password: your-mailgun-password
```

## 📊 **Monitoring & Logging**

Monitor email sending in your application logs:

```python
# The email service logs all attempts
logger.info(f"Email sent successfully to {to_email}")
logger.error(f"Failed to send email to {to_email}: {str(e)}")
```

Set up alerts for:
- High email failure rates
- SMTP authentication failures  
- Rate limit exceeded errors

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Authentication failed"**
   - Check username/password are correct
   - Verify 2FA is enabled for Gmail
   - Use app password, not account password

2. **"Connection refused"**
   - Verify SMTP host and port
   - Check firewall settings
   - Confirm TLS settings

3. **"Emails not received"**
   - Check spam folder
   - Verify sender email is not blacklisted
   - Test with different email providers

4. **"SSL/TLS errors"**
   - Try different ports (25, 465, 587)
   - Toggle SMTP_USE_TLS setting
   - Check if your provider requires specific TLS version

### **Debug Mode**

Enable debug logging in your backend:

```env
LOG_LEVEL=DEBUG
```

This will log detailed SMTP connection information.

## 🎯 **Email Templates**

The system includes responsive HTML email templates with:
- Professional CloudLens branding
- Mobile-friendly design  
- Security warnings
- Clear call-to-action buttons
- Fallback text versions

Templates are automatically used for:
- ✅ Password reset emails
- ✅ Welcome emails (optional)

## 📈 **Scaling Considerations**

For high-volume deployments:

1. **Rate Limiting**: Implement per-user rate limits
2. **Queue System**: Use Celery/RQ for background email sending
3. **Multiple Providers**: Configure fallback SMTP providers
4. **Email Analytics**: Track delivery rates and engagement

---

## 🎉 **Quick Start**

1. Choose an SMTP provider (Gmail for testing, Mailgun for production)
2. Add environment variables to your `.env` file
3. Run database migrations
4. Test with `/auth/forgot-password` endpoint
5. Deploy and monitor email delivery

Your CloudLens installation now has full password reset functionality! 🚀 