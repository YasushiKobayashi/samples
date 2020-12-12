#!/bin/bash

set -e

/etc/init.d/cron start

declare -p | grep -Ev 'BASHOPTS|BASH_VERSINFO|EUID|PPID|SHELLOPTS|UID' > /container.env

# @TODO サーバー複数台にする際には分離する
php artisan config:cache
php artisan migrate --seed --force &
exec "php-fpm"
