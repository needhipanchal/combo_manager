import django_filters
from django.db.models import Q

from .models import Client


class ClientFilter(django_filters.FilterSet):

    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.CharFilter(field_name="status")

    class Meta:
        model = Client
        fields = ("status",)

    def filter_search(self, queryset, name, value):

        value = value.strip()

        if not value:
            return queryset

        return queryset.filter(
            Q(name__icontains=value) |
            Q(phone__icontains=value) |
            Q(email__icontains=value)
        )