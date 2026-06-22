from django.urls import path
from .views import LogListView, AllLogsListView

urlpatterns = [
    # All modules overview
    # GET /api/v1/logs/?module=items&action=CREATE&date=2024-01-01
    path('', AllLogsListView.as_view(), name='log-list-all'),

    # Per-module — mirrors PHP: /api/logs/{module}
    # GET /api/v1/logs/items/
    # GET /api/v1/logs/combo/
    # GET /api/v1/logs/combo_items/
    # GET /api/v1/logs/booking/
    # GET /api/v1/logs/booking_items/
    # GET /api/v1/logs/client/
    # GET /api/v1/logs/combo_barcode/
    path('<str:module>/', LogListView.as_view(), name='log-list-module'),
]