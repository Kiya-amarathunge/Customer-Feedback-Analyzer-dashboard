package com.lolc.feedback.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FeedbackLinkDto {
    private Long id;
    private String token;
    private String employeeNumber;
    private String employeeName;
    private String branchName;
    private String customerMobile;
    private String customerId;
    private String status;
    private String smsError;
    private String createdAt;
    private String sentAt;
    private String openedAt;
    private String completedAt;
    private String feedbackLink;
    private Integer overallRating;
}
