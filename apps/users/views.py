# apps/users/views.py
from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import SignupSerializer


class SignupAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer