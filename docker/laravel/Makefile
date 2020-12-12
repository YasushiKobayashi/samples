COMMIT_ID := $(shell git log -n 1 --pretty=format:"%H")
ACCOUNT_ID := $(shell aws sts get-caller-identity | jq -r ".Account")

build-nginx:
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com
	docker build -t nginx -f ./docker/nginx/Dockerfile .
	docker tag nginx:latest ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/nginx:${COMMIT_ID}
	docker push ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/nginx:${COMMIT_ID}

deploy-api-nginx:
	make build-ginx
	./ecs-deploy -c api --service-name api --image ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/nginx:${COMMIT_ID}

build-app:
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com
	docker build --target builder -t api -f ./docker/app/Dockerfile .
	docker tag api:latest ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}
	docker push ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}

deploy-api-app:
	make build-app
	./ecs-deploy -c api --service-name api --image ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}
