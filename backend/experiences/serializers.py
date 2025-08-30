from rest_framework import serializers
from .models import Experience, ExperienceSkillRef

class ExperienceSkillRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienceSkillRef
        fields = ("id", "experience", "skill_reference")
        read_only_fields = ("id",)

class ExperienceSerializer(serializers.ModelSerializer):
    skills = ExperienceSkillRefSerializer(source="experienceskillref_set", many=True, read_only=True)
    skills_data = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Experience
        fields = "__all__"
        read_only_fields = ("id",)

    def create(self, validated_data):
        skills_data = validated_data.pop("skills_data", [])
        experience = Experience.objects.create(**validated_data)
        for skill_id in skills_data:
            ExperienceSkillRef.objects.create(experience=experience, skill_reference_id=skill_id)
        return experience
