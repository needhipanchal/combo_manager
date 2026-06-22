from django.db.models import Count
from django.db.models import ProtectedError

from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import ClientFilter
from rest_framework import filters
from .models import Client
from .serializers import (
    ClientCreateSerializer,
    ClientListSerializer,
    ClientUpdateSerializer,
    ClientDetailSerializer,
)


class ClientCreateAPIView(generics.CreateAPIView):

    serializer_class = ClientCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Client.objects.none()


class ClientListAPIView(generics.ListAPIView):

    serializer_class = ClientListSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ClientFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name", "phone", "email"]

    def get_queryset(self):
        return (
            Client.objects
            .annotate(
                booking_count=Count("bookings", distinct=True)
            )
            .order_by("-id")
        )


class ClientRetrieveAPIView(generics.RetrieveAPIView):

    serializer_class = ClientDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return (
            Client.objects
            .annotate(
                booking_count=Count(
                    "bookings",
                    distinct=True,
                )
            )
        )


class ClientUpdateAPIView(generics.UpdateAPIView):

    serializer_class = ClientUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Client.objects.all()


class ClientDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Client.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        booking_count = instance.bookings.count()

        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "message": (
                        f"Cannot delete '{instance.name}' — this client has "
                        f"{booking_count} existing booking(s). "
                        "Remove or reassign their bookings first, or deactivate "
                        "the client instead of deleting."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"success": True, "message": "Client deleted successfully."},
            status=status.HTTP_200_OK,
        )