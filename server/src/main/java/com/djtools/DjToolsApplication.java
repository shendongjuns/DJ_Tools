package com.djtools;

import com.djtools.config.AppCorsProperties;
import com.djtools.config.AppDockerProperties;
import com.djtools.config.JwtProperties;
import com.djtools.config.MinioProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.djtools")
@EnableConfigurationProperties({
        AppCorsProperties.class,
        AppDockerProperties.class,
        JwtProperties.class,
        MinioProperties.class
})
public class DjToolsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DjToolsApplication.class, args);
    }
}
