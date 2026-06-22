from django_filters.rest_framework import (DjangoFilterBackend)
from rest_framework import generics
from rest_framework.filters import (SearchFilter, OrderingFilter)
from rest_framework.permissions import (IsAuthenticated)
from rest_framework.exceptions import ValidationError
from django.db.models import ProtectedError
from rest_framework_simplejwt.authentication import (JWTAuthentication)
from .models import Item
from .serializers import (
    ItemsCreateSerializer,
    ItemsUpdateSerializer,
    ItemsListSerializer,
    ItemsDetailSerializer,
)



class ItemsListView(generics.ListAPIView):

    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]
    serializer_class = ItemsListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter,]
    search_fields = ["name", "description", "hsn_sac_code",]
    filterset_fields = ["hsn_sac_code",]
    ordering_fields = ["name", "quantity", "rate", "created_at",]
    ordering = ["-id",]

    def get_queryset(self):
        return (
            Item.objects.only("id", "name", "hsn_sac_code", "quantity", "rate", "created_at",))


class ItemsCreateView(generics.CreateAPIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = (ItemsCreateSerializer)
    queryset = (Item.objects.only("id"))


class ItemsDetailView(generics.RetrieveAPIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = (ItemsDetailSerializer)

    queryset = (Item.objects.
                only("id", "name", "description", "hsn_sac_code","quantity", "rate",))


class ItemsUpdateView(generics.UpdateAPIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = (ItemsUpdateSerializer)

    queryset = (
        Item.objects
        .only("id", "name", "description", "hsn_sac_code", "quantity", "rate",))

    http_method_names = ["put", "patch",]


class ItemsDeleteView(generics.DestroyAPIView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = (Item.objects.only("id", "name"))

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(f"Cannot delete '{instance.name}' — it is used in one or more combos.")