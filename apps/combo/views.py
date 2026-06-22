from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import filters
from rest_framework.exceptions import ValidationError

from django.db.models import Count, Q, ProtectedError

import uuid

from .models import Combo, ComboBarcode
from .services import create_bulk_barcodes

from .serializers import (
    ComboCreateSerializer,
    ComboListSerializer,
    ComboDetailSerializer,
    ComboUpdateSerializer,
    ComboBarcodeCreateSerializer,
    PublicComboBarcodeDetailSerializer,
)


class ComboCreateAPIView(generics.CreateAPIView):
    serializer_class = ComboCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Combo.objects.none()


class ComboListAPIView(generics.ListAPIView):

    serializer_class = ComboListSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        return Combo.objects.prefetch_related(
            "combo_items__item",
            "barcodes",
        ).order_by("-id")


class ComboRetrieveAPIView(generics.RetrieveAPIView):

    serializer_class = ComboDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Combo.objects
            .prefetch_related(
                "combo_items__item",
                "barcodes",
            )
        )


class ComboUpdateAPIView(generics.UpdateAPIView):

    serializer_class = ComboUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Combo.objects.all()


class ComboDeleteAPIView(generics.DestroyAPIView):

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Combo.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {"message": "Cannot delete this combo — one or more of its barcodes have been used in a booking."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ComboBarcodeCreateAPIView(generics.CreateAPIView):
    serializer_class = ComboBarcodeCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print(f"[VIEW] ComboBarcodeCreateAPIView hit -> pk={self.kwargs.get('pk')} data={request.data}")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        combo = Combo.objects.get(pk=self.kwargs["combo_id"])
        quantity = serializer.validated_data["quantity"]

        try:
            create_bulk_barcodes(combo=combo, quantity=quantity)
        except ValidationError as e:
            detail = e.detail[0] if isinstance(e.detail, list) else str(e.detail)
            print(f"[VIEW] ValidationError caught -> {detail}")
            return Response({"message": detail}, status=status.HTTP_409_CONFLICT)

        return Response({
            "message": f"{quantity} barcodes generated successfully."
        })


class ComboBarcodeListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        combo_id = self.kwargs["combo_id"]
        barcodes = ComboBarcode.objects.filter(combo_id=combo_id).order_by("id")
        data = [
            {"id": b.id, "barcode": b.barcode, "status": b.status}
            for b in barcodes
        ]
        return Response(data)



class PublicComboBarcodeDetailAPIView(generics.RetrieveAPIView):
    
    serializer_class = PublicComboBarcodeDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "barcode"

    def get_queryset(self):
        return ComboBarcode.objects.select_related("combo")