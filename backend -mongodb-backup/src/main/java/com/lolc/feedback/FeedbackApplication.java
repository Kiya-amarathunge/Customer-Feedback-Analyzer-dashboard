package com.lolc.feedback;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class FeedbackApplication {
    public static void main(String[] args) {
        SpringApplication.run(FeedbackApplication.class, args);
    }
}
