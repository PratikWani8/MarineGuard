from fastapi.testclient import TestClient
from app.main import app

def test_health():
    with TestClient(app) as c:
        r=c.get('/api/v1/health')
        assert r.status_code==200
        assert r.json()['service']=='marineguard-ai'
