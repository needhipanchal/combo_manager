from django.db import transaction
from django.db.models import Count, F
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated

from .models import Booking
from apps.combo.models import ComboBarcode, ComboItem

from .serializers import (
    BookingCreateSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
)



class BookingCreateAPIView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.none()

    def perform_create(self, serializer):
        serializer.save()



class BookingListAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = [
        "client__name",
        "client__phone",
        "client__email",
    ]

    def get_queryset(self):
        return (
            Booking.objects
            .select_related("client")
            .annotate(
                item_count=Count("booking_items"),
            )
            .only(
                "id",
                "client_id",
                "created_at",
                "updated_at",
                "client__name",
                "client__phone",
                "client__email",
            )
            .order_by("-id")
        )



class BookingRetrieveAPIView(generics.RetrieveAPIView):
    serializer_class = BookingDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Booking.objects
            .select_related("client")
            .annotate(item_count=Count("booking_items"))
            .prefetch_related(
                "booking_items",
                "booking_items__combo_barcode",
                "booking_items__combo_barcode__combo",
            )
        )



class BookingDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
 
    def get_queryset(self):
        return (Booking.objects.prefetch_related("booking_items",))
 
    def perform_destroy(self, instance):
        with transaction.atomic():
            barcode_ids = instance.booking_items.values_list(
                "combo_barcode_id",
                flat=True
            )

            ComboBarcode.objects.filter(
                id__in=barcode_ids
            ).update(
                status=ComboBarcode.Status.ACTIVE
            )

            instance.booking_items.all().delete()
            instance.delete()