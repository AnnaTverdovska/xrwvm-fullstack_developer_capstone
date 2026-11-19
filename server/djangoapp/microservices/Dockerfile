FROM python:3.12-slim-bookworm

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 5050
CMD [ "python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=5050" ]
