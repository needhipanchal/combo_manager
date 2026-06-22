from django.urls import path
from .views import DashboardView

urlpatterns = [
    # GET /api/v1/dashboard/
    path('', DashboardView.as_view(), name='dashboard'),
]