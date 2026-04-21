FROM maven:3.9.14-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# 先复制 Maven 配置文件，以尽量命中依赖缓存。
COPY pom.xml pom.xml

RUN mvn -q -DskipTests dependency:go-offline

COPY src src

RUN mvn -q -DskipTests package

FROM maven:3.9.14-eclipse-temurin-21-alpine

WORKDIR /app

COPY --from=builder /app/target/server-1.0.0.jar app.jar

RUN mkdir -p /app/logs

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
