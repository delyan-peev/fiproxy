VERSION ?= 1.0.2

IMAGE_NAME ?= fit-server
REGISTRY ?= docker-local.artifactory.neterra.paysafe.com

.PHONY: build tag push deploy

build: Dockerfile
	docker build -t $(IMAGE_NAME):$(VERSION) -f Dockerfile .

tag:
	docker tag $(IMAGE_NAME):$(VERSION) $(REGISTRY)/$(IMAGE_NAME):$(VERSION)

push:
	docker push $(REGISTRY)/$(IMAGE_NAME):$(VERSION)

deploy:
	kubectl apply -f k8s-deployment.yml --namespace=fit-server

stat:
	kubectl get pods --namespace=fit-server

default: push