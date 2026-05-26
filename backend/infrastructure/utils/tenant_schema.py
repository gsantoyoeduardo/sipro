import re
from django.db import connection


UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')


class tenant_schema:
    def __init__(self, empresa_id):
        eid = str(empresa_id)
        if not UUID_PATTERN.match(eid):
            raise ValueError(f"Invalid tenant ID: {eid}")
        self.schema = f"empresa_{eid}".replace('-', '_')

    def __enter__(self):
        with connection.cursor() as c:
            c.execute("SHOW search_path")
            self._original = c.fetchone()[0]
            c.execute(f'SET search_path TO "{self.schema}", public')

    def __exit__(self, *args):
        with connection.cursor() as c:
            c.execute(f'SET search_path TO {self._original}')
