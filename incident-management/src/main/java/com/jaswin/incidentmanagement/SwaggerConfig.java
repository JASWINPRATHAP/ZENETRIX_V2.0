package com.jaswin.incidentmanagement;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Incident Management System API")
                        .version("1.0.0")
                        .description("Backend REST API for managing incident lifecycle — create, track, filter, and analyze incidents.")
                        .contact(new Contact()
                                .name("Jaswinprathap Nallusamy")
                                .email("jaswinprathapn@gmail.com")
                                .url("https://github.com/jaswin")));
    }
}
