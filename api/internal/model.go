// api/internal/model.go
package internal

import "time"

type User struct {
    ID        uint   `gorm:"primaryKey" json:"id"`
    Email     string `gorm:"unique;not null" json:"email"`
    Password  string `json:"-"` // Never return password in JSON
    VisitorID string `gorm:"column:visitor_id" json:"visitor_id"`
    Scans     []ScanLog
}

type ScanLog struct {
    ID              uint      `gorm:"primaryKey" json:"id"`
    UserID          uint      `json:"user_id"`
    URL             string    `json:"url"`
    IsSpoof         bool      `json:"is_spoof"`
    ConfidenceScore float64   `json:"confidence_score"`
    ThreatLevel     string    `json:"threat_level"`
    Timestamp       time.Time `json:"timestamp"`
}