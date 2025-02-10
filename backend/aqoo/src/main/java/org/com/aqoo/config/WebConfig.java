package org.com.aqoo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000",
                        "https://i12e203.p.ssafy.io",
                        "http://i12e203.p.ssafy.io:8089")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS"
                )
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}