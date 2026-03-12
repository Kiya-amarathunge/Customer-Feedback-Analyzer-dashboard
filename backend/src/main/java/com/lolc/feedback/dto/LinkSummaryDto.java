package com.lolc.feedback.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LinkSummaryDto {
    private long totalSent;
    private long opened;
    private long completed;
    private long failed;
    private long pending;
    private double openRate;
    private double completionRate;
}
