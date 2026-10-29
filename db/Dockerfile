# the database imagePostGIS and pgvector extension
# PostGIS is search by location
# pgvector is search by embeddings (RemoteCLIP)

FROM pgvector/pgvector:0.8.2-pg16-bookworm

# install PostGIS for postgres 16 plus delete leftover package list to keep docker image small
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       postgresql-16-postgis-3 \
       postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*