package com.splitter.dto;

import java.util.List;

public class SplitRequest {
    private String organizerName;
    private List<ParticipantDto> participants;

    public SplitRequest() {}

    public SplitRequest(String organizerName, List<ParticipantDto> participants) {
        this.organizerName = organizerName;
        this.participants = participants;
    }

    public String getOrganizerName() { return organizerName; }
    public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }

    public List<ParticipantDto> getParticipants() { return participants; }
    public void setParticipants(List<ParticipantDto> participants) { this.participants = participants; }
}