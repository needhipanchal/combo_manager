from django.db import models

# ============================================================
# PHP allowed modules:
# ['items', 'combo', 'combo_items', 'booking',
#  'booking_items', 'client', 'combo_barcode']
#
# Each module has its own _log table in PHP.
# Here we use ONE polymorphic LogEntry model with module field
# so Django manages a single table — much cleaner than 7 tables.
# The db_table matches the router logic in views.py.
# ============================================================

ACTION_CHOICES = [
    ('CREATE', 'Create'),
    ('UPDATE', 'Update'),
    ('DELETE', 'Delete'),
]

ALLOWED_MODULES = [
    'items',
    'combo',
    'combo_items',
    'booking',
    'booking_items',
    'client',
    'combo_barcode',
]


class LogEntry(models.Model):
    """
    Single log table that covers all 7 PHP _log tables.
    module field identifies which PHP table this maps to.
    old_data / new_data store the before/after JSON snapshots.
    """
    module     = models.CharField(
        max_length=50,
        db_index=True,
        choices=[(m, m) for m in ALLOWED_MODULES],
    )
    record_id  = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text="PK of the affected row in the source table",
        db_index=True,
    )
    action     = models.CharField(
        max_length=10,
        choices=ACTION_CHOICES,
        db_index=True,
    )
    old_data   = models.JSONField(
        null=True, blank=True,
        help_text="Row snapshot BEFORE the change",
    )
    new_data   = models.JSONField(
        null=True, blank=True,
        help_text="Row snapshot AFTER the change",
    )
    changed_by = models.CharField(
        max_length=255,
        null=True, blank=True,
        help_text="Username or user ID who made the change",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    notes      = models.TextField(null=True, blank=True)
    extra_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'logs'
        ordering = ['-id']
        indexes  = [
            models.Index(fields=['module', 'action']),
            models.Index(fields=['module', 'created_at']),
            models.Index(fields=['record_id']),
        ]

    def __str__(self):
        return f"[{self.module}] {self.action} #{self.record_id} @ {self.created_at}"