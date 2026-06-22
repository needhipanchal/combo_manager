from django.db import models

from apps.client.models import Client
from apps.combo.models import ComboBarcode


class Booking(models.Model):

    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name="bookings")
    quantity = models.PositiveIntegerField(default=0)
    scanned_pairs = models.PositiveIntegerField(default=0)    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["client"]),
            models.Index(fields=["created_at"]),
        ]  

    def __str__(self):
        return f"Booking #{self.id}"


class BookingItem(models.Model):

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="booking_items")
    combo_barcode = models.ForeignKey(ComboBarcode, on_delete=models.PROTECT, related_name="booking_items")
    # item_barcode = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking_items"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["combo_barcode"],
                name="unique_booked_combo_barcode",
            )
        ]
        indexes = [
            models.Index(fields=["booking"]),
            models.Index(fields=["combo_barcode"]),
        ]

    def __str__(self):
        return self.combo_barcode.barcode


class BookingLog(models.Model):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"

    action = models.CharField(max_length=10, choices=Action.choices)
    reference_id = models.PositiveBigIntegerField()
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_logs"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["reference_id"]),
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.reference_id}"


class BookingItemLog(models.Model):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"

    action = models.CharField(max_length=10, choices=Action.choices)
    reference_id = models.PositiveBigIntegerField()
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_item_logs"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["reference_id"]),
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.reference_id}"

        