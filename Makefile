# =========================
# Config
# =========================

FOLDER_ID=1AhKLsQJaAQF-tJ5q6y5ajGsEb9mA0jgw

# =========================
# Commands
# =========================

venv:
	source .venv/bin/activate
pull:
	git pull

sync:
	cd BackEnd && python scripts/sync_drive.py --folder_id $(FOLDER_ID) --out drive_data/

embed:
	cd BackEnd && python embedding/make_embedding.py

api: api-dev

api-dev:
	cd BackEnd && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

api-prod:
	cd BackEnd && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

deploy: pull sync embed

web: web-dev

web-dev:
	cd frontend && npm run dev

web-build:
	cd frontend && npm ci && npm run build
