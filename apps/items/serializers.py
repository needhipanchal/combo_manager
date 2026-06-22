from rest_framework import serializers

from .models import Item


class ItemsCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ("name", "description", "hsn_sac_code", "quantity", "rate",)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError({"name": "Item name is required."})
        if Item.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError({"name": "Item with this name already exists."})
        return value

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError({"quantity": "Quantity cannot be negative."})
        return value

    def validate_rate(self, value):
        if value < 0: raise serializers.ValidationError({"rate": "Rate cannot be negative."})
        return value


class ItemsUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ("name", "description", "hsn_sac_code", "quantity", "rate",)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError({"name": "Item name is required."})

        if (
            Item.objects
            .exclude(pk=self.instance.pk)
            .filter(name__iexact=value)
            .exists()
        ):
            raise serializers.ValidationError({"name": "Item with this name already exists."})
        return value


    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError({"quantity": "Quantity cannot be negative."})
        return value

    def validate_rate(self, value):
        if value < 0:
            raise serializers.ValidationError({"rate": "Rate cannot be negative."})
        return value


class ItemsListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ("id", "name", "hsn_sac_code", "quantity", "description", "rate","created_at")
    

class ItemsDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = Item
        fields = ("id", "name", "description", "hsn_sac_code", "quantity", "rate", "created_at", "updated_at",)