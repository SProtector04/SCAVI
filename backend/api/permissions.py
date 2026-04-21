from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission class that only allows users with rol='ADMIN' to access.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ADMIN'
        )


class IsSupervisorOrAdmin(permissions.BasePermission):
    """
    Permission class that:
    - Allows read access to any authenticated user (ADMIN or SUPERVISOR)
    - Allows write access only to ADMIN
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only ADMIN can write
        return request.user.rol == 'ADMIN'
