.PHONY: dev

dev:
	poetry run uvicorn app.main:app --reload
