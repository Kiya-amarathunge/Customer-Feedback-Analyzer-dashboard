package com.lolc.feedback.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ADMIN_USERS")
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "admin_seq")
    @SequenceGenerator(name = "admin_seq", sequenceName = "ADMIN_USER_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "USERNAME", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "PASSWORD_HASH", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "EMAIL", length = 100)
    private String email;

    // Roles stored as comma-separated string e.g. "ROLE_ADMIN"
    @Column(name = "ROLES", length = 255)
    private String rolesString;

    @Column(name = "ACTIVE", nullable = false)
    private boolean active;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    // Helper to get roles as a Set (used by security layer)
    @Transient
    public Set<String> getRoles() {
        if (rolesString == null || rolesString.isBlank()) return Set.of();
        return Set.of(rolesString.split(","));
    }

    public void setRoles(Set<String> roles) {
        this.rolesString = roles == null ? "" : String.join(",", roles);
    }
}
