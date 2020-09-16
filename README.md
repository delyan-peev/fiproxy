# FIT-Server

Fault Injection Testing Server is an HTTP Proxy Service that proxies HTTP requests to a target microservice optionally injecting L7 and L4 poisons.
The idea is to test for failure before actual failure occurs in production.

Poisons are injected and configured based on various HTTP Header flags.

## Run

### Install and run using node

```
$ npm install
$ npm run start
$ export http_proxy=http://localhost:1337
$ time curl -i -H "x-fit-test: slowOpen" -H "x-fit-slowopen: 5000" http://abv.bg/
HTTP/1.1 301 Moved Permanently
server: nginx
date: Wed, 29 Aug 2018 08:43:50 GMT
content-type: text/html
content-length: 178
connection: close
location: https://www.abv.bg/

<html>
<head><title>301 Moved Permanently</title></head>
<body bgcolor="white">
<center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx</center>
</body>
</html>
curl -i -H "x-fit-test: slowOpen" -H "x-fit-slowopen: 5000" http://abv.bg  0.01s user 0.01s system 0% cpu 5.073 total
➜  toxy git:(master) ✗
```

### Build and run using Docker

```
➜  toxy git:(master) ✗ make
docker build -t fit-server:latest -f Dockerfile .
Sending build context to Docker daemon  16.23MB
Step 1/8 : FROM node:latest
 ---> b064644cf368
Step 2/8 : WORKDIR /app
 ---> Using cache
 ---> 495d8ad53a37
Step 3/8 : COPY package-lock.json package.json /app/
 ---> Using cache
 ---> 707ab03772d1
Step 4/8 : RUN npm install
 ---> Using cache
 ---> 60050dcbab63
Step 5/8 : COPY lib/ /app/lib
 ---> d9d5c920bda7
Step 6/8 : COPY web/ /app/web
 ---> 363a29714d02
Step 7/8 : EXPOSE 1337
 ---> Running in c403c5fc8c58
Removing intermediate container c403c5fc8c58
 ---> 6b96df3b66a0
Step 8/8 : CMD npm run start
 ---> Running in 88798b27e4d2
Removing intermediate container 88798b27e4d2
 ---> 6046ac969a13
Successfully built 6046ac969a13
Successfully tagged fit-server:latest
➜  toxy git:(master) ✗
➜  toxy git:(master) ✗ 
➜  toxy git:(master) ✗ 
➜  toxy git:(master) ✗ docker run -d -p 1337:1337 fit-server:latest
87421d5019fe6a4dc6140707ac23517219e5bfec82f5763efba8dec9ff9e29e3
➜  toxy git:(master) ✗ 
➜  toxy git:(master) ✗ export http_proxy="http://localhost:1337"
➜  toxy git:(master) ✗ time curl -i -H "x-fit-test: slowOpen" -H "x-fit-slowopen: 5000" http://abv.bg
HTTP/1.1 301 Moved Permanently
server: nginx
date: Wed, 29 Aug 2018 08:43:50 GMT
content-type: text/html
content-length: 178
connection: close
location: https://www.abv.bg/

<html>
<head><title>301 Moved Permanently</title></head>
<body bgcolor="white">
<center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx</center>
</body>
</html>
curl -i -H "x-fit-test: slowOpen" -H "x-fit-slowopen: 5000" http://abv.bg  0.01s user 0.01s system 0% cpu 5.073 total
➜  toxy git:(master) ✗
```

## HTTP Proxy

FIT-Server plays the role of a man in the middle http.
To use it, simply configure your HTTP client to use it as a proxy.

## Admin UI

Open http://localhost:1338 where you can configure actual poisons.

## Specifying posions

### Probability

Use **x-fit-probability** to specify the probability of applying a poison.
Probability is between 0 and 100.

### Latency

Headers:
* **x-fit-test** must be set to **latency**.
* Use **x-fit-latency** to control the jitter value in millis.

### Bandwidth

Limits the amount of bytes sent over the network in outgoing HTTP traffic for a specific time frame.

Headers:
* **x-fit-test** must be set to **bandwidth**. 
* **x-fit-bandwidth-threshold** Packets time frame in milliseconds. Default 1000.
* **x-fit-bandwidth-bytes** Amount of chunk of bytes to send. Default 1024

### Abort

Aborts the TCP connection after a given delay.

Headers:
* **x-fit-test** must be set to **abort**.
* **x-fit-abort** is used to specify the delay in ms. 0 by default.

### Timeout

Defines a response timeout.

Headers:
* **x-fit-test** must be set to **timeout**.
* **x-fit-timeout** is used to specify the delay in ms. 0 by default.

### Slow Open

Delays the HTTP connection ready state.

Headers:
* **x-fit-test** must be set to **slowOpen**.
* **x-fit-slowOpen** can be used to specify the delay. Defaults to 1000.

### Slow read

Reads incoming payload data packets slowly.
Only valid for non-GETs/.

Headers:
* **x-fit-test** must be set to **slowRead**.
* **x-fit-slowRead-chunk** Packet chunk size in bytes. Default to 1024.
* **x-fit-slowRead-threshold** Limit threshold time frame in milliseconds. Default to 1000.
