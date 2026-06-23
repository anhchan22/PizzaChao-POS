package com.example.pizzachaongon.config;

import com.example.pizzachaongon.entity.User;
import com.example.pizzachaongon.enums.UserRole;
import com.example.pizzachaongon.enums.UserStatus;
import com.example.pizzachaongon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-owner.username}")
    private String ownerUsername;

    @Value("${app.default-owner.password}")
    private String ownerPassword;

    @Value("${app.default-owner.full-name}")
    private String ownerFullName;

    @Override
    public void run(String... args) {
        seedOwner();
    }

    private void seedOwner() {
        if (userRepository.existsByUsername(ownerUsername)) {
            log.info("✅ Owner account '{}' already exists — skipping seed", ownerUsername);
            return;
        }

        User owner = User.builder()
                .username(ownerUsername)
                .passwordHash(passwordEncoder.encode(ownerPassword))
                .fullName(ownerFullName)
                .role(UserRole.OWNER)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(owner);
        log.info("🌱 Created default owner account: username='{}', password='{}'", ownerUsername, ownerPassword);
    }
}
