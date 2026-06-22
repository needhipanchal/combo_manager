from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import LogEntry, ALLOWED_MODULES
from .serializers import LogEntryListSerializer


# ============================================================
# LOG LIST VIEW
# GET /api/v1/logs/{module}/
#
# Exact conversion of PHP logs.php:
#   $module  = $segments[1]             → URL kwarg
#   $allowed = ['items','combo',...]    → validated in get()
#   ?action  = CREATE|UPDATE|DELETE     → filter
#   ?date    = YYYY-MM-DD               → filter
#   ?page    = 1                        → pagination
#   ?per_page = 30 (max 100)           → pagination
# ============================================================

class LogListView(generics.ListAPIView):
    """
    GET /api/v1/logs/{module}/

    Path param  : module  — one of items, combo, combo_items,
                            booking, booking_items, client, combo_barcode
    Query params:
        action   = CREATE | UPDATE | DELETE   (optional)
        date     = YYYY-MM-DD                 (optional)
        page     = 1
        per_page = 30  (max 100)
    """
    serializer_class   = LogEntryListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [OrderingFilter]
    ordering           = ['-id']

    def get_queryset(self):
        module = self.kwargs.get('module', '')

        # Validate module — mirrors PHP: if (!in_array($module, $allowed))
        if module not in ALLOWED_MODULES:
            return LogEntry.objects.none()

        queryset = LogEntry.objects.filter(module=module)

        # Filter by action — mirrors PHP: in_array($_GET['action'], [...])
        action = self.request.query_params.get('action', '').strip().upper()
        if action in ('CREATE', 'UPDATE', 'DELETE'):
            queryset = queryset.filter(action=action)

        # Filter by date — mirrors PHP: DATE(created_at) = :date
        date = self.request.query_params.get('date', '').strip()
        if date:
            queryset = queryset.filter(created_at__date=date)

        return queryset

    def list(self, request, *args, **kwargs):
        module = self.kwargs.get('module', '')

        # Return 404 for unknown module — mirrors PHP jsonError(404)
        if module not in ALLOWED_MODULES:
            return Response(
                {
                    'error': f"Unknown log module. Valid: {', '.join(ALLOWED_MODULES)}"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Manual pagination to match PHP per_page / page behaviour
        per_page = min(100, max(1, int(request.query_params.get('per_page', 30))))
        page     = max(1, int(request.query_params.get('page', 1)))

        queryset = self.get_queryset()
        total    = queryset.count()

        offset   = (page - 1) * per_page
        queryset = queryset[offset: offset + per_page]

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'total':        total,
            'per_page':     per_page,
            'current_page': page,
            'last_page':    max(1, -(-total // per_page)),
            'data':         serializer.data,
        })


# ============================================================
# LOG LIST VIEW — all modules (admin overview)
# GET /api/v1/logs/
# ============================================================

class AllLogsListView(generics.ListAPIView):
    """
    GET /api/v1/logs/

    Returns logs across all modules — for admin overview.
    Same filters: action, date, module, page, per_page.
    """
    serializer_class   = LogEntryListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = LogEntry.objects.all()

        module = self.request.query_params.get('module', '').strip()
        if module in ALLOWED_MODULES:
            queryset = queryset.filter(module=module)

        action = self.request.query_params.get('action', '').strip().upper()
        if action in ('CREATE', 'UPDATE', 'DELETE'):
            queryset = queryset.filter(action=action)

        date = self.request.query_params.get('date', '').strip()
        if date:
            queryset = queryset.filter(created_at__date=date)

        return queryset.order_by('-id')

    def list(self, request, *args, **kwargs):
        per_page = min(100, max(1, int(request.query_params.get('per_page', 30))))
        page     = max(1, int(request.query_params.get('page', 1)))

        queryset = self.get_queryset()
        total    = queryset.count()
        offset   = (page - 1) * per_page
        queryset = queryset[offset: offset + per_page]

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'total':        total,
            'per_page':     per_page,
            'current_page': page,
            'last_page':    max(1, -(-total // per_page)),
            'data':         serializer.data,
        })