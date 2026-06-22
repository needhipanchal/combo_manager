from django.utils import timezone


def get_date_range_filter(queryset, field, start_date=None, end_date=None):
    """Apply date range filter to any queryset field."""
    if start_date:
        queryset = queryset.filter(**{f'{field}__date__gte': start_date})
    if end_date:
        queryset = queryset.filter(**{f'{field}__date__lte': end_date})
    return queryset


def current_timestamp():
    return timezone.now()
