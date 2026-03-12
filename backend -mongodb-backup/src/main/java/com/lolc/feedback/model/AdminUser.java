package com.lolc.feedback.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "admin_users")
public class AdminUser {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String passwordHash;

    @Indexed(unique = true)
    private String email;

    private Set<String> roles; // ROLE_ADMIN, ROLE_VIEWER

    private boolean active;

    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
