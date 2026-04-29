import json
import logging
import subprocess
from pathlib import Path

from app.core.config import settings


logger = logging.getLogger(__name__)


class InvoiceDeliveryError(Exception):
    pass


def send_invoice_email(invoice, recipient_email: str) -> str:
    project_root = Path(__file__).resolve().parents[3]
    script_path = project_root / "backend" / "app" / "scripts" / "send_invoice_email.mjs"

    if not script_path.is_file():
        raise InvoiceDeliveryError("Invoice email script is missing from the backend.")

    payload = {
        "recipient_email": recipient_email,
        "mail_from": settings.MAIL_FROM,
        "mail_username": settings.MAIL_USERNAME,
        "mail_password": settings.MAIL_PASSWORD,
        "mail_server": settings.MAIL_SERVER,
        "mail_port": settings.MAIL_PORT,
        "mail_starttls": settings.MAIL_STARTTLS,
        "mail_ssl_tls": settings.MAIL_SSL_TLS,
        "invoice": {
            "id": invoice.id,
            "invoice_code": invoice.invoice_code,
            "patient_name": invoice.patient_name,
            "invoice_date": invoice.invoice_date.isoformat(),
            "amount": str(invoice.amount),
            "status": invoice.status,
            "payment_method": invoice.payment_method,
        },
    }

    try:
        result = subprocess.run(
            ["node", str(script_path)],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            cwd=str(project_root),
            timeout=120,
            check=False,
        )
    except FileNotFoundError as exc:
        raise InvoiceDeliveryError("Node.js is not available on the server.") from exc
    except subprocess.TimeoutExpired as exc:
        raise InvoiceDeliveryError("Invoice PDF generation timed out before email delivery completed.") from exc

    stdout = (result.stdout or "").strip()
    stderr = (result.stderr or "").strip()

    if result.returncode != 0:
        logger.error("Invoice email script failed. stdout=%s stderr=%s", stdout, stderr)
        message = stderr or stdout or "The invoice email process exited unexpectedly."
        raise InvoiceDeliveryError(message)

    try:
        response = json.loads(stdout) if stdout else {}
    except json.JSONDecodeError as exc:
        raise InvoiceDeliveryError("The invoice email process returned an unreadable response.") from exc

    if not response.get("ok"):
        raise InvoiceDeliveryError(response.get("message") or "Invoice delivery failed.")

    return response.get("message") or "Invoice PDF generated and emailed successfully."
