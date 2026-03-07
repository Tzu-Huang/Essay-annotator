# =========================
# Config
# =========================

FOLDER_ID=1AhKLsQJaAQF-tJ5q6y5ajGsEb9mA0jgw

# =========================
# Commands
# =========================

pull:
	git pull

sync:
	python BackEnd/scripts/sync_drive.py --folder_id $(FOLDER_ID) --out drive_data/

embed:
	cd BackENd && python embedding/make_embedding.py

api:
	cd BackEnd && uvicorn main:app --host 0.0.0.0 --port 8000

deploy: pull sync embed