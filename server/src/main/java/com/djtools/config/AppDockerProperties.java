package com.djtools.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.docker")
public class AppDockerProperties {

    private String host = "unix:///var/run/docker.sock";

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }
}
