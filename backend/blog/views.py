from rest_framework import viewsets, permissions, decorators, response, status

from .models import Post
from .serializers import PostSerializer
from core.permissions import IsSuperUser


class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.prefetch_related("images", "links").all()
    serializer_class = PostSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        # Allow public read (list/retrieve); restrict write/publish to superusers
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [IsSuperUser()]


