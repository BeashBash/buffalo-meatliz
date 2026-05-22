"""
Notification service — placeholders for WhatsApp, SMS, Email.
Replace with real providers (e.g. Twilio, 019, etc.) when ready.
"""
import logging
from app.models.buffalo import Order

logger = logging.getLogger(__name__)


async def send_order_confirmation(order: Order):
    """Notify customer that order was received."""
    message = (
        f"שלום {order.customer_name}! 🥩\n"
        f"הזמנתך #{order.order_number} התקבלה בהצלחה.\n"
        f"סכום משוער: ₪{order.estimated_total:.2f}\n"
        f"המחיר הסופי יחושב לאחר השקילה.\n"
        f"תודה, צוות באפלו מיטליז"
    )
    await _send_whatsapp(order.customer_phone, message)


async def send_weighing_complete(order: Order):
    """Notify customer with final price and payment link after weighing."""
    message = (
        f"שלום {order.customer_name}! 🥩\n"
        f"הזמנתך #{order.order_number} נשקלה.\n"
        f"💰 מחיר סופי: ₪{order.final_total:.2f}\n"
        f"לתשלום לחץ: {order.payment_link}\n"
        f"תודה, צוות באפלו מיטליז"
    )
    await _send_whatsapp(order.customer_phone, message)


async def send_payment_received(order: Order):
    """Notify customer that payment was received."""
    message = (
        f"שלום {order.customer_name}! ✅\n"
        f"תשלום עבור הזמנה #{order.order_number} התקבל.\n"
        f"הזמנתך תישלח בהקדם.\n"
        f"תודה, צוות באפלו מיטליז"
    )
    await _send_whatsapp(order.customer_phone, message)


async def _send_whatsapp(phone: str, message: str):
    """Placeholder — integrate with WhatsApp Business API / Twilio / 019."""
    logger.info(f"[WhatsApp STUB] To: {phone}\n{message}")
    # TODO: implement with real provider
    # Example with Twilio:
    # from twilio.rest import Client
    # client = Client(settings.twilio_sid, settings.twilio_token)
    # client.messages.create(
    #     body=message,
    #     from_='whatsapp:+1415XXXXXXX',
    #     to=f'whatsapp:{phone}'
    # )


async def _send_sms(phone: str, message: str):
    """Placeholder — integrate with SMS provider (019, Inforu, etc.)."""
    logger.info(f"[SMS STUB] To: {phone}\n{message}")
    # TODO: implement with real SMS provider


async def _send_email(email: str, subject: str, body: str):
    """Placeholder — integrate with email provider (SendGrid, Mailgun, etc.)."""
    logger.info(f"[Email STUB] To: {email}\nSubject: {subject}\n{body}")
    # TODO: implement with real email provider
