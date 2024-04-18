this project contains my boilerplate code for a full stack application with:

-   vanilla js (served by spring boot through `src/main/resources/static`)

    -   AG-Grid
    -   toastr.js
    -   axios

-   spring boot

    -   maven
    -   hibernate, JPA (the JOOQ driver would have been better, but it isn't free for oracle DB)
    -   lombok, mapstruct

-   h2 database

i also implemented a very simple but effective SSE (Server Sent Events) broadcast and subscription mechanism. this allows the data to be edited by users concurrently: changes are broadcasted to all connected clients which then update their local data.

here's what the ui looks like:

<img width="500" alt="image" src="https://github.com/sueszli/springBootBoilerplate/assets/61852663/bd2248e0-1b13-49fc-91b2-67ae87244227">

<br><br>

# getting started

```bash
#  -=-=-=-=-=-=-=-=-= CLONING AND RUNNING -=-=-=-=-=-=-=-=-=

# install java ...

# clone repository ...

# install dependencies (and ignore ssl errors in case you are behind a proxy)
mvn clean install -Dmaven.resolver.transport=wagon -Dmaven.clean.failOnError=false -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true -Dhttps.protocols=TLSv1.2

# list dependencies
mvn dependency:tree

# run with "test" profile
mvn spring-boot:run -Dspring-boot.run.profiles=test


#  -=-=-=-=-=-=-=-=-= MANUAL TESTING -=-=-=-=-=-=-=-=-=

# create
curl  -X POST http://localhost:8080/api/v1/duck \
      -H 'Content-Type: application/json' \
      -d '{ "firstName":"larry", "secondName": "larson" }'

# read
curl  -X GET http://localhost:8080/api/v1/duck/1
curl  -X GET http://localhost:8080/api/v1/duck | json_pp

# update
curl  -X PUT http://localhost:8080/api/v1/duck \
      -H 'Content-Type: application/json' \
      -d '{ "id": 1, "firstName":"updated", "secondName":"updated" }'

# delete
curl  -X DELETE http://localhost:8080/api/v1/duck/1
curl  -X DELETE http://localhost:8080/api/v1/duck

# sse broadcast
curl  -X POST http://localhost:8080/api/v1/sse/broadcast/hello%20everyone!

# sse subscribe
curl  -X GET http://localhost:8080/api/v1/sse/subscription

```

