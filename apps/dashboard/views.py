from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
import decimal, datetime


def fetchall_dict(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def serialize_row(row):
    result = {}
    for k, v in row.items():
        if isinstance(v, decimal.Decimal):
            result[k] = float(v)
        elif isinstance(v, (datetime.datetime, datetime.date)):
            result[k] = str(v)
        else:
            result[k] = v
    return result


class DashboardView(generics.GenericAPIView):
    """GET /api/dashboard/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        with connection.cursor() as cursor:

            # ── total_items ──────────────────────────────────
            cursor.execute("SELECT COUNT(*) FROM items")
            total_items = cursor.fetchone()[0]

            # ── total_combos ─────────────────────────────────
            # combos columns: id, name, created_at, updated_at
            cursor.execute("SELECT COUNT(*) FROM combos")
            total_combos = cursor.fetchone()[0]

            # ── total_bookings ───────────────────────────────
            # bookings columns: id, created_at, updated_at, client_id
            cursor.execute("SELECT COUNT(*) FROM bookings")
            total_bookings = cursor.fetchone()[0]

            # ── low_stock (quantity <= 10) ───────────────────
            cursor.execute("SELECT COUNT(*) FROM items WHERE quantity <= 10")
            low_stock = cursor.fetchone()[0]

            # ── stock_value — items.rate column ──────────────
            cursor.execute(
                "SELECT COALESCE(SUM(quantity * rate), 0) FROM items"
            )
            stock_value = float(cursor.fetchone()[0])

            # ── available_barcodes ────────────────────────────
            # combo_barcodes.status is VARCHAR — cast to text
            cursor.execute(
                "SELECT COUNT(*) FROM combo_barcodes WHERE status::text = '0'"
            )
            available_barcodes = cursor.fetchone()[0]

            # ── recent_bookings (last 5) ─────────────────────
            # bookings has NO quantity — count booking_items per booking instead
            # clients columns: id, name, phone, email, address, status
            cursor.execute("""
                SELECT
                    b.id,
                    cl.name  AS client_name,
                    cl.phone AS client_phone,
                    COUNT(bi.id) AS item_count,
                    b.created_at
                FROM bookings b
                JOIN clients cl      ON cl.id = b.client_id
                LEFT JOIN booking_items bi ON bi.booking_id = b.id
                GROUP BY b.id, cl.name, cl.phone
                ORDER BY b.id DESC
                LIMIT 5
            """)
            recent_bookings = [serialize_row(r) for r in fetchall_dict(cursor)]

            # ── low_stock_items ──────────────────────────────
            cursor.execute("""
                SELECT id, name, quantity, rate
                FROM items
                WHERE quantity <= 10
                ORDER BY quantity ASC
                LIMIT 10
            """)
            low_stock_items = [serialize_row(r) for r in fetchall_dict(cursor)]

            # ── top_items by combo usage (top 5) ─────────────
            # combo_items columns: id, quantity, combo_id, item_id
            cursor.execute("""
                SELECT i.id, i.name, SUM(ci.quantity) AS combo_usage
                FROM combo_items ci
                JOIN items i ON ci.item_id = i.id
                GROUP BY i.id, i.name
                ORDER BY combo_usage DESC
                LIMIT 5
            """)
            top_items = [serialize_row(r) for r in fetchall_dict(cursor)]

            # ── combo_stock ───────────────────────────────────
            # combos has NO quantity — count available barcodes only
            cursor.execute("""
                SELECT
                    c.id,
                    c.name,
                    COUNT(cb.id) AS barcode_count,
                    SUM(CASE WHEN cb.status::text = '0' THEN 1 ELSE 0 END) AS available_barcodes,
                    SUM(CASE WHEN cb.status::text = '1' THEN 1 ELSE 0 END) AS used_barcodes
                FROM combos c
                LEFT JOIN combo_barcodes cb ON cb.combo_id = c.id
                GROUP BY c.id, c.name
                ORDER BY c.name ASC
                LIMIT 10
            """)
            combo_stock = [serialize_row(r) for r in fetchall_dict(cursor)]

            # ── booking_activity last 7 days ─────────────────
            cursor.execute("""
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM bookings
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            """)
            booking_activity = [serialize_row(r) for r in fetchall_dict(cursor)]

        return Response({
            'total_items':        int(total_items),
            'total_combos':       int(total_combos),
            'total_bookings':     int(total_bookings),
            'low_stock':          int(low_stock),
            'stock_value':        stock_value,
            'available_barcodes': int(available_barcodes),
            'recent_bookings':    recent_bookings,
            'low_stock_items':    low_stock_items,
            'top_items':          top_items,
            'combo_stock':        combo_stock,
            'booking_activity':   booking_activity,
        }, status=status.HTTP_200_OK)