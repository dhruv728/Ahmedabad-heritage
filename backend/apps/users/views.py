from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserPublicSerializer, UserProfileSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role__iexact=role)

        is_verified_param = self.request.query_params.get('is_verified')
        if is_verified_param is not None:
            if is_verified_param.lower() in ['false', '0']:
                qs = qs.filter(is_verified=False)
            elif is_verified_param.lower() in ['true', '1']:
                qs = qs.filter(is_verified=True)

        status_param = self.request.query_params.get('status')
        if status_param and status_param.lower() == 'pending':
            qs = qs.filter(is_verified=False)

        return qs

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def verify(self, request, pk=None):
        user = self.get_object()
        user.is_verified = True
        user.is_id_verified = True
        user.verification_status = 'VERIFIED'
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            "message": "Host verified successfully",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def reject(self, request, pk=None):
        user = self.get_object()
        user.is_verified = False
        user.is_id_verified = False
        user.verification_status = 'REJECTED'
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            "message": "Host verification rejected",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def reverify(self, request, pk=None):
        user = self.get_object()
        user.is_verified = False
        user.is_id_verified = False
        user.verification_status = 'REVERIFICATION_REQUIRED'
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            "message": "Host status set to pending re-verification",
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[permissions.AllowAny])
    def submit_reverification(self, request, pk=None):
        user = self.get_object()
        doc_url = request.data.get('id_document_url') or request.data.get('document_url')
        if doc_url:
            user.id_document_url = doc_url
        user.is_verified = False
        user.is_id_verified = False
        user.verification_status = 'PENDING_VERIFICATION'
        user.save()
        serializer = self.get_serializer(user)
        return Response({
            "message": "Re-verification documents submitted successfully. Status is now PENDING_VERIFICATION.",
            "user": serializer.data
        }, status=status.HTTP_200_OK)
