from django.contrib import admin
from .models import LogEntry


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display    = ['id', 'module', 'action', 'record_id', 'changed_by', 'ip_address', 'created_at']
    list_filter     = ['module', 'action']
    search_fields   = ['module', 'record_id', 'changed_by', 'notes']
    readonly_fields = ['module', 'record_id', 'action', 'old_data', 'new_data',
                       'changed_by', 'ip_address', 'notes', 'extra_data', 'created_at']
    ordering        = ['-id']

    def has_add_permission(self, request):
        return False   # logs are written by the system only

    def has_change_permission(self, request, obj=None):
        return False   # logs are immutable