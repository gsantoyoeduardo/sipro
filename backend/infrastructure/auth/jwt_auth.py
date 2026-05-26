from django.db import connection
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class TenantJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)

        idempresa = validated_token.get('idempresa')
        if idempresa:
            schema = f'empresa_{str(idempresa).replace("-", "_")}'
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path = "{schema}", public')
            request.idempresa = idempresa
        else:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path = public')

        user = self.get_user(validated_token)
        return user, validated_token
