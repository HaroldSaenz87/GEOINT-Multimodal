-- logins and user accounts
CREATE DATABASE keycloak;

-- app which should have users, chats, messages, images, analyses
CREATE DATABASE geoapp;

-- app's db
\connect geoapp

-- Turn on postgis if not already on
CREATE EXTENSION IF NOT EXISTS POSTGIS;