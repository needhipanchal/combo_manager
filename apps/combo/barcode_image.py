from io import BytesIO
from barcode import Code128
from barcode.writer import ImageWriter
import qrcode


def generate_barcode_image(barcode_value: str) -> bytes:
    """Linear Code128 barcode — for handheld scanner devices."""
    buffer = BytesIO()
    Code128(barcode_value, writer=ImageWriter()).write(buffer)
    return buffer.getvalue()


def generate_qr_image(barcode_value: str) -> bytes:
    buffer = BytesIO()

    scan_url = (f"http://192.168.1.19:5173/scan-info/{barcode_value}")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(scan_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(buffer, format="PNG")

    return buffer.getvalue()