# Integration tests

Integration tests for server logic is written with vitest and connects to a database ran via testcontainers. This means we can test actual database logic without mocking anything but external system calls such as email or payment providers.

The database is seeded with some data beforehand.

- Levels: unrated, b, a, aa, aaa
- Divisions: unrated, b, a, aa, aaa, open

# Component unit tests

Component unit tests are written with vitest and are ran separately from the integration tests

# E2E tests

e2e tests are written with playwright.
