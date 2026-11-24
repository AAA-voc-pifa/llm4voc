FROM denoland/deno:alpine-2.9.8

WORKDIR /app

COPY deno.json deno.lock* ./
RUN deno install

COPY . .
RUN deno cache main.ts

EXPOSE 8000
USER deno

CMD ["run", "--allow-net", "--allow-env", "main.ts"]
