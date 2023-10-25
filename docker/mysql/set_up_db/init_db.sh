# ==================================
# Variables
# ==================================

DATABASES=(graphql graphql_test)

for val in ${DATABASES[@]}; do
  mysql -u root -e "DROP DATABASE IF EXISTS ${val}"
  mysql -u root -e "CREATE DATABASE IF NOT EXISTS ${val} DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci"
done
