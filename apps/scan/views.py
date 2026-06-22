from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.serializers import Serializer, CharField, IntegerField, ListField
from django.db import transaction
from django.db.models import Q

from apps.booking.models import Booking, BookingItem
from apps.client.models import Client
from apps.combo.models import ComboBarcode
from apps.booking.serializers import BookingListSerializer, BookingDetailSerializer
from apps.logs.utils import write_log


# ============================================================
# Input serializers (needed so generics.GenericAPIView has a
# serializer_class to validate request bodies with)
# ============================================================

class ScanValidateInputSerializer(Serializer):
    barcode = CharField(required=True, allow_blank=False)


class ScanSubmitInputSerializer(Serializer):
    client_id      = IntegerField(required=True)
    combo_barcodes = ListField(child=CharField(), required=True, allow_empty=False)
    items_barcodes = ListField(child=CharField(), required=False, default=list)


# ============================================================
# VALIDATE — POST /api/scan/validate/
# Generic view: GenericAPIView + manual create-style post()
# ============================================================

class ScanValidateView(generics.GenericAPIView):
    """
    POST /api/scan/validate/
    Body: { "barcode": "XXXX" }
    """
    serializer_class   = ScanValidateInputSerializer
    permission_classes = []   # keep open, matches your original APIView (no auth required)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        barcode = serializer.validated_data['barcode'].strip()

        cb = ComboBarcode.objects.select_related('combo').filter(barcode=barcode).first()

        if cb:
            if cb.status == ComboBarcode.Status.USED:
                return Response(
                    {'success': False, 'message': f"Barcode '{barcode}' is already used", 'data': None},
                    status=status.HTTP_409_CONFLICT
                )
            if cb.status == ComboBarcode.Status.DELETED:
                return Response(
                    {'success': False, 'message': f"Barcode '{barcode}' has been deleted", 'data': None},
                    status=status.HTTP_409_CONFLICT
                )
            return Response({
                'success': True,
                'message': 'Valid combo barcode',
                'data': {
                    'type':       'combo',
                    'barcode':    barcode,
                    'combo_id':   cb.combo_id,
                    'combo_name': cb.combo.name,
                    'cb_id':      cb.id,
                }
            })

        return Response({
            'success': True,
            'message': 'External barcode accepted',
            'data': {'type': 'external', 'barcode': barcode}
        })


# ============================================================
# SUBMIT — POST /api/scan/submit/
# Generic view: GenericAPIView + manual create-style post()
#
# NOTE: Stock is NOT deducted here. Stock is already deducted at
# barcode GENERATION time (see apps/combo/services.py:
# create_bulk_barcodes -> deduct_stock_for_combo). Booking only
# marks the barcode as USED — it must not deduct stock again,
# or stock would drop twice for the same combo.
# ============================================================

class ScanSubmitView(generics.GenericAPIView):
    """
    POST /api/scan/submit/
    Body: { "client_id": 1, "combo_barcodes": [...], "items_barcodes": [...] }
    """
    serializer_class   = ScanSubmitInputSerializer
    permission_classes = []   # keep open, matches your original APIView

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        client_id      = data['client_id']
        combo_barcodes = [b.strip() for b in data['combo_barcodes']]
        items_barcodes = [b.strip() for b in data.get('items_barcodes', [])]

        client = Client.objects.filter(pk=client_id).first()
        if not client:
            return Response(
                {'success': False, 'message': 'Client not found', 'data': None},
                status=status.HTTP_404_NOT_FOUND
            )
        if client.status != 'active':
            return Response(
                {'success': False, 'message': 'Client is inactive', 'data': None},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        # Validate all combo barcodes up front
        cb_rows = []
        for bc in combo_barcodes:
            cb = ComboBarcode.objects.select_related('combo').filter(barcode=bc).first()
            if not cb:
                return Response(
                    {'success': False, 'message': f"Combo barcode '{bc}' not found", 'data': None},
                    status=status.HTTP_404_NOT_FOUND
                )
            if cb.status != ComboBarcode.Status.ACTIVE:
                return Response(
                    {'success': False, 'message': f"Combo barcode '{bc}' is already used or deleted", 'data': None},
                    status=status.HTTP_409_CONFLICT
                )
            cb_rows.append(cb)

        total_qty = len(combo_barcodes)

        with transaction.atomic():
            booking = Booking.objects.create(client=client)

            for cb in cb_rows:
                bi = BookingItem.objects.create(booking=booking, combo_barcode=cb)
                write_log('booking_items', 'CREATE', bi.id, None, {
                    'booking_id':    booking.id,
                    'combo_barcode': cb.barcode,
                })

            # Only marks barcodes used — stock was already deducted
            # when these barcodes were generated, not now.
            ComboBarcode.objects.filter(
                barcode__in=combo_barcodes
            ).update(status=ComboBarcode.Status.USED)

            write_log('booking', 'CREATE', booking.id, None, {
                'id':              booking.id,
                'client_id':       client_id,
                'client_name':     client.name,
                'quantity':        total_qty,
                'combo_barcodes':  combo_barcodes,
                'items_barcodes':  items_barcodes,
            })

        return Response({
            'success': True,
            'message': 'Booking created from scan',
            'data': {
                'booking_id':      booking.id,
                'client_name':     client.name,
                'quantity':        total_qty,
                'combo_barcodes':  combo_barcodes,
                'items_barcodes':  items_barcodes,
                'created_at':      str(booking.created_at),
            }
        }, status=status.HTTP_201_CREATED)


# ============================================================
# LIST — GET /api/scan/
# Already a generic view — kept as ListAPIView
# ============================================================

class ScanListView(generics.ListAPIView):
    """GET /api/scan/ — Booking list for scan module."""
    serializer_class = BookingListSerializer

    def get_queryset(self):
        qs = Booking.objects.select_related('client').all()
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(client__name__icontains=search) |
                Q(client__phone__icontains=search)
            )
        return qs.order_by('-id')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return Response({'success': True, 'message': 'OK', 'data': response.data})


# ============================================================
# DETAIL — GET /api/scan/{id}/
# Already a generic view — kept as RetrieveAPIView
# ============================================================

class ScanDetailView(generics.RetrieveAPIView):
    """GET /api/scan/{id}/ — Single booking for scan view."""
    queryset         = Booking.objects.select_related('client').prefetch_related('booking_items').all()
    serializer_class = BookingDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({'success': True, 'message': 'OK', 'data': BookingDetailSerializer(instance).data})