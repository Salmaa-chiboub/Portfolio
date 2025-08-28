from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import (
	UserSerializer,
	ChangePasswordSerializer,
	ResetPasswordSerializer,
	LoginSerializer,
)

User = get_user_model()


from core.permissions import IsSuperUser


# Registration endpoint removed. Superusers should create users via admin React or manage.py createsuperuser.


class ProfileView(generics.RetrieveUpdateAPIView):
	serializer_class = UserSerializer
	permission_classes = [IsAuthenticated]

	def get_object(self):
		return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
	serializer_class = ChangePasswordSerializer
	permission_classes = [IsAuthenticated]

	def get_object(self):
		return self.request.user

	def update(self, request, *args, **kwargs):
		user = self.get_object()
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		old_password = serializer.validated_data['old_password']
		if not user.check_password(old_password):
			return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
		user.set_password(serializer.validated_data['new_password'])
		user.save()
		return Response({'detail': 'Password updated successfully.'})


class PasswordResetRequestView(generics.GenericAPIView):
	serializer_class = ResetPasswordSerializer
	# Password reset for admin accounts should be restricted to superusers
	permission_classes = [IsSuperUser]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		email = serializer.validated_data['email']
		try:
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			return Response({'detail': 'If that email is registered, a reset link will be sent.'})

		token = default_token_generator.make_token(user)
		uid = user.pk
		reset_link = f"{request.scheme}://{request.get_host()}/api/users/password-reset-confirm/?uid={uid}&token={token}"

		# Send email using Django email backend configured in settings.
		try:
			send_mail(
				subject='Password reset',
				message=f'Use this link to reset your password: {reset_link}',
				from_email=settings.DEFAULT_FROM_EMAIL,
				recipient_list=[email],
				fail_silently=False,
			)
		except Exception as e:
			# Log exception to console and return 500 so client sees an error when SMTP fails
			print(f"Error sending password reset email: {e}")
			return Response({'detail': 'Failed to send reset email. Check email configuration.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		return Response({'detail': 'If that email is registered, a reset link will be sent.'})


class PasswordResetConfirmView(generics.GenericAPIView):
	# Only superusers may confirm password reset for admin accounts
	permission_classes = [IsSuperUser]

	def post(self, request, *args, **kwargs):
		uid = request.query_params.get('uid')
		token = request.query_params.get('token')
		new_password = request.data.get('new_password')
		if not uid or not token or not new_password:
			return Response({'detail': 'uid, token and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
		user = get_object_or_404(User, pk=uid)
		if not default_token_generator.check_token(user, token):
			return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
		user.set_password(new_password)
		user.save()
		return Response({'detail': 'Password has been reset.'})


class LoginView(generics.GenericAPIView):
	permission_classes = [permissions.AllowAny]
	serializer_class = LoginSerializer

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		return Response(serializer.validated_data)

