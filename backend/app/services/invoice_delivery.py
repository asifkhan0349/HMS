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

    # Read line items from the saved invoice record (persisted in the DB)
    stored_line_items = invoice.line_items or []

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
        "line_items": stored_line_items,
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


def download_invoice_pdf(invoice) -> bytes:
    """Generate invoice PDF and return raw bytes for a file download response."""
    project_root = Path(__file__).resolve().parents[3]
    script_path = project_root / "backend" / "app" / "scripts" / "download_invoice_pdf.mjs"

    if not script_path.is_file():
        raise InvoiceDeliveryError("Invoice PDF download script is missing from the backend.")

    stored_line_items = invoice.line_items or []

    payload = {
        "invoice": {
            "id": invoice.id,
            "invoice_code": invoice.invoice_code,
            "patient_name": invoice.patient_name,
            "invoice_date": invoice.invoice_date.isoformat(),
            "amount": str(invoice.amount),
            "status": invoice.status,
            "payment_method": invoice.payment_method,
        },
        "line_items": stored_line_items,
    }

    try:
        result = subprocess.run(
            ["node", str(script_path)],
            input=json.dumps(payload).encode(),
            capture_output=True,
            cwd=str(project_root),
            timeout=120,
            check=False,
        )
    except FileNotFoundError as exc:
        raise InvoiceDeliveryError("Node.js is not available on the server.") from exc
    except subprocess.TimeoutExpired as exc:
        raise InvoiceDeliveryError("Invoice PDF generation timed out.") from exc

    if result.returncode != 0:
        stderr = (result.stderr or b"").decode(errors="replace").strip()
        logger.error("Invoice PDF download script failed. stderr=%s", stderr)
        raise InvoiceDeliveryError(stderr or "PDF generation process exited unexpectedly.")

    if not result.stdout:
        raise InvoiceDeliveryError("PDF generation produced no output.")

    return result.stdout
