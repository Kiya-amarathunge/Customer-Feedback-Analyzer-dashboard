package com.lolc.feedback.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSummaryDto {
    private long totalFeedback;
    private double averageRating;
    private int npsScore;
    private double responseRate;
    private double totalFeedbackChange;
    private double averageRatingChange;
    private double npsScoreChange;
    private double responseRateChange;
}
