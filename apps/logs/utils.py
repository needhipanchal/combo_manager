"""
apps/logs/utils.py
==================
Drop-in logging utility — mirrors what PHP was doing with _log tables.

Usage anywhere in the project:

    from apps.logs.utils import log_action

    # On CREATE
    log_action(module='items', record_id=item.id,
                action='CREATE', new_data=model_to_dict(item),
                request=request)

    # On UPDATE
    log_action(module='combo', record_id=combo.id,
                action='UPDATE',
                old_data=old_snapshot,   # dict BEFORE save
                new_data=new_snapshot,   # dict AFTER save
                request=request)

    # On DELETE
    log_action(module='client', record_id=client.id,
                action='DELETE', old_data=model_to_dict(client),
                request=request)
"""

import logging
from django.db import transaction
from django.forms.models import model_to_dict

logger = logging.getLogger(__name__)


def log_action(
    module: str,
    action: str,
    record_id=None,
    old_data: dict = None,
    new_data: dict = None,
    request=None,
    notes: str = None,
    extra_data: dict = None,
):
    """
    Write a log entry to the logs table.

    IMPORTANT: this runs inside its own nested atomic() block (a savepoint).
    If the logs table is missing, mis-migrated, or the insert fails for any
    reason, only that savepoint rolls back — the caller's outer transaction
    (e.g. creating a booking) is NOT poisoned and can continue normally.

    Parameters
    ----------
    module     : one of ALLOWED_MODULES (items, combo, combo_items,
                 booking, booking_items, client, combo_barcode)
    action     : 'CREATE' | 'UPDATE' | 'DELETE'
    record_id  : PK of the affected row
    old_data   : dict snapshot BEFORE change (UPDATE / DELETE)
    new_data   : dict snapshot AFTER change  (CREATE / UPDATE)
    request    : DRF/Django request object (used for user + IP)
    notes      : optional free-text note
    extra_data : any extra JSON you want to store
    """
    from apps.logs.models import LogEntry, ALLOWED_MODULES

    if module not in ALLOWED_MODULES:
        logger.warning(f"log_action: unknown module '{module}' — skipping log.")
        return None

    if action not in ('CREATE', 'UPDATE', 'DELETE'):
        logger.warning(f"log_action: unknown action '{action}' — skipping log.")
        return None

    # Extract user + IP from request
    changed_by = None
    ip_address = None

    if request:
        user = getattr(request, 'user', None)
        if user and getattr(user, 'is_authenticated', False):
            changed_by = str(user)          # email or str(user)

        # Support X-Forwarded-For (behind a proxy / nginx)
        x_fwd = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_fwd:
            ip_address = x_fwd.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    try:
        # Nested atomic() = a SAVEPOINT. If this fails, only this savepoint
        # rolls back — it does NOT poison any outer transaction.atomic()
        # block the caller might already be inside (e.g. booking creation).
        with transaction.atomic():
            entry = LogEntry.objects.create(
                module     = module,
                record_id  = record_id,
                action     = action,
                old_data   = old_data,
                new_data   = new_data,
                changed_by = changed_by,
                ip_address = ip_address,
                notes      = notes,
                extra_data = extra_data,
            )
        return entry
    except Exception as exc:
        # Never let logging crash the main flow — just log it and move on.
        logger.error(f"log_action failed: {exc}", exc_info=True)
        return None


# Alias — some views (e.g. apps/scan/views.py) import write_log instead.
# Same signature, same behaviour, just a different name for convenience:
#   write_log(module, action, record_id, old_data, new_data)
def write_log(module: str, action: str, record_id=None, old_data: dict = None, new_data: dict = None, **kwargs):
    return log_action(
        module=module,
        action=action,
        record_id=record_id,
        old_data=old_data,
        new_data=new_data,
        **kwargs,
    )


def snapshot(instance) -> dict:
    """
    Convert a Django model instance to a plain dict for logging.
    Converts Decimal/datetime to strings so it's JSON-serialisable.

    Usage:
        old_snap = snapshot(item)
        item.name = "New name"
        item.save()
        log_action('items', 'UPDATE', item.id, old_data=old_snap,
                   new_data=snapshot(item), request=request)
    """
    import decimal, datetime

    raw = model_to_dict(instance)

    def _clean(v):
        if isinstance(v, decimal.Decimal):
            return float(v)
        if isinstance(v, (datetime.datetime, datetime.date)):
            return v.isoformat()
        return v

    return {k: _clean(v) for k, v in raw.items()}