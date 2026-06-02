# ─── Backend Dockerfile ───────────────────────────────────────────────────────
# Multi-stage build keeps the final image slim by separating dependency
# installation from the runtime layer.

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /install

# Install build tools needed for psycopg2-binary compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies into a separate prefix
# so the runtime stage can copy only /install/packages
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install/packages -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Don't write .pyc files; show stdout immediately (no Python buffering)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy only the installed packages from builder (no build tools in final image)
COPY --from=builder /install/packages /usr/local

# Copy application source code
COPY ./app ./app

# Create a non-root user to run the application (security best practice)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Expose the port Uvicorn will listen on
EXPOSE 8000

# Start the FastAPI application with Uvicorn
# --host 0.0.0.0: listen on all interfaces (required inside Docker)
# --port 8000:    match the EXPOSE above
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
