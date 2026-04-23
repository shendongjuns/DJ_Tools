FROM maven:3.9.14-eclipse-temurin-21-alpine AS builder

WORKDIR /app/server

# 仅 Docker 构建阶段使用阿里 Maven 镜像，加速 dependency:go-offline 和 package。
COPY ops/maven/settings.xml /root/.m2/settings.xml

# 先复制 Maven 配置文件，以尽量命中依赖缓存。
COPY server/pom.xml pom.xml

COPY server/src src

# 直接执行一次 package，同时完成依赖解析与打包，避免 go-offline 长时间静默等待。
RUN mvn -B -ntp -s /root/.m2/settings.xml -DskipTests package

FROM maven:3.9.14-eclipse-temurin-21-alpine

WORKDIR /app

COPY --from=builder /app/server/target/server-1.0.0.jar app.jar

RUN mkdir -p /app/logs

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
