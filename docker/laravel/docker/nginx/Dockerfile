FROM nginx:latest as base

ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && apt-get update \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
