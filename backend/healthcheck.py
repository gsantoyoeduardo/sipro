import sys
import urllib.request
from urllib.error import HTTPError

try:
    r = urllib.request.urlopen('http://localhost:8000/portal/auth/', timeout=5)
except HTTPError as e:
    r = e

sys.exit(0 if r.status in (400, 401, 405) else 1)
