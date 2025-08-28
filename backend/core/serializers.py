from rest_framework import serializers
from .models import HeroSection, About, ContactMessage


class HeroSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSection
        fields = ['id', 'headline', 'subheadline', 'image', 'instagram', 'linkedin', 'github', 'order', 'is_active']


class AboutSerializer(serializers.ModelSerializer):
    class Meta:
        model = About
        fields = ['id', 'title', 'description', 'cv', 'updated_at']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at', 'is_read']
        read_only_fields = ['created_at', 'is_read']