from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from application.services.dashboard.portal_dashboard_service import (
    PortalDashboardService,
)


@extend_schema(
    description="Retorna KPIs globales del portal: total empresas, usuarios activos, almacenes, etc.",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    return Response(PortalDashboardService.obtener_kpis())

