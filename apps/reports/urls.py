from django.urls import path
from .views import (
    ReportView,
    ItemsReportListView,
    ComboReportListView,
    BookingReportListView,
)

urlpatterns = [
    # Single router — ?type=items|combo|booking  (mirrors PHP switch)
    path('', ReportView.as_view(), name='report-router'),

    # Separate explicit URLs for each report type
    path('items/',   ItemsReportListView.as_view(),   name='report-items'),
    path('combo/',   ComboReportListView.as_view(),   name='report-combo'),
    path('booking/', BookingReportListView.as_view(), name='report-booking'),
]