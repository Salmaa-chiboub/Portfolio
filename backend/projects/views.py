from rest_framework import viewsets, permissions, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from .models import Project
from .serializers import ProjectSerializer


class IsAuthenticatedForWrite(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS:
			return True
		return request.user and request.user.is_authenticated


class ProjectViewSet(viewsets.ModelViewSet):
	# skills is a ManyToMany to SkillReference, so prefetch the skills relation directly
	queryset = Project.objects.all().prefetch_related('skills', 'media')
	serializer_class = ProjectSerializer
	permission_classes = (IsAuthenticatedForWrite,)
	filter_backends = [filters.SearchFilter]
	search_fields = ['title', 'description']

	def get_queryset(self):
		qs = super().get_queryset()
		skill = self.request.query_params.get('skill')
		if skill:
			qs = qs.filter(skills__reference__name__iexact=skill)
		return qs

