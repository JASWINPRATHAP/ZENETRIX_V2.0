package com.jaswin.incidentmanagement.webhook;

import com.jaswin.incidentmanagement.enums.Priority;
import lombok.Data;

@Data
public class WebhookIncidentRequest {
    private String alertName;
    private String alertDescription;
    private Priority priority;
    private String sourceSystem;
    private Long organizationId;
}
