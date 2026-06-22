from django.db import transaction
from rest_framework import serializers
from apps.items.models import Item
from .models import Combo, ComboItem, ComboBarcode


class ComboItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComboItem
        fields = ("item", "quantity",)


class ComboCreateSerializer(serializers.ModelSerializer):
    items = ComboItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Combo
        fields = ("id", "name", "items")

    def validate(self, attrs):
        name = attrs.get("name", "").strip()
        items = attrs.get("items", [])

        if not name:
            raise serializers.ValidationError({"name": "Combo name is required."})

        if Combo.objects.filter(name__iexact=name).exists():
            raise serializers.ValidationError({"name": "Combo already exists."})

        if not items:
            raise serializers.ValidationError({"items": "At least one item is required."})

        # ✅ FIX HERE
        item_ids = [item["item"].id if hasattr(item["item"], "id") else item["item"] for item in items]

        if len(item_ids) != len(set(item_ids)):
            raise serializers.ValidationError({"items": "Duplicate items are not allowed."})

        existing_ids = set(Item.objects.filter(id__in=item_ids).values_list("id", flat=True))

        missing_ids = set(item_ids) - existing_ids

        if missing_ids:
            raise serializers.ValidationError({"items": f"Invalid item ids: {sorted(missing_ids)}"})

        attrs["name"] = name
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        combo = Combo.objects.create(**validated_data)

        ComboItem.objects.bulk_create([
            ComboItem(
                combo=combo,
                item_id=item["item"].id if hasattr(item["item"], "id") else item["item"],
                quantity=item["quantity"],
            )
            for item in items_data
        ])

        return combo



class ComboListSerializer(serializers.ModelSerializer):

    items = serializers.SerializerMethodField()
    barcodes = serializers.SerializerMethodField()

    class Meta:
        model = Combo
        fields = (
            "id",
            "name",
            "items",
            "barcodes",
            "created_at",
        )

    def get_items(self, obj):
        return [
            {
                "id": ci.id,
                "item_id": ci.item_id,
                "item_name": ci.item.name,
                "quantity": ci.quantity,
            }
            for ci in obj.combo_items.all()
        ]

    def get_barcodes(self, obj):
        return [
            {
                "id": b.id,
                "barcode": b.barcode,
                "status": b.status,
            }
            for b in obj.barcodes.all()
        ]

class ComboUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Combo
        fields = ("name",)

    def validate_name(self, value):
        value = value.strip()

        qs = Combo.objects.filter(name__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Combo already exists."
            )
        return value



class ComboItemDetailSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    item_stock = serializers.IntegerField(
        source="item.quantity",
        read_only=True
    )

    hsn_sac = serializers.CharField(
        source="item.hsn_sac_code",
        read_only=True
    )

    rate = serializers.DecimalField(
        source="item.rate",
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    description = serializers.CharField(
        source="item.description",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = ComboItem
        fields = (
            "id",
            "item_name",
            "description",
            "hsn_sac",
            "quantity",
            "rate",
            "item_stock",
        )


class ComboDetailSerializer(serializers.ModelSerializer):

    items = ComboItemDetailSerializer(
        source="combo_items",
        many=True,
        read_only=True,
    )

    total_items = serializers.ReadOnlyField()
    available_barcodes = serializers.ReadOnlyField()

    class Meta:
        model = Combo
        fields = ("id", "name", "items", "total_items", "available_barcodes", "created_at","updated_at",)



class ComboBarcodeCreateSerializer(serializers.Serializer):

    quantity = serializers.IntegerField(
        min_value=1,
        max_value=1000,
    )


class PublicComboBarcodeDetailSerializer(serializers.ModelSerializer):

    combo_id = serializers.IntegerField(source="combo.id", read_only=True)
    combo_name = serializers.CharField(source="combo.name", read_only=True)
    items = serializers.SerializerMethodField()
    booked_by_client_name = serializers.SerializerMethodField()
    booked_by_client_phone = serializers.SerializerMethodField()
    booked_at = serializers.SerializerMethodField()

    class Meta:
        model = ComboBarcode
        fields = (
            "barcode",
            "status",
            "combo_id",
            "combo_name",
            "items",
            "booked_by_client_name",
            "booked_by_client_phone",
            "booked_at",
        )

    def get_items(self, obj):
        combo_items = obj.combo.combo_items.select_related("item").all()
        return [
            {
                "item_name": ci.item.name,
                "description": ci.item.description,
                "hsn_sac": ci.item.hsn_sac_code,
                "quantity": ci.quantity,
                "rate": str(ci.item.rate),
                "stock": ci.item.quantity,
            }
            for ci in combo_items
        ]

    def get_booked_by_client_name(self, obj):
        booking_item = obj.booking_items.select_related(
            "booking__client"
        ).first()

        if booking_item:
            return booking_item.booking.client.name

        return None


    def get_booked_by_client_phone(self, obj):
        booking_item = obj.booking_items.select_related(
            "booking__client"
        ).first()

        if booking_item:
            return booking_item.booking.client.phone

        return None


    def get_booked_at(self, obj):
        booking_item = obj.booking_items.select_related(
            "booking"
        ).first()

        if booking_item:
            return booking_item.booking.created_at

        return None