from rest_framework import serializers


# ============================================================
# ITEMS REPORT SERIALIZERS
# ============================================================

class ItemsReportListSerializer(serializers.Serializer):
    """Matches: SELECT id, name, description, hsn_sac, quantity, amount, created_at, updated_at FROM items"""
    id          = serializers.IntegerField()
    name        = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    hsn_sac     = serializers.CharField(allow_null=True)
    quantity    = serializers.IntegerField(allow_null=True)
    amount      = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    created_at  = serializers.DateTimeField()
    updated_at  = serializers.DateTimeField()


# ============================================================
# COMBO REPORT SERIALIZERS
# ============================================================

class ComboReportListSerializer(serializers.Serializer):
    """
    Matches combo report query:
    c.id, c.name, c.quantity, c.created_at,
    total_barcodes, used_barcodes, available_barcodes,
    total_items, total_value
    """
    id                = serializers.IntegerField()
    name              = serializers.CharField()
    quantity          = serializers.IntegerField(allow_null=True)
    created_at        = serializers.DateTimeField()
    total_barcodes    = serializers.IntegerField()
    used_barcodes     = serializers.IntegerField()
    available_barcodes = serializers.IntegerField()
    total_items       = serializers.IntegerField()
    total_value       = serializers.DecimalField(max_digits=12, decimal_places=2)


# ============================================================
# BOOKING REPORT SERIALIZERS
# ============================================================

class BookingReportListSerializer(serializers.Serializer):
    """
    Matches booking report query:
    booking_id, created_at,
    client_name, client_phone, client_email,
    combo_name, combo_barcode, items_barcode,
    total_qty, total_value
    """
    booking_id    = serializers.IntegerField()
    created_at    = serializers.DateTimeField()
    client_name   = serializers.CharField(allow_null=True)
    client_phone  = serializers.CharField(allow_null=True)
    client_email  = serializers.EmailField(allow_null=True)
    combo_name    = serializers.CharField(allow_null=True)
    combo_barcode = serializers.CharField(allow_null=True)
    items_barcode = serializers.CharField(allow_null=True)
    total_qty     = serializers.IntegerField(allow_null=True)
    total_value   = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)


# ============================================================
# PAGINATED RESPONSE SERIALIZER (shared wrapper)
# ============================================================

class PaginatedReportSerializer(serializers.Serializer):
    """Generic paginated wrapper — matches PHP paginate() output."""
    total        = serializers.IntegerField()
    per_page     = serializers.IntegerField()
    current_page = serializers.IntegerField()
    last_page    = serializers.IntegerField()
    data         = serializers.ListField()