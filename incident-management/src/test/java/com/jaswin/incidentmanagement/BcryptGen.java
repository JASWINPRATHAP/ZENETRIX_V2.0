package com.jaswin.incidentmanagement;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptGen {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("password");
        System.out.println("HASH_FOR_PASSWORD=" + hash);
        System.out.println("MATCHES=" + encoder.matches("password", hash));
    }
}
