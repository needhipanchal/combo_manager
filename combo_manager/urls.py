"""
combo_manager URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.users.views import SignupAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
     # AUTH
    path("api/signup/", SignupAPIView.as_view()),
    path("api/auth/", include("apps.auth.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/users/", include("apps.users.urls")),
    path('api/items/', include('apps.items.urls')),
    path('api/combo/', include('apps.combo.urls')),
    path('api/client/', include('apps.client.urls')),
    path('api/booking/', include('apps.booking.urls')),
    path('api/scan/', include('apps.scan.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/logs/', include('apps.logs.urls')),
    path('api/combo_barcode/', include('apps.combo.barcode_urls')),
    path('api/barcodes/', include('apps.combo.barcode_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
