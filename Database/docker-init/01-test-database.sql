-- Runs once, when the Docker volume is first created: the Jest tests use their
-- own database so they never touch the app's data.
CREATE DATABASE checkmate_test OWNER checkmate;
