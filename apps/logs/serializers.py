from rest_framework import serializers
from .models import LogEntry, ALLOWED_MODULES


# ============================================================
# LIST — matches PHP: SELECT * FROM {module}_log ORDER BY id DESC
# ============================================================

class LogEntryListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LogEntry
        fields = [
            'id',
            'module',
            'record_id',
            'action',
            'old_data',
            'new_data',
            'changed_by',
            'ip_address',
            'notes',
            'extra_data',
            'created_at',
        ]
        read_only_fields = fields   # logs are read-only via API


# ============================================================
# CREATE — used internally by log_action() util, not exposed
# ============================================================

class LogEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LogEntry
        fields = [
            'module',
            'record_id',
            'action',
            'old_data',
            'new_data',
            'changed_by',
            'ip_address',
            'notes',
            'extra_data',
        ]

    def validate_module(self, value):
        if value not in ALLOWED_MODULES:
            raise serializers.ValidationError(
                f"Invalid module. Valid: {', '.join(ALLOWED_MODULES)}"
            )
        return value

    def validate_action(self, value):
        if value not in ('CREATE', 'UPDATE', 'DELETE'):
            raise serializers.ValidationError(
                "Invalid action. Valid: CREATE, UPDATE, DELETE"
            )
        return value