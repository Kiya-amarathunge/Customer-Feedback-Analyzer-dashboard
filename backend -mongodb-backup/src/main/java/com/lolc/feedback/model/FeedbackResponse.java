package com.lolc.feedback.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "feedback_responses")
public class FeedbackResponse {

    @Id
    private String id;

    @Indexed
    private String branchId;

    private String branchName;

    private int customerServiceRating;   // 1-5
    private int branchEnvironmentRating; // 1-5
    private int recommendationRating;    // 1-5
    private int overallRating;           // computed average

    private String additionalComments;

    private String serviceType; // Loans, Savings, Insurance, Leasing

    @Indexed
    private String ipAddress; // for rate limiting

    private String language; // en, si, ta

    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;

    // Computed field helper
    public int computeOverallRating() {
        return (int) Math.round((customerServiceRating + branchEnvironmentRating + recommendationRating) / 3.0);
    }
}
