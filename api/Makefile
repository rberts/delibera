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