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
    - Allows write access to ADMIN or SUPERVISOR
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # ADMIN and SUPERVISOR can write
        return request.user.rol in ['ADMIN', 'SUPERVISOR']
