from rest_framework import serializers
from .models import Project, ProjectMedia, ProjectSkillRef
from skills.models import Skill, SkillReference
from rest_framework.exceptions import ValidationError
from django.db import transaction
import cloudinary.uploader


class ProjectMediaSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProjectMedia
        fields = ("id", "image", "order")

    def get_image(self, obj):
        if obj.image:
            return obj.image.url   # URL Cloudinary complète
        return None



class ProjectSerializer(serializers.ModelSerializer):
    media = ProjectMediaSerializer(many=True, read_only=True)
    # accept uploaded images on create/update as a list of files
    media_files = serializers.ListField(child=serializers.ImageField(), write_only=True, required=False)
    skills = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    skills_list = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "title",
            "description",
            "github_url",
            "live_url",
            "created_by",
            "created_at",
            "updated_at",
            "media",
            "media_files",
            "skills",
            "skills_list",
        )
        read_only_fields = ("created_by", "created_at", "updated_at")

    def get_skills_list(self, obj):
        return [sr.name for sr in obj.skills.all()]

    def _get_or_create_reference(self, name):
        key = name.strip()
        # try case-insensitive match first
        ref = SkillReference.objects.filter(name__iexact=key).first()
        if ref:
            return ref
        ref = SkillReference.objects.create(name=key)
        return ref

    def validate_media_files(self, value):
        # ensure no more than 3 files provided in a single call
        try:
            length = len(value)
        except Exception:
            # not a sequence
            return value
        if length > 3:
            raise ValidationError("You can upload at most 3 images per project.")
        return value

    def create(self, validated_data):
        skills = validated_data.pop("skills", [])
        media_files = validated_data.pop("media_files", None)
        user = self.context["request"].user if self.context.get("request") else None

        # If the client used multipart/form-data with repeated 'media_files' fields,
        # they will be in request.FILES. Prefer that when media_files not provided
        # in validated_data (DRF multipart handling may not populate ListField).
        if media_files is None:
            req = self.context.get('request')
            if req is not None:
                # support common variants: media_files, media_files[] or single file
                if hasattr(req.FILES, 'getlist'):
                    media_files = req.FILES.getlist('media_files') or req.FILES.getlist('media_files[]')
                else:
                    media_files = req.FILES.get('media_files') or req.FILES.get('media_files[]')
                # if single file returned, wrap into list
                if media_files and not isinstance(media_files, (list, tuple)):
                    media_files = [media_files]
            else:
                media_files = []

        # If skills were not present in validated_data (common for multipart/form-data),
        # attempt to read repeated form fields from request.data (skills or skills[])
        if not skills:
            req = self.context.get('request')
            if req is not None:
                try:
                    # QueryDict supports getlist
                    sd = req.data.getlist('skills') or req.data.getlist('skills[]')
                except Exception:
                    sd = None
                if not sd:
                    # fallback: single value possibly JSON or comma-separated
                    raw = req.data.get('skills') or req.data.get('skills[]')
                    if isinstance(raw, str):
                        import json
                        try:
                            parsed = json.loads(raw)
                            if isinstance(parsed, list):
                                sd = parsed
                        except Exception:
                            # comma separated
                            sd = [s.strip() for s in raw.split(',') if s.strip()]
                if sd:
                    skills = sd

        try:
            if len(media_files) > 3:
                raise ValidationError("You can upload at most 3 images per project.")
        except TypeError:
            # not a sequence, ignore
            pass

        with transaction.atomic():
            project = Project.objects.create(created_by=user, **validated_data)
            # attach skills: create SkillReference if missing
            for name in skills:
                ref = self._get_or_create_reference(name)
                ProjectSkillRef.objects.get_or_create(project=project, skill_reference=ref)

            # create media entries in order
            for idx, f in enumerate(media_files):
                ProjectMedia.objects.create(project=project, image=f, order=idx)

        return project

    def update(self, instance, validated_data):
        skills = validated_data.pop("skills", None)
        media_files = validated_data.pop("media_files", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills is None:
            # try to read from request.data for multipart/form-data variants
            req = self.context.get('request')
            if req is not None:
                try:
                    sd = req.data.getlist('skills') or req.data.getlist('skills[]')
                except Exception:
                    sd = None
                if not sd:
                    raw = req.data.get('skills') or req.data.get('skills[]')
                    if isinstance(raw, str):
                        import json
                        try:
                            parsed = json.loads(raw)
                            if isinstance(parsed, list):
                                sd = parsed
                        except Exception:
                            sd = [s.strip() for s in raw.split(',') if s.strip()]
                if sd:
                    skills = sd

        if skills is not None:
            # replace skill references for the project
            instance.skills.clear()
            for name in skills:
                ref = self._get_or_create_reference(name)
                ProjectSkillRef.objects.get_or_create(project=instance, skill_reference=ref)
        # If media_files not provided in validated_data, check request.FILES for multipart uploads
        if media_files is None:
            req = self.context.get('request')
            if req is not None:
                if hasattr(req.FILES, 'getlist'):
                    media_files = req.FILES.getlist('media_files') or req.FILES.getlist('media_files[]')
                else:
                    media_files = req.FILES.get('media_files') or req.FILES.get('media_files[]')
                if media_files and not isinstance(media_files, (list, tuple)):
                    media_files = [media_files]
            else:
                media_files = None

        # If we have media files (either via validated_data or request.FILES), replace existing
        if media_files:
            try:
                if len(media_files) > 3:
                    raise ValidationError("You can upload at most 3 images per project.")
            except TypeError:
                pass

            instance.media.all().delete()
            for idx, f in enumerate(media_files):
                ProjectMedia.objects.create(project=instance, image=f, order=idx)

        return instance
