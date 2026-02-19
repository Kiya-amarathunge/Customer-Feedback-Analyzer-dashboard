package com.lolc.feedback.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenDto {
    private String token;
    private String expiresAt;
    private String username;
}
