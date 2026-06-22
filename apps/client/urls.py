from django.urls import path
from .views import (
    ClientCreateAPIView,
    ClientListAPIView,
    ClientRetrieveAPIView,
    ClientUpdateAPIView,
    ClientDeleteAPIView,
)

urlpatterns = [
    path("", ClientListAPIView.as_view(), name="client-list"),
    path("create/", ClientCreateAPIView.as_view(), name="client-create"),
    path("<int:pk>/", ClientRetrieveAPIView.as_view(), name="client-detail"),
    path("<int:pk>/update/", ClientUpdateAPIView.as_view(), name="client-update"),
    path("<int:pk>/delete/", ClientDeleteAPIView.as_view(), name="client-delete"),
]