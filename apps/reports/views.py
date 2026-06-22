from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
import decimal, datetime


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


def raw_paginate(count_sql, data_sql, params, page, per_page):
    with connection.cursor() as cursor:
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]

        offset = (page - 1) * per_page
        cursor.execute(data_sql + f" LIMIT {per_page} OFFSET {offset}", params)
        columns = [col[0] for col in cursor.description]
        rows = [
            serialize_row(dict(zip(columns, row)))
            for row in cursor.fetchall()
        ]

    last_page = max(1, -(-total // per_page))
    return {
        'total':        total,
        'per_page':     per_page,
        'current_page': page,
        'last_page':    last_page,
        'data':         rows,
    }


# ============================================================
# ITEMS REPORT
# items: id, name, description, hsn_sac_code, quantity, rate,
#        created_at, updated_at
# ============================================================
class ItemsReportListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        search   = request.query_params.get('search', '').strip()
        from_    = request.query_params.get('from', '').strip()
        to_      = request.query_params.get('to', '').strip()
        page     = max(1, int(request.query_params.get('page', 1)))
        per_page = min(500, max(1, int(request.query_params.get('per_page', 20))))

        where, params = [], []

        if search:
            where.append("(name LIKE %s OR description LIKE %s OR hsn_sac_code LIKE %s)")
            like = f"%{search}%"
            params += [like, like, like]
        if from_:
            where.append("DATE(created_at) >= %s")
            params.append(from_)
        if to_:
            where.append("DATE(created_at) <= %s")
            params.append(to_)

        where_sql = ("WHERE " + " AND ".join(where)) if where else ""

        count_sql = f"SELECT COUNT(*) FROM items {where_sql}"
        data_sql  = f"""
            SELECT id, name, description, hsn_sac_code,
                   quantity, rate, created_at, updated_at
            FROM items
            {where_sql}
            ORDER BY id DESC
        """
        return Response(raw_paginate(count_sql, data_sql, params, page, per_page))


# ============================================================
# COMBO REPORT
# combos:        id, name, created_at, updated_at
# combo_barcodes: id, barcode, status, combo_id
# combo_items:   id, quantity, combo_id, item_id
# items:         id, name, rate
# ============================================================
class ComboReportListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        search   = request.query_params.get('search', '').strip()
        from_    = request.query_params.get('from', '').strip()
        to_      = request.query_params.get('to', '').strip()
        page     = max(1, int(request.query_params.get('page', 1)))
        per_page = min(500, max(1, int(request.query_params.get('per_page', 20))))

        where, params = [], []

        if search:
            where.append("c.name LIKE %s")
            params.append(f"%{search}%")
        if from_:
            where.append("DATE(c.created_at) >= %s")
            params.append(from_)
        if to_:
            where.append("DATE(c.created_at) <= %s")
            params.append(to_)

        where_sql = ("WHERE " + " AND ".join(where)) if where else ""

        count_sql = f"SELECT COUNT(DISTINCT c.id) FROM combos c {where_sql}"

        data_sql = f"""
            SELECT
                c.id,
                c.name,
                c.created_at,

                COUNT(DISTINCT cb.id) AS total_barcodes,

                SUM(CASE WHEN cb.status::text = '1' THEN 1 ELSE 0 END) AS used_barcodes,
                SUM(CASE WHEN cb.status::text = '0' THEN 1 ELSE 0 END) AS available_barcodes,

                (
                    SELECT COUNT(*)
                    FROM combo_items ci
                    WHERE ci.combo_id = c.id
                ) AS total_items,

                (
                    SELECT COALESCE(SUM(ci.quantity * i.rate), 0)
                    FROM combo_items ci
                    JOIN items i ON i.id = ci.item_id
                    WHERE ci.combo_id = c.id
                ) AS total_value

            FROM combos c
            LEFT JOIN combo_barcodes cb ON cb.combo_id = c.id
            {where_sql}
            GROUP BY c.id, c.name, c.created_at
            ORDER BY c.id DESC
        """

        return Response(raw_paginate(count_sql, data_sql, params, page, per_page))


# ============================================================
# BOOKING REPORT
# bookings:      id, created_at, updated_at, client_id
# booking_items: id, created_at, updated_at, booking_id, combo_barcode_id
# clients:       id, name, phone, email, address, status
# combo_barcodes: id, barcode, status, combo_id
# combos:        id, name
# combo_items:   id, quantity, combo_id, item_id
# items:         id, name, rate
# ============================================================
class BookingReportListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        search   = request.query_params.get('search', '').strip()
        from_    = request.query_params.get('from', '').strip()
        to_      = request.query_params.get('to', '').strip()
        page     = max(1, int(request.query_params.get('page', 1)))
        per_page = min(500, max(1, int(request.query_params.get('per_page', 20))))

        where, params = [], []

        if search:
            # booking_items joins to combo_barcodes via combo_barcode_id (FK)
            # search on client name/phone and combo name/barcode string
            where.append("""(
                cl.name        LIKE %s
                OR cl.phone    LIKE %s
                OR cb.barcode  LIKE %s
                OR c.name      LIKE %s
            )""")
            like = f"%{search}%"
            params += [like, like, like, like]
        if from_:
            where.append("DATE(b.created_at) >= %s")
            params.append(from_)
        if to_:
            where.append("DATE(b.created_at) <= %s")
            params.append(to_)

        where_sql = ("WHERE " + " AND ".join(where)) if where else ""

        # booking_items.combo_barcode_id is FK to combo_barcodes.id
        count_sql = f"""
            SELECT COUNT(*)
            FROM booking_items bi
            LEFT JOIN bookings b        ON b.id  = bi.booking_id
            LEFT JOIN clients cl        ON cl.id = b.client_id
            LEFT JOIN combo_barcodes cb ON cb.id = bi.combo_barcode_id
            LEFT JOIN combos c          ON c.id  = cb.combo_id
            {where_sql}
        """

        data_sql = f"""
            SELECT
                b.id           AS booking_id,
                b.created_at,

                cl.name        AS client_name,
                cl.phone       AS client_phone,
                cl.email       AS client_email,

                c.name         AS combo_name,
                cb.barcode     AS combo_barcode,

                (
                    SELECT SUM(ci.quantity)
                    FROM combo_items ci
                    WHERE ci.combo_id = c.id
                ) AS total_qty,

                (
                    SELECT COALESCE(SUM(ci.quantity * i.rate), 0)
                    FROM combo_items ci
                    JOIN items i ON i.id = ci.item_id
                    WHERE ci.combo_id = c.id
                ) AS total_value

            FROM booking_items bi
            LEFT JOIN bookings b        ON b.id  = bi.booking_id
            LEFT JOIN clients cl        ON cl.id = b.client_id
            LEFT JOIN combo_barcodes cb ON cb.id = bi.combo_barcode_id
            LEFT JOIN combos c          ON c.id  = cb.combo_id
            {where_sql}
            ORDER BY b.id DESC
        """

        return Response(raw_paginate(count_sql, data_sql, params, page, per_page))


# ============================================================
# ROUTER — ?type=items|combo|booking
# ============================================================
class ReportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    _type_map = {
        'items':   ItemsReportListView,
        'combo':   ComboReportListView,
        'booking': BookingReportListView,
    }

    def get(self, request, *args, **kwargs):
        type_ = request.query_params.get('type', 'booking').strip()
        view_class = self._type_map.get(type_)

        if not view_class:
            return Response(
                {'error': 'Invalid type. Valid: items, combo, booking'},
                status=status.HTTP_400_BAD_REQUEST
            )

        view = view_class()
        view.request      = request
        view.kwargs       = kwargs
        view.format_kwarg = self.format_kwarg
        return view.get(request, *args, **kwargs)