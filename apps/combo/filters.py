import django_filters

from .models import Combo


class ComboFilter(django_filters.FilterSet):

    search = django_filters.CharFilter(
        field_name="name",
        lookup_expr="icontains",
    )

    class Meta:
        model = Combo
        fields = []