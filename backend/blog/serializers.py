import json
from django.db import transaction
from rest_framework import serializers
from .models import Post, Image, Link


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ('id', 'image', 'caption')


class LinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ('id', 'url', 'text')


class PostSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)
    links = LinkSerializer(many=True, read_only=True)

    # Accept uploaded files
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    # Accept JSON strings for metadata
    images_meta = serializers.CharField(write_only=True, required=False)
    links_data = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Post
        fields = (
            'id', 'title', 'slug', 'content', 'created_at',
            'images', 'links', 'uploaded_images', 'images_meta', 'links_data'
        )
        read_only_fields = ('slug', 'created_at')

    def _create_or_update_nested(self, post, images_meta_str, links_data_str, uploaded_images):
        # Delete existing relations if updating
        if self.instance:
            post.images.all().delete()
            post.links.all().delete()

        # Handle images
        if uploaded_images:
            images_meta = []
            if images_meta_str:
                try:
                    images_meta = json.loads(images_meta_str)
                except json.JSONDecodeError:
                    raise serializers.ValidationError("Invalid JSON format for images_meta.")

            # If images_meta has fewer entries, fill with empty captions
            while len(images_meta) < len(uploaded_images):
                images_meta.append({'caption': ''})

            if len(images_meta) != len(uploaded_images):
                raise serializers.ValidationError(
                    "The number of uploaded images and images_meta entries must match."
                )

            for i, img in enumerate(uploaded_images):
                Image.objects.create(
                    post=post,
                    image=img,
                    caption=images_meta[i].get('caption', '')
                )

        # Handle links
        if links_data_str:
            try:
                links_data = json.loads(links_data_str)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for links_data.")

            for link_data in links_data:
                if 'url' not in link_data or 'text' not in link_data:
                    raise serializers.ValidationError("Each link must have 'url' and 'text'.")
                Link.objects.create(post=post, **link_data)
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        images_meta_str = validated_data.pop('images_meta', '[]')
        links_data_str = validated_data.pop('links_data', '[]')

        with transaction.atomic():
            post = Post.objects.create(**validated_data)
            self._create_or_update_nested(post, images_meta_str, links_data_str, uploaded_images)

        return post

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        images_meta_str = validated_data.pop('images_meta', '[]')
        links_data_str = validated_data.pop('links_data', '[]')

        with transaction.atomic():
            # Update Post fields
            instance.title = validated_data.get('title', instance.title)
            instance.content = validated_data.get('content', instance.content)
            instance.save()

            self._create_or_update_nested(instance, images_meta_str, links_data_str, uploaded_images)

        return instance
