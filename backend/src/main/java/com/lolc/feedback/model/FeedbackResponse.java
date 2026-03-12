package com.lolc.feedback.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "FEEDBACK_RESPONSES")
public class FeedbackResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "feedback_seq")
    @SequenceGenerator(name = "feedback_seq", sequenceName = "FEEDBACK_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "BRANCH_ID")
    private Long branchId;

    @Column(name = "BRANCH_NAME", length = 100)
    private String branchName;

    @Column(name = "CUSTOMER_SERVICE_RATING", nullable = false)
    private int customerServiceRating;

    @Column(name = "BRANCH_ENVIRONMENT_RATING", nullable = false)
    private int branchEnvironmentRating;

    @Column(name = "RECOMMENDATION_RATING", nullable = false)
    private int recommendationRating;

    @Column(name = "OVERALL_RATING", nullable = false)
    private int overallRating;

    @Column(name = "ADDITIONAL_COMMENTS", length = 1000)
    private String additionalComments;

    @Column(name = "SERVICE_TYPE", length = 50)
    private String serviceType;

    @Column(name = "IP_ADDRESS", length = 50)
    private String ipAddress;

    @Column(name = "LANGUAGE", length = 5)
    private String language;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;
}
