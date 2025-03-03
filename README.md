# PulseTide
A decentralized application for monitoring live events and collecting real-time audience feedback on the Stacks blockchain.

## Features
- Create live events
- Submit real-time audience feedback
- View aggregated feedback metrics
- Event moderation controls

## Setup and Installation
1. Clone the repository
2. Install Clarinet
3. Run `clarinet check` to verify contracts
4. Run `clarinet test` to execute test suite

## Usage Examples
```clarity
;; Create a new event
(contract-call? .pulse-tide create-event "Concert XYZ" u1684152000 u1684159200)

;; Submit feedback for an event
(contract-call? .pulse-tide submit-feedback u1 u5)

;; Get event metrics
(contract-call? .pulse-tide get-event-metrics u1)
```

## Dependencies
- Clarity language
- Clarinet for testing and deployment
