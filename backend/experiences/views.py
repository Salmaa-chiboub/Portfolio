from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination
from .models import Experience
from .serializers import ExperienceSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class ExperiencePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ExperienceViewSet(viewsets.ModelViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer
    pagination_class = ExperiencePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ["title", "company", "description"]
    ordering_fields = ["start_date", "end_date", "company"]
    filterset_fields = ["is_current", "company"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['delete'], permission_classes=[permissions.IsAuthenticated])
    def delete_all(self, request):
        Experience.objects.all().delete()
        return Response({'detail': 'Toutes les expériences ont été supprimées.'}, status=status.HTTP_204_NO_CONTENT)
