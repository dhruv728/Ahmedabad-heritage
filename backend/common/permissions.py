from rest_framework import permissions

class IsHostUser(permissions.BasePermission):
    """
    Allows access only to host users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsAdminOpsUser(permissions.BasePermission):
    """
    Allows access only to Admin / Ops staff users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)
