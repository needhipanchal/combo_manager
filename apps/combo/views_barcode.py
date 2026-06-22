from django.http import HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import ComboBarcode
from .barcode_image import generate_barcode_image, generate_qr_image


class BarcodeImageAPIView(generics.GenericAPIView):
    
    permission_classes = [IsAuthenticated]
    queryset = ComboBarcode.objects.all()

    def get(self, request, barcode, *args, **kwargs):
        image = generate_barcode_image(barcode)
        return HttpResponse(image, content_type="image/png")


class QRImageAPIView(generics.GenericAPIView):
    
    permission_classes = [IsAuthenticated]
    queryset = ComboBarcode.objects.all()

    def get(self, request, barcode, *args, **kwargs):
        image = generate_qr_image(barcode)
        return HttpResponse(image, content_type="image/png")