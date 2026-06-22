from django.urls import path
from .views import ScanValidateView, ScanSubmitView, ScanListView, ScanDetailView

urlpatterns = [
    path('', ScanListView.as_view(), name='scan-list'),
    path('validate/', ScanValidateView.as_view(), name='scan-validate'),
    path('submit/', ScanSubmitView.as_view(), name='scan-submit'),
    path('<int:pk>/', ScanDetailView.as_view(), name='scan-detail'),
]