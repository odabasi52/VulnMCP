FROM python:3.10-slim

WORKDIR /app

# Sistem kütüphaneleri
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Requirements yükle
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Kodları kopyala
COPY . /app

# Environment vars
ENV OLLAMA_URL=http://ollama:11435
ENV OLLAMA_MODEL=llama3
ENV PORT=5000

EXPOSE 5000

CMD ["python3", "server.py"]