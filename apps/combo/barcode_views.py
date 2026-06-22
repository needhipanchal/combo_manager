from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import Combo, ComboBarcode
from .serializers import ComboBarcodeCreateSerializer
from .services import create_bulk_barcodes, delete_unused_barcode


class ComboBarcodeCreateAPIView(generics.CreateAPIView):
    """
    POST /api/combo/<pk>/generate/
    Generates `quantity` new barcodes for the combo and deducts
    item stock immediately (see services.create_bulk_barcodes).
    """
    serializer_class = ComboBarcodeCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        combo = Combo.objects.get(pk=self.kwargs["pk"])
        quantity = serializer.validated_data["quantity"]

        try:
            create_bulk_barcodes(combo=combo, quantity=quantity)
        except ValidationError as e:
            return Response(
                {"message": e.detail[0] if isinstance(e.detail, list) else str(e.detail)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response({
            "message": f"{quantity} barcodes generated successfully."
        })


class ComboBarcodeDeleteAPIView(generics.DestroyAPIView):
    """
    DELETE /api/combo_barcode/<pk>/delete/

    Deletes a single barcode and restores the stock that was
    reserved for it — but only if the barcode is still unused
    (status=ACTIVE). If it has already been booked, deletion is
    rejected with a 409 so a real booking's stock can't be silently
    removed through this endpoint.
    """
    permission_classes = [IsAuthenticated]
    queryset = ComboBarcode.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        try:
            delete_unused_barcode(instance)
        except ValidationError as e:
            return Response(
                {"message": e.detail[0] if isinstance(e.detail, list) else str(e.detail)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"message": "Barcode deleted and stock restored."},
            status=status.HTTP_200_OK,
        )