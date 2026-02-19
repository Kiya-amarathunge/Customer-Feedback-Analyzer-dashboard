package com.lolc.feedback.config;

import com.lolc.feedback.model.AdminUser;
import com.lolc.feedback.model.Branch;
import com.lolc.feedback.repository.AdminUserRepository;
import com.lolc.feedback.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedBranches();
    }

    private void seedAdminUser() {
        if (!adminUserRepository.existsByUsername("admin")) {
            AdminUser admin = AdminUser.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("Admin@2026"))
                    .email("admin@lolc.lk")
                    .roles(Set.of("ROLE_ADMIN"))
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            adminUserRepository.save(admin);
            System.out.println("✅ Default admin user created: username=admin, password=Admin@2026");
        }
    }

    private void seedBranches() {
        if (branchRepository.count() == 0) {
            List<Branch> branches = Arrays.asList(
                Branch.builder().name("Colombo Main").location("Colombo").address("No. 100, Braybrooke Place, Colombo 02").phone("+94 11 2 357 555").active(true).build(),
                Branch.builder().name("Kandy").location("Kandy").address("No. 18, Dalada Veediya, Kandy").phone("+94 81 2 234 567").active(true).build(),
                Branch.builder().name("Galle").location("Galle").address("No. 45, Church Cross Street, Galle").phone("+94 91 2 234 567").active(true).build(),
                Branch.builder().name("Negombo").location("Negombo").address("No. 12, Main Street, Negombo").phone("+94 31 2 234 567").active(true).build(),
                Branch.builder().name("Kurunegala").location("Kurunegala").address("No. 7, Rajapihilla Road, Kurunegala").phone("+94 37 2 234 567").active(true).build()
            );
            branchRepository.saveAll(branches);
            System.out.println("✅ Branches seeded: " + branches.size() + " branches");
        }
    }
}
