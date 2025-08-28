from rest_framework import generics, permissions
from .models import HeroSection, About, ContactMessage
from .serializers import HeroSectionSerializer, AboutSerializer, ContactMessageSerializer
from .permissions import IsSuperUser


class HeroListView(generics.ListAPIView):
    queryset = HeroSection.objects.filter(is_active=True)
    serializer_class = HeroSectionSerializer
    permission_classes = [permissions.AllowAny]


class HeroAdminListCreateView(generics.ListCreateAPIView):
    queryset = HeroSection.objects.all()
    serializer_class = HeroSectionSerializer
    permission_classes = [IsSuperUser]

    def perform_create(self, serializer):
        if HeroSection.objects.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Only one HeroSection instance is allowed.')
        serializer.save()


class HeroAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HeroSection.objects.all()
    serializer_class = HeroSectionSerializer
    permission_classes = [IsSuperUser]


class AboutDetailView(generics.RetrieveUpdateAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    permission_classes = [IsSuperUser]


class AboutCreateView(generics.CreateAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    permission_classes = [IsSuperUser]

    def perform_create(self, serializer):
        if About.objects.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Only one About instance is allowed.')
        serializer.save()


class PublicAboutView(generics.RetrieveAPIView):
    queryset = About.objects.all()
    serializer_class = AboutSerializer
    permission_classes = [permissions.AllowAny]


class ContactCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    # Only superusers may create contact messages via API. All modifying operations
    # in the `core` app are restricted to superusers (Django `is_superuser`).
    permission_classes = [IsSuperUser]


class ContactListAdminView(generics.ListAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperUser]


class ContactDetailAdminView(generics.RetrieveDestroyAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperUser]
from django.shortcuts import render

# Create your views here.
