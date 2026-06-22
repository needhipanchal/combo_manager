from datetime import date
from apps.combo.models import ComboBarcode


def generate_combo_barcodes(qty: int) -> list:
    """Generate unique barcodes: YYYYMMDD + 4-digit sequence."""
    if qty <= 0:
        return []

    today = date.today().strftime('%Y%m%d')

    # Get last barcode globally for sequence
    last = ComboBarcode.objects.order_by('-id').values_list('barcode', flat=True).first()
    last_counter = 0

    if last:
        import re
        match = re.search(r'\d{8}(\d+)$', last)
        if match:
            last_counter = int(match.group(1))

    barcodes = []
    for _ in range(qty):
        last_counter += 1
        candidate = today + str(last_counter).zfill(4)

        # Uniqueness guard
        while ComboBarcode.objects.filter(barcode=candidate).exists():
            last_counter += 1
            candidate = today + str(last_counter).zfill(4)

        barcodes.append(candidate)

    return barcodes