"""
Email service for sending password reset and other notification emails
"""
import aiosmtplib
import logging
from email.message import EmailMessage
from typing import Optional
from jinja2 import Template
from ..config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """SMTP email service for open source deployments"""
    
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
        self.from_email = settings.smtp_from_email or settings.smtp_user
        self.from_name = settings.smtp_from_name
        self.use_tls = settings.smtp_use_tls

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email using SMTP"""
        try:
            # Validate SMTP configuration
            if not all([self.smtp_host, self.smtp_user, self.smtp_password, self.from_email]):
                logger.error("SMTP configuration is incomplete. Please check environment variables.")
                return False

            # Create message
            message = EmailMessage()
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            message["Subject"] = subject
            
            # Set content
            if text_content:
                message.set_content(text_content)
                message.add_alternative(html_content, subtype='html')
            else:
                message.set_content(html_content, subtype='html')

            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                use_tls=self.use_tls,
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: str
    ) -> bool:
        """Send password reset email"""
        
        reset_url = f"{settings.password_reset_base_url}/reset-password?token={reset_token}"
        
        # HTML email template
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - CloudLens</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; margin-top: 40px; }
                .header { text-align: center; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                .content { line-height: 1.6; color: #374151; }
                .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
                .warning { background: #fef3c7; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">☁️ CloudLens</div>
                </div>
                
                <div class="content">
                    <h2>Reset Your Password</h2>
                    
                    <p>Hello {{ user_name }},</p>
                    
                    <p>We received a request to reset the password for your CloudLens account associated with this email address.</p>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{{ reset_url }}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>Security Notice:</strong><br>
                        • This link will expire in {{ expire_hours }} hour(s)<br>
                        • If you didn't request this, you can safely ignore this email<br>
                        • Never share this link with anyone
                    </div>
                    
                    <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280; font-size: 14px;">{{ reset_url }}</p>
                    
                    <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
                </div>
                
                <div class="footer">
                    <p>This email was sent by CloudLens. If you have questions, please contact our support team.</p>
                    <p>© {{ current_year }} CloudLens. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
                """)
        
        # Text version for email clients that don't support HTML
        text_content = f"""
            CloudLens - Password Reset

            Hello {user_name},

            We received a request to reset the password for your CloudLens account.

            To reset your password, visit this link:
            {reset_url}

            This link will expire in {settings.password_reset_token_expire_hours} hour(s).

            If you didn't request this password reset, you can safely ignore this email.

            If the link doesn't work, copy and paste it into your browser.

            Questions? Contact our support team.

            © 2025 CloudLens. All rights reserved.
        """
        
        import datetime
        current_year = datetime.datetime.now().year
        
        html_content = html_template.render(
            user_name=user_name,
            reset_url=reset_url,
            expire_hours=settings.password_reset_token_expire_hours,
            current_year=current_year
        )
        
        return await self._send_email(
            to_email=to_email,
            subject="Reset your CloudLens password",
            html_content=html_content,
            text_content=text_content
        )

    async def send_welcome_email(
        self,
        to_email: str,
        user_name: str
    ) -> bool:
        """Send welcome email to new users"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to CloudLens</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; margin-top: 40px; }}
                .header {{ text-align: center; margin-bottom: 40px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #2563eb; }}
                .content {{ line-height: 1.6; color: #374151; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">☁️ CloudLens</div>
                </div>
                
                <div class="content">
                    <h2>Welcome to CloudLens!</h2>
                    
                    <p>Hello {user_name},</p>
                    
                    <p>Thank you for joining CloudLens! We're excited to help you secure your cloud infrastructure.</p>
                    
                    <p>Get started by:</p>
                    <ul>
                        <li>Setting up your AWS credentials</li>
                        <li>Running your first security scan</li>
                        <li>Exploring your security dashboard</li>
                    </ul>
                    
                    <div style="text-align: center;">
                        <a href="{settings.password_reset_base_url}/dashboard" class="button">Get Started</a>
                    </div>
                    
                    <p>If you have any questions, our documentation and support team are here to help.</p>
                    
                    <p>Welcome aboard!</p>
                    <p>The CloudLens Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self._send_email(
            to_email=to_email,
            subject="Welcome to CloudLens!",
            html_content=html_content
        )


# Global email service instance
email_service = EmailService() 