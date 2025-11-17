# utils/email_service.py
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_transaction_email(to_email: str, subject: str, body: str):
    """Send an email using SMTP"""
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()

        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")


def send_transaction_emails(sender_email, receiver_email, transaction_id, amount, sender_balance, receiver_balance, status="SUCCESS"):
    """Send transaction summary to both sender and receiver"""
    try:
        # Email to sender
        sender_body = f"""
Dear Customer,

Your transaction has been processed successfully.

🧾 Transaction ID: {transaction_id}
💰 Amount Debited: ₹{amount:.2f}
🏦 Available Balance: ₹{sender_balance:.2f}
📊 Status: {status}

If this was not initiated by you, please contact our support immediately.

Regards,  
ABC Secure Bank
"""
        send_transaction_email(sender_email, f"Transaction Alert: ₹{amount:.2f} Debited", sender_body)

        # Email to receiver
        receiver_body = f"""
Dear Customer,

You have received a new credit in your account.

🧾 Transaction ID: {transaction_id}
💰 Amount Credited: ₹{amount:.2f}
🏦 Updated Balance: ₹{receiver_balance:.2f}
📊 Status: {status}

If you did not expect this transaction, please contact our support.

Regards,  
ABC Secure Bank
"""
        send_transaction_email(receiver_email, f"Transaction Alert: ₹{amount:.2f} Credited", receiver_body)

    except Exception as e:
        print(f"⚠️ Failed to send one or more emails: {e}")
  