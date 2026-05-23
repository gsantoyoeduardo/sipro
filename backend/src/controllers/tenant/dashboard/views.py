from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from src.application.dashboard.dashboard_service import DashboardService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    return Response(DashboardService.obtener_kpis(request.user))
