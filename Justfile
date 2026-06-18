set shell := ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command"]

doctor:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\doctor.ps1

dev:
    npm run dev

build:
    npm run build

test:
    npm run test

lint:
    npm run lint

db-validate:
    npm run db:validate

db-generate:
    npm run db:generate

db-seed:
    npm run db:seed

verify: doctor db-validate lint test build

