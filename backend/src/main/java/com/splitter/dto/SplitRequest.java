package com.splitter.dto;

import java.util.List;

public class SplitRequest {
    private String organizerName;
    private List<ParticipantDto> participants;
    private List<SharedItemDto> sharedItems;

    public SplitRequest() {}

    public SplitRequest(String organizerName, List<ParticipantDto> participants, List<SharedItemDto> sharedItems) {
        this.organizerName = organizerName;
        this.participants = participants;
        this.sharedItems = sharedItems;
    }

    public String getOrganizerName() { return organizerName; }
    public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }

    public List<ParticipantDto> getParticipants() { return participants; }
    public void setParticipants(List<ParticipantDto> participants) { this.participants = participants; }

    public List<SharedItemDto> getSharedItems() { return sharedItems; }
    public void setSharedItems(List<SharedItemDto> sharedItems) { this.sharedItems = sharedItems; }
}