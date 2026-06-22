from rest_framework import serializers

from .models import Client


class ClientCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = ("id", "name", "phone", "email", "address", "status",)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError({"name": "Client name is required."})
        return value

    def validate_phone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError({"phone": "Phone number is required."})
        return value

    def validate_email(self, value):
        if not value:
            return value
        if Client.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError({"email": "Client with this email already exists."})
        return value


class ClientListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = ("id", "name", "phone", "email", "address", "status", "created_at",)


class ClientDetailSerializer(serializers.ModelSerializer):

    booking_count = serializers.IntegerField(read_only=True,)

    class Meta:
        model = Client
        fields = ("id", "name", "phone", "email", "address", "status", "booking_count",)


class ClientUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        fields = ("name", "phone", "email", "address", "status",)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError({"name": "Client name is required."})
        return value

    def validate_phone(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError({"phone": "Phone number is required."})
        return value

    def validate_email(self, value):
        if not value:
            return value
        if Client.objects.filter(
            email__iexact=value
        ).exclude(
            pk=self.instance.pk
        ).exists():
            raise serializers.ValidationError({
                "email": "Client with this email already exists."
            })

        return value