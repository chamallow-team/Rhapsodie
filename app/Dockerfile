FROM denoland/deno:latest

WORKDIR /app

COPY . .
RUN deno cache src/main.ts
CMD ["deno", "task", "launch"]
