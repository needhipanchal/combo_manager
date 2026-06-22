import uuid

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from .models import ComboBarcode, ComboItem
from apps.items.models import Item


def generate_barcode_number():
    """
    Generate unique barcode number.
    """
    return uuid.uuid4().hex[:16].upper()


def create_barcode(combo):
    """
    Create a single barcode record.

    QR and barcode images are generated dynamically through
    API endpoints, so nothing is stored on disk or in DB.
    """
    barcode_number = generate_barcode_number()

    barcode_obj = ComboBarcode.objects.create(
        combo=combo,
        barcode=barcode_number,
    )

    return barcode_obj


def deduct_stock_for_combo(combo, quantity):
    """
    Deducts item stock for `quantity` sets of this combo.
    Raises ValidationError if any item doesn't have enough stock.
    """
    combo_items = list(
        ComboItem.objects.select_related("item").filter(combo=combo)
    )

    if not combo_items:
        raise ValidationError(
            "This combo has no items — cannot generate barcodes."
        )

    for ci in combo_items:
        needed = ci.quantity * quantity

        if ci.item.quantity < needed:
            raise ValidationError(
                f"Insufficient stock for '{ci.item.name}': "
                f"need {needed}, have {ci.item.quantity}."
            )

    for ci in combo_items:
        needed = ci.quantity * quantity

        Item.objects.filter(pk=ci.item_id).update(
            quantity=F("quantity") - needed
        )


def restore_stock_for_barcode(combo_barcode):
    """
    Restores item stock for ONE barcode (quantity=1 set of combo).
    """
    combo_items = ComboItem.objects.filter(
        combo_id=combo_barcode.combo_id
    )

    for ci in combo_items:
        Item.objects.filter(pk=ci.item_id).update(
            quantity=F("quantity") + ci.quantity
        )


@transaction.atomic
def create_bulk_barcodes(combo, quantity):
    """
    Create multiple barcodes and deduct stock.
    """
    deduct_stock_for_combo(combo, quantity)

    barcodes = []

    for _ in range(quantity):
        barcode_obj = create_barcode(combo=combo)
        barcodes.append(barcode_obj)

    return barcodes


@transaction.atomic
def delete_unused_barcode(combo_barcode):
    """
    Delete barcode and restore stock if unused.
    """
    if combo_barcode.status != ComboBarcode.Status.ACTIVE:
        raise ValidationError(
            "Only unused (active) barcodes can be deleted. "
            "This barcode has already been used in a booking."
        )

    restore_stock_for_barcode(combo_barcode)
    combo_barcode.delete()