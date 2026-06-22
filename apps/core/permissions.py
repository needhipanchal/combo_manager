from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Only admin/staff users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrAdmin(BasePermission):
    """Owner of the object or admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj == request.user or getattr(obj, 'user', None) == request.user


class IsAdminOrReadOnly(BasePermission):
    """Read-only for authenticated users; write for admins."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff
