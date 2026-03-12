package com.lolc.feedback.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class FeedbackRequestDto {

    private String branchId;    // numeric Oracle ID as string
    private String branchName;  // custom typed branch name 

    @Min(1) @Max(5)
    private int customerService;

    @Min(1) @Max(5)
    private int branchEnvironment;

    @Min(1) @Max(5)
    private int recommendation;

    private String additionalComments;
    private String serviceType;
    private String language;
}
