package com.intelligence.assistant.service;

import com.intelligence.assistant.dto.AuthRequest;
import com.intelligence.assistant.dto.AuthResponse;
import com.intelligence.assistant.dto.RegisterRequest;
import com.intelligence.assistant.dto.UserResponse;
import com.intelligence.assistant.model.User;
import com.intelligence.assistant.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());
        
        UserResponse userResponse = userService.createUser(request);
        
        // Generate token for new user
        UserDetails userDetails = userService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }
    
    public AuthResponse login(AuthRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());
        
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
            
            // Get user details
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = (User) userDetails;
            
            // Generate token
            String token = jwtUtil.generateToken(userDetails);
            
            log.info("Login successful for user: {}", request.getUsername());
            
            return AuthResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .user(userService.mapToResponse(user))
                    .build();
                    
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for user: {}", request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }
    }
    
    public UserResponse getCurrentUser(String username) {
        User user = userService.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return userService.mapToResponse(user);
    }
}
