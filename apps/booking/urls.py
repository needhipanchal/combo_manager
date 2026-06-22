from django.urls import path

from .views import (
    BookingCreateAPIView,
    BookingListAPIView,
    BookingRetrieveAPIView,
    BookingDeleteAPIView,
)

urlpatterns = [
    path("", BookingListAPIView.as_view(), name="booking-list"),
    path("create/", BookingCreateAPIView.as_view(), name="booking-create"),
    path("<int:pk>/", BookingRetrieveAPIView.as_view(), name="booking-detail"),
    path("<int:pk>/delete/", BookingDeleteAPIView.as_view(), name="booking-delete"),
]