There is an available [Varnish](https://www.varnish-cache.org/docs/2.1/reference/vcl.html) container since it provides devs the ability to test VCL changes locally before pushing to production. Since we use [Fastly](https://www.fastly.com/), Varnish is pinned to v2.1 to mimic what they have in production.

# Setup

- [Build reddit-mobile.](https://github.com/reddit/reddit-mobile/wiki/Building)
- [Install Docker Compose.](https://docs.docker.com/compose/install/) Do *not* use the Homebrew version.

# Running

Enter the reddit-mobile directory and run the following:

`docker-compose down && docker-compose pull && docker-compose up --force-recreate`

This command does a few things:

1. Take down the containers if running.
2. Download required docker images.
3. Run the Docker containers in order with the correct port mappings.
    - This mounts the local repo into the mweb container to save time from copying and building node assets.
    - This mounts the local repo into the varnish container to prevent Docker from caching the config file (`default.vcl`), and sometimes results in garbage files written to the repo.

- You can visit the mweb container at [http://localhost:4444/](http://localhost:4444/)
- You can visit Varnish container at [http://localhost:4301/](http://localhost:4301/)

**You must use a mobile user agent to visit the site via Varnish!** This is intentional behavior. Instructions on changing your browser's user agent can be found [here](http://www.howtogeek.com/113439/how-to-change-your-browsers-user-agent-without-installing-any-extensions/).

# Debugging

## Bad Configs

The Varnish container tries to compile the VCL before starting the daemon (`varnishd`). If there are any VCL errors, the Varnish container will quit with a non-zero exit code. A bad config looks like this:
```
╭─wting@nuc ~/code/reddit-mobile ‹python-2.7.12› ‹2X×565d07a›
╰─➤  docker-compose down && docker-compose pull && docker-compose up --force-recreate
Removing redditmobile_varnish_1 ... done
Removing redditmobile_mweb_1 ... done
Removing network redditmobile_default
Creating network "redditmobile_default" with the default driver
Creating redditmobile_mweb_1
Creating redditmobile_varnish_1
Attaching to redditmobile_mweb_1, redditmobile_varnish_1
varnish_1  | storage_malloc: max size 100 MB.
varnish_1  | Message from VCC-compiler:
varnish_1  | Expected ';' got '}'
varnish_1  | (program line 491), at
varnish_1  | (input Line 17 Pos 3)
varnish_1  |   } elsif (
varnish_1  | --#--------
varnish_1  | Running VCC-compiler failed, exit 1
varnish_1  | VCL compilation failed
mweb_1     | 
mweb_1     | > r-project-blackbird@0.0.1 start /src
mweb_1     | > NODE_ENV=production npm run server
mweb_1     | 
redditmobile_varnish_1 exited with code 2
mweb_1     | 
mweb_1     | > r-project-blackbird@0.0.1 server /src
mweb_1     | > NODE_ENV=production node ./bin/ProductionServer.js
mweb_1     | 
mweb_1     | Started cluster with 4 processes.
mweb_1     | Started server at PID 31
mweb_1     | App launching on port 4444
mweb_1     | Started server at PID 36
mweb_1     | App launching on port 4444
mweb_1     | Started server at PID 46
mweb_1     | App launching on port 4444
mweb_1     | Started server at PID 41
mweb_1     | App launching on port 4444
```

Debug your VCL and try again.

## Other Issues

You can run `varnishlog` to see possible problems with Varnish talking to the mweb container:

`docker exec -it redditmobile_varnish_1 varnishlog`

An example bad log:

```
╭─wting@nuc ~/code/reddit-mobile ‹python-2.7.12› ‹2X•565d07a›
╰─➤  docker exec -it redditmobile_varnish_1 varnishlog
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443867 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443870 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443873 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443876 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443879 1.0
   11 SessionOpen  c 172.19.0.1 41288 0.0.0.0:80
   11 ReqStart     c 172.19.0.1 41288 528552268
   11 RxRequest    c GET
   11 RxURL        c /
   11 RxProtocol   c HTTP/1.1
   11 RxHeader     c Host: localhost:4301
   11 RxHeader     c Connection: keep-alive
   11 RxHeader     c Pragma: no-cache
   11 RxHeader     c Cache-Control: no-cache
   11 RxHeader     c Upgrade-Insecure-Requests: 1
   11 RxHeader     c User-Agent: Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36
   11 RxHeader     c Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
   11 RxHeader     c Accept-Encoding: gzip, deflate, sdch, br
   11 RxHeader     c Accept-Language: en-US,en;q=0.8
   11 RxHeader     c Cookie: loid=CosM5Gxs9YWXWyTHqg; loid.sig=su4_rwnON1SQ6Le10cyKbhi0SZA; loidcreated.sig=A8PlsGrIkfeEk8vvqWOkoUT6n80; koa:sess=eyJzZWNyZXQiOiJYQS1VclRkUEE2YUxZSXhBQmdpTlg1N3kiLCJfZXhwaXJlIjoxNDczOTAwMjEwMzA2LCJfbWF4QWdlIjo4NjQwMDAwMH0=; koa:sess.sig=MlcKSE9
   11 VCL_call     c recv
   11 VCL_return   c pass
   11 VCL_call     c hash
   11 VCL_return   c hash
   11 VCL_call     c pass
   11 VCL_return   c pass
   11 FetchError   c no backend connection
   11 VCL_call     c error
   11 VCL_return   c deliver
   11 VCL_call     c deliver
   11 VCL_return   c deliver
   11 TxProtocol   c HTTP/1.1
   11 TxStatus     c 503
   11 TxResponse   c Service Unavailable
   11 TxHeader     c Server: Varnish
   11 TxHeader     c Retry-After: 0
   11 TxHeader     c Content-Type: text/html; charset=utf-8
   11 TxHeader     c Content-Length: 418
   11 TxHeader     c Date: Wed, 26 Oct 2016 01:04:39 GMT
   11 TxHeader     c X-Varnish: 528552268
   11 TxHeader     c Age: 0
   11 TxHeader     c Via: 1.1 varnish
   11 TxHeader     c Connection: close
   11 Length       c 418
   11 ReqEnd       c 528552268 1477443879.910386324 1477443879.911024809 0.000073433 0.000556469 0.000082016
   11 SessionClose c error
   11 StatSess     c 172.19.0.1 41288 0 1 1 0 1 0 234 418
   11 SessionOpen  c 172.19.0.1 41294 0.0.0.0:80
   11 ReqStart     c 172.19.0.1 41294 528552269
   11 RxRequest    c GET
   11 RxURL        c /favicon.ico
   11 RxProtocol   c HTTP/1.1
   11 RxHeader     c Host: localhost:4301
   11 RxHeader     c Connection: keep-alive
   11 RxHeader     c Pragma: no-cache
   11 RxHeader     c Cache-Control: no-cache
   11 RxHeader     c User-Agent: Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36
   11 RxHeader     c Accept: */*
   11 RxHeader     c Referer: http://localhost:4301/
   11 RxHeader     c Accept-Encoding: gzip, deflate, sdch, br
   11 RxHeader     c Accept-Language: en-US,en;q=0.8
   11 RxHeader     c Cookie: loid=CosM5Gxs9YWXWyTHqg; loid.sig=su4_rwnON1SQ6Le10cyKbhi0SZA; loidcreated.sig=A8PlsGrIkfeEk8vvqWOkoUT6n80; koa:sess=eyJzZWNyZXQiOiJYQS1VclRkUEE2YUxZSXhBQmdpTlg1N3kiLCJfZXhwaXJlIjoxNDczOTAwMjEwMzA2LCJfbWF4QWdlIjo4NjQwMDAwMH0=; koa:sess.sig=MlcKSE9
   11 VCL_call     c recv
   11 VCL_return   c pass
   11 VCL_call     c hash
   11 VCL_return   c hash
   11 VCL_call     c pass
   11 VCL_return   c pass
   11 FetchError   c no backend connection
   11 VCL_call     c error
   11 VCL_return   c deliver
   11 VCL_call     c deliver
   11 VCL_return   c deliver
   11 TxProtocol   c HTTP/1.1
   11 TxStatus     c 503
   11 TxResponse   c Service Unavailable
   11 TxHeader     c Server: Varnish
   11 TxHeader     c Retry-After: 0
   11 TxHeader     c Content-Type: text/html; charset=utf-8
   11 TxHeader     c Content-Length: 418
   11 TxHeader     c Date: Wed, 26 Oct 2016 01:04:40 GMT
   11 TxHeader     c X-Varnish: 528552269
   11 TxHeader     c Age: 0
   11 TxHeader     c Via: 1.1 varnish
   11 TxHeader     c Connection: close
   11 Length       c 418
   11 ReqEnd       c 528552269 1477443880.424030781 1477443880.424325943 0.000044584 0.000254631 0.000040531
   11 SessionClose c error
   11 StatSess     c 172.19.0.1 41294 0 1 1 0 1 0 234 418
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443882 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443885 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443888 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443891 1.0
    0 CLI          - Rd ping
    0 CLI          - Wr 200 19 PONG 1477443894 1.0
```