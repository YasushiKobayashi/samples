FROM php:7.4-fpm as base
MAINTAINER Yasushi kobayashi <kobayashi.yasushi@new-ship.com>

ENV TZ=Asia/Tokyo

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
    && apt-get update \
    && apt-get -y install git libicu-dev libonig-dev libzip-dev unzip locales cron locales locales-all \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install intl pdo pdo_mysql zip bcmath mysqli mbstring

COPY docker/app/etc/php.ini /usr/local/etc/php/php.ini

WORKDIR /var/www

FROM base as builder
COPY --from=composer /usr/bin/composer /usr/bin/composer
COPY ./ /var/www
ADD docker/app/etc/crontab /var/spool/crontab/root
RUN crontab /var/spool/crontab/root

COPY docker/app/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh
ADD ./.env.base /var/www/.env
RUN mkdir -p storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/testing \
    storage/logs \
    storage/app/public \
    bootstrap/cache \
    && chmod -R 777 storage \
    && composer install --prefer-dist --no-dev --optimize-autoloader \
    && php artisan clear-compiled \
    && php artisan optimize \
    && php artisan route:cache \
    && php artisan event:cache

ENTRYPOINT [ "/entrypoint.sh" ]
CMD ["php-fpm"]
