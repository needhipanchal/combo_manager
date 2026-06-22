from django.urls import path

from .views import (
    ComboCreateAPIView,
    ComboListAPIView,
    ComboRetrieveAPIView,
    ComboUpdateAPIView,
    ComboDeleteAPIView,
    ComboBarcodeCreateAPIView,
    ComboBarcodeListAPIView,
    PublicComboBarcodeDetailAPIView,
)

from .views_barcode import BarcodeImageAPIView

urlpatterns = [
    path("", ComboListAPIView.as_view(), name="combo-list"),
    path("create/", ComboCreateAPIView.as_view(), name="combo-create"),
    path("<int:pk>/", ComboRetrieveAPIView.as_view(), name="combo-detail"),
    path("<int:pk>/update/", ComboUpdateAPIView.as_view(), name="combo-update"),
    path("<int:pk>/delete/", ComboDeleteAPIView.as_view(), name="combo-delete"),

    path("barcode/<str:barcode>/", BarcodeImageAPIView.as_view()),
    
    path("<int:combo_id>/generate/", ComboBarcodeCreateAPIView.as_view()),
    path("<int:combo_id>/barcodes/", ComboBarcodeListAPIView.as_view()),
    path("public/scan-info/<str:barcode>/", PublicComboBarcodeDetailAPIView.as_view()),
]