from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from application.services.dashboard.tenant_dashboard_service import (
    TenantDashboardService,
)


@extend_schema(
    description="Retorna KPIs del dashboard para el usuario autenticado: total productos, órdenes activas, alerts de stock, etc.",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    return Response(TenantDashboardService.obtener_kpis(request.user))

