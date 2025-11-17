import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """SMTP Email Service for transaction notifications"""
    
    def __init__(self):
        self.host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self.port = int(os.getenv("EMAIL_PORT", "587"))
        self.address = os.getenv("EMAIL_ADDRESS")
        self.password = os.getenv("EMAIL_PASSWORD")
        
        if not self.address or not self.password:
            print("Warning: Email credentials not configured")
    
    def send_transaction_verification(self, to_email: str, vendor_name: str, amount: float, tx_id: str, session_id: str, base_url: str):
        """Send transaction verification email to customer"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'ABC Secure Bank - FacePay Transaction Verification'
            msg['From'] = self.address
            msg['To'] = to_email
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">ABC Secure Bank</h1>
                    </div>
                    <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Transaction Verification Required</h2>
                        <p style="font-size: 16px; color: #555;">A FacePay transaction was just initiated:</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 8px 0;"><strong>Vendor:</strong> {vendor_name}</p>
                            <p style="margin: 8px 0;"><strong>Amount:</strong> ₹{amount:.2f}</p>
                            <p style="margin: 8px 0;"><strong>Transaction ID:</strong> {tx_id}</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #555; font-weight: bold;">Did you authorize this transaction?</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{base_url}/verify-transaction?session={session_id}&action=yes" 
                               style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">✓ Yes, I authorized it</a>
                            <a href="{base_url}/verify-transaction?session={session_id}&action=no" 
                               style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">✗ No, not me</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #888; margin-top: 30px;">If you click "No, not me", your FacePay will be automatically disabled and the transaction will be flagged for review.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                        <p style="font-size: 12px; color: #aaa;">This is an automated message from ABC Secure Bank. Please do not reply to this email.</p>
                    </div>
                </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.address, self.password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def send_otp(self, to_email: str, otp: str, vendor_name: str):
        """Send OTP verification email"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'ABC Secure Bank - OTP Verification'
            msg['From'] = self.address
            msg['To'] = to_email
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">ABC Secure Bank</h1>
                    </div>
                    <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
                        <p style="font-size: 16px; color: #555;">Hello {vendor_name},</p>
                        <p style="font-size: 16px; color: #555;">Your verification code is:</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">{otp}</h1>
                        </div>
                        
                        <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                        <p style="font-size: 12px; color: #aaa;">If you didn't request this code, please ignore this email.</p>
                    </div>
                </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.address, self.password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Error sending OTP email: {e}")
            return False

email_service = EmailService()