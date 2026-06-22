from django.db import models
from apps.items.models import Item
import uuid


class Combo(models.Model):

    name = models.CharField(max_length=255, unique=True, db_index=True, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True, null=False, blank=False)
    updated_at = models.DateTimeField(auto_now=True, null=False, blank=False)

    class Meta:
        db_table = "combos"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.name



class ComboItem(models.Model):

    combo = models.ForeignKey(Combo, on_delete=models.CASCADE, related_name="combo_items", null=False, blank=False)
    item = models.ForeignKey( Item, on_delete=models.PROTECT, related_name="combo_items", null=False, blank=False)
    quantity = models.PositiveIntegerField(default=1, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "combo_items"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["combo", "item"],
                name="unique_combo_item",
            )
        ]
        indexes = [
            models.Index(fields=["combo"]),
            models.Index(fields=["item"]),
            models.Index(fields=["combo", "item"]),
        ]

    def __str__(self):
        return f"{self.combo.name} - {self.item.name}"


class ComboBarcode(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        USED = "used", "Used"
        DELETED = "deleted", "Deleted"

    combo = models.ForeignKey(Combo, on_delete=models.CASCADE, related_name="barcodes")
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    status= models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE,db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "combo_barcodes"
        ordering = ["-id"]

        indexes = [
            models.Index(fields=["barcode"]),
            models.Index(fields=["status"]),
            models.Index(fields=["combo"]),
            models.Index(fields=["combo", "status"]),
        ]

    def __str__(self):
        return self.barcode

    def save(self, *args, **kwargs):

        if not self.barcode:
            self.barcode = uuid.uuid4().hex[:16].upper()

        super().save(*args, **kwargs)