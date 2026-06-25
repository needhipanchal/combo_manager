from django.urls import path

from .barcode_views import (ComboBarcodeCreateAPIView, ComboBarcodeDeleteAPIView)
from .views_barcode import (BarcodeImageAPIView, QRImageAPIView)

urlpatterns = [
    path("<int:pk>/generate/", ComboBarcodeCreateAPIView.as_view(), name="combo-barcode-generate"),
    path("<int:pk>/delete/", ComboBarcodeDeleteAPIView.as_view(), name="combo-barcode-delete"),
    path("<str:barcode>/image/", BarcodeImageAPIView.as_view(), name="combo-barcode-image"),
    path("<str:barcode>/qr/",    QRImageAPIView.as_view(),       name="combo-barcode-qr"),
]