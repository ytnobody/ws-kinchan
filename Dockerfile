FROM node:20-bookworm

RUN mkdir /app
WORKDIR /app

ENV SHELL=/bin/bash
RUN curl -fsSL https://get.pnpm.io/install.sh | sh -

ENV PATH=/root/.local/share/pnpm:$PATH

COPY package.json /app
RUN pnpm install

EXPOSE 8000
EXPOSE 8080