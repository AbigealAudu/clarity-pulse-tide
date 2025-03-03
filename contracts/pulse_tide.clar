;; PulseTide - Live Event Feedback Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-invalid-event (err u101))
(define-constant err-invalid-rating (err u102))
(define-constant err-event-ended (err u103))
(define-constant err-event-not-started (err u104))
(define-constant err-invalid-time (err u105))
(define-constant err-duplicate-feedback (err u106))

;; Data structures
(define-map events 
  { event-id: uint }
  {
    name: (string-ascii 64),
    creator: principal,
    start-time: uint,
    end-time: uint,
    total-ratings: uint,
    rating-sum: uint
  }
)

(define-map user-feedback
  { event-id: uint, user: principal }
  { submitted: bool }
)

(define-data-var next-event-id uint u1)

;; Create new event
(define-public (create-event (name (string-ascii 64)) (start-time uint) (end-time uint))
  (let ((event-id (var-get next-event-id)))
    (asserts! (>= start-time block-height) err-invalid-time)
    (asserts! (> end-time start-time) err-invalid-time)
    
    (map-set events
      { event-id: event-id }
      {
        name: name,
        creator: tx-sender,
        start-time: start-time,
        end-time: end-time,
        total-ratings: u0,
        rating-sum: u0
      }
    )
    
    (var-set next-event-id (+ event-id u1))
    (ok event-id)
  )
)

;; Submit feedback for an event
(define-public (submit-feedback (event-id uint) (rating uint))
  (let (
    (event (unwrap! (map-get? events { event-id: event-id }) err-invalid-event))
    (feedback-key { event-id: event-id, user: tx-sender })
  )
    (asserts! (>= rating u1) err-invalid-rating)
    (asserts! (<= rating u5) err-invalid-rating)
    (asserts! (>= block-height (get start-time event)) err-event-not-started)
    (asserts! (<= block-height (get end-time event)) err-event-ended)
    (asserts! (is-none (map-get? user-feedback feedback-key)) err-duplicate-feedback)
    
    (map-set user-feedback feedback-key { submitted: true })
    
    (map-set events
      { event-id: event-id }
      {
        name: (get name event),
        creator: (get creator event),
        start-time: (get start-time event),
        end-time: (get end-time event),
        total-ratings: (+ (get total-ratings event) u1),
        rating-sum: (+ (get rating-sum event) rating)
      }
    )
    (ok true)
  )
)

;; Get event metrics
(define-read-only (get-event-metrics (event-id uint))
  (let ((event (unwrap! (map-get? events { event-id: event-id }) err-invalid-event)))
    (ok {
      total-ratings: (get total-ratings event),
      average-rating: (if (is-eq (get total-ratings event) u0)
        u0
        (/ (get rating-sum event) (get total-ratings event))
      )
    })
  )
)

;; Get event details
(define-read-only (get-event-details (event-id uint))
  (ok (unwrap! (map-get? events { event-id: event-id }) err-invalid-event))
)
