from django.core.mail import send_mail
from django.conf import settings
from .utils import generate_otp
from .models import User


from django.core.mail import EmailMultiAlternatives

from django.utils.html import strip_tags



def build_otp_email(otp, purpose):
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f7f7; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background-color: #245F73; color: white; padding: 22px 30px;">
          <h2 style="margin: 0; font-weight: 600;">Self Made Dev</h2>
          <p style="margin: 0; font-size: 14px;">Preliminary Exam Portal by Byteblooper</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 28px 30px; color: #333333;">
          <h3 style="margin-bottom: 10px; color: #111827;">{purpose}</h3>
          <p style="margin: 0 0 10px;">Hi,</p>
          <p style="margin: 0 0 18px;">Your One-Time Password (OTP) is:</p>
          
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; background: #245F73; color: #ffffff; padding: 12px 24px; font-size: 22px; font-weight: 700; letter-spacing: 3px; border-radius: 8px;">
              {otp}
            </span>
          </div>
          
          <p style="margin: 0 0 8px;">This OTP is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
          <p style="margin: 0;">If you didn’t request this, you can safely ignore this email.</p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f1f5f9; border-top: 3px solid #245F73; text-align: center; padding: 15px; font-size: 12px; color: #6b7280;">
          © 2025 <strong>ByteBlooper</strong> | All rights reserved.
        </div>
      </div>
    </div>
    """







def send_otp_via_email(email):
    subject = "Verify Your Email – Self Made Dev"
    otp = generate_otp()
    html_content = build_otp_email(otp, "Email Verification")
    text_content = strip_tags(html_content)

    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        user = User.objects.get(email=email)
        user.otp = otp
        user.save()

        return otp
    except Exception as e:
        print(f"Error sending email: {e}")
        return None


def send_otp_via_email_forgot_password(email):
    subject = "Password Reset – Self Made Dev"
    otp = generate_otp()
    html_content = build_otp_email(otp, "Password Reset Request")
    text_content = strip_tags(html_content)

    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        user = User.objects.get(email=email)
        user.otp = otp
        user.save()

        return otp
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
