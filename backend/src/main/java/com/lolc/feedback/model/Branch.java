package com.lolc.feedback.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "BRANCHES")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "branch_seq")
    @SequenceGenerator(name = "branch_seq", sequenceName = "BRANCH_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "NAME", nullable = false, length = 100)
    private String name;

    @Column(name = "LOCATION", length = 100)
    private String location;

    @Column(name = "ADDRESS", length = 255)
    private String address;

    @Column(name = "PHONE", length = 20)
    private String phone;

    @Column(name = "ACTIVE", nullable = false)
    private boolean active;

    @Column(name = "QR_CODE_URL", length = 500)
    private String qrCodeUrl;
}

