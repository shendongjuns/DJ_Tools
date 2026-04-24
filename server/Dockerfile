# syntax=docker/dockerfile:1.7

FROM maven:3.9.14-eclipse-temurin-21-alpine AS builder

WORKDIR /app/server

# 先复制 Maven 配置文件，以尽量命中依赖缓存。
COPY server/pom.xml pom.xml

COPY server/src src

# 使用 BuildKit 缓存 Maven 本地仓库，避免重复构建时反复下载依赖。
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn  \
        -Dmaven.wagon.http.retryHandler.count=3 \
        -Dmaven.wagon.http.retryHandler.requestSentEnabled=true \
        -DskipTests \
        package

FROM eclipse-temurin:21-jre-alpine-3.22

WORKDIR /app

COPY --from=builder /app/server/target/server-1.0.0.jar app.jar

RUN mkdir -p /app/logs

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
