package com.lolc.feedback.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponseDto {
    private String id;
    private String date;
    private String time;
    private int customerService;
    private int branchEnvironment;
    private int recommendation;
    private String additionalComments;
    private String branch;
    private String branchId;
    private String serviceType;
    private int overallRating;
    private LocalDateTime createdAt;
}
