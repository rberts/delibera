.PHONY: dev

dev:
	poetry run uvicorn app.main:app --reload

migrate:
	poetry run alembic upgrade head

migrate-down:
	poetry run alembic downgrade -1

seed:
	poetry run python -m app.seed

test:
	poetry run pytest

e2e:
	poetry run pytest tests/e2e/test_assembly_flow.py -q

integration:
	poetry run pytest tests/integration/test_realtime_notifications.py -q

unit:
	poetry run pytest tests/unit/test_auth_service.py tests/unit/test_dependencies.py tests/unit/test_tenancy.py tests/unit/test_csv_processor.py -q