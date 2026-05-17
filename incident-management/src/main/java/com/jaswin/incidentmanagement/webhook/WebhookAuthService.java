package com.jaswin.incidentmanagement.webhook;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WebhookAuthService {

    @Value("${webhook.api.key}")
    private String configuredApiKey;

    public boolean validateApiKey(String providedApiKey) {
        if (providedApiKey == null || providedApiKey.isBlank()) {
            return false;
        }
        return providedApiKey.equals(configuredApiKey);
    }
}
