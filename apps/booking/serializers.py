from django.db import transaction

from rest_framework import serializers

from apps.client.models import Client
from apps.combo.models import ComboBarcode, ComboItem

from .models import (Booking, BookingItem,)

from apps.combo.serializers import ComboItemDetailSerializer


class BookingCreateSerializer(serializers.Serializer):

    client_id = serializers.IntegerField()
    barcode_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False,)

    def validate(self, attrs):
        client_id = attrs["client_id"]
        barcode_ids = attrs["barcode_ids"]

        try:
            client = Client.objects.get(id=client_id, status="active",)
        except Client.DoesNotExist:
            raise serializers.ValidationError({"client_id": "Active client not found."})

        barcodes = list(
            ComboBarcode.objects.select_related(
                "combo"
            ).filter(
                id__in=barcode_ids,
                status=ComboBarcode.Status.ACTIVE,
            )
        )

        if len(barcodes) != len(barcode_ids):
            raise serializers.ValidationError({
                "barcode_ids": "One or more barcodes are invalid or unavailable."
            })

        attrs["client"] = client
        attrs["barcodes"] = barcodes

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        client = validated_data["client"]
        barcodes = validated_data["barcodes"]

        booking = Booking.objects.create(
            client=client
        )

        booking_items = [
            BookingItem(
                booking=booking,
                combo_barcode=barcode,
            )
            for barcode in barcodes
        ]

        BookingItem.objects.bulk_create(
            booking_items
        )

        ComboBarcode.objects.filter(
            id__in=[barcode.id for barcode in barcodes]
        ).update(
            status=ComboBarcode.Status.USED
        )

        return booking


class BookingListSerializer(serializers.ModelSerializer):

    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    scanned_pairs = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id",
            "client_id",
            "client_name",
            "client_phone",
            "client_email",
            "item_count",
            "scanned_pairs",
            "created_at",
        )

    def get_scanned_pairs(self, obj):
        return 0


class BookingItemSerializer(serializers.ModelSerializer):

    barcode = serializers.CharField(source="combo_barcode.barcode", read_only=True)
    combo_name = serializers.CharField(source="combo_barcode.combo.name", read_only=True)
    combo_status = serializers.CharField(source="combo_barcode.status",read_only=True)
    combo_items = serializers.SerializerMethodField()

    class Meta:
        model = BookingItem
        fields = (
            "id",
            "barcode",
            "combo_name",
            "combo_status",
            "combo_items",
        )

    def get_combo_items(self, obj):
        combo_items = (
            obj.combo_barcode.combo.combo_items
            .select_related("item")
            .all()
        )
        return ComboItemDetailSerializer(combo_items, many=True).data


class BookingDetailSerializer(serializers.ModelSerializer):

    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)
    client_address = serializers.CharField(source="client.address", read_only=True)
    client_status = serializers.CharField(source="client.status", read_only=True)
    booking_items = BookingItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "client_id",
            "client_name",
            "client_phone",
            "client_email",
            "client_address",
            "client_status",
            "item_count",
            "booking_items",
            "created_at",
            "updated_at",
        )



class BookingDetailSerializer(serializers.ModelSerializer):

    client_name = serializers.CharField(source="client.name", read_only=True)
    client_phone = serializers.CharField(source="client.phone", read_only=True)
    client_email = serializers.CharField(source="client.email", read_only=True)
    booking_items = BookingItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "client_id",
            "client_name",
            "client_phone",
            "client_email",
            "item_count",
            "booking_items",
            "created_at",
            "updated_at",
        )