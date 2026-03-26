package com.lolc.feedback.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackLinkDto {
    private Long   id;
    private String token;
    private String employeeNumber;
    private String employeeName;
    private String branchName;
    private String customerMobile;
    private String customerId;

    /**
     * Reference ID for the specific loan/transaction this feedback is linked to.
     * Format: LOLC-REF-LOAN-APP-{applicationNumber}
     * Example: LOLC-REF-LOAN-APP-12345
     * Null when sent manually from the admin dashboard.
     */
    private String referenceId;

    private String status;
    private String smsError;
    private String createdAt;
    private String sentAt;
    private String openedAt;
    private String completedAt;
    private String feedbackLink;
    private Integer overallRating;
}
