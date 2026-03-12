package com.lolc.feedback.controller;

import com.lolc.feedback.dto.AuthTokenDto;
import com.lolc.feedback.dto.LoginRequestDto;
import com.lolc.feedback.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        final String token = jwtUtil.generateToken(userDetails);
        final String expiresAt = Instant.now().plus(jwtUtil.getExpiration(), ChronoUnit.MILLIS).toString();

        return ResponseEntity.ok(AuthTokenDto.builder()
                .token(token)
                .expiresAt(expiresAt)
                .username(userDetails.getUsername())
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // JWT is stateless - invalidation handled client-side
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
