# Content Cloud Validator Tool
Workday's Content Cloud validator tool

# Getting Starting

For running on host machine, install:
- [Node.js v8.x](https://nodejs.org/en/)

If using Docker runtime on host machine, install:
- [Docker CE](https://www.docker.com/community-edition)

# Running on host machine

The following steps will have you up and running on your host
machine:

```bash
git clone XXX
cd wday-cc-validator
npm install
npm start --endpoint=http://localhost:8080/api/contents --token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndkYXktY2Mta2lkLTEifQ.eyJpYXQiOjE1MjkzNTYxMDcsImV4cCI6MTUyOTQ0MjUwNywiYXVkIjoid2RheS1jYy1yZWZhcHAiLCJpc3MiOiJ3ZGF5LWNjIiwic3ViIjoid2RheS1jYyJ9.kUAxgp_DvgaTsHTaTk4bYSFH3iG-Vy-dUCTSdnHL7hYYfy90eoaS7TXclZYKjnJJtVjkEFZZMEPkhccpmiTRRh7ny42yyiIMFpdhvOK3AOoNQs1jYZk0qjenS-YF3Z8vUZP4s3-2Kg0lmWOuuHF3j1srPfKx0HHwv8VpjQm9A5AbndYSqxLZgCNFrNILfnAVaFHG7-LuiNsIWZefC-2MILPoZcOPj3hofxhDY5qAYG1CLR2mp7o4aWsIvAmIYLhL5IaQ2wajXF6fK0v5IYgVaD2xSeG7t0LbJeMzePNbVlJt1xcnTP0lXtddauuPRRmKEzjjHCtiLkuakgjFsxjTzw
```

In the above `npm start` replace `endpoint` value with your endpoint
and `token` value with a valid JWT for your service.  If you leave blank
endpoint will default to: `http://localhost:8080/api/contents` and a
token will be automatically generated.  If validating the ref-app, simply
run:
```
npm start
```

# Running on docker

The following steps will build and run the docker container on your
host machine:

```bash
git clone XXX
cd wday-cc-validator
docker build -t wday-cc-validator .
docker run -it --env "WDAY_CC_TEST_ENDPOINT=http://host.docker.internal:8080/api/contents" --env "WDAY_CC_TEST_TOKEN=A8392" wday-cc-validator
```

Note: Using domain name `host.docker.internal` requires Docker 18.03 or greater.
