package com.lolc.feedback.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "EMPLOYEES")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "employee_seq")
    @SequenceGenerator(name = "employee_seq", sequenceName = "EMPLOYEE_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "EMPLOYEE_NUMBER", nullable = false, unique = true, length = 50)
    private String employeeNumber;

    @Column(name = "FULL_NAME", nullable = false, length = 100)
    private String fullName;

    @Column(name = "EMAIL", length = 100)
    private String email;

    @Column(name = "PHONE", length = 20)
    private String phone;

    @Column(name = "BRANCH_ID")
    private Long branchId;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    @Column(name = "ACTIVE", nullable = false)
    private boolean active;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}
