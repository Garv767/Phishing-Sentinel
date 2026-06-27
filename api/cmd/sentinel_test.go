package main

import (
	"fmt"
	"sync"
	"testing"
)

func TestBlacklistConcurrency(t *testing.T) {
	const workers = 50
	const iterations = 500
	var wg sync.WaitGroup

	// Initialize empty blacklist
	blacklistMu.Lock()
	sessionBlacklist = make(map[string]bool)
	blacklistMu.Unlock()

	// Spawn concurrent readers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for j := 0; j < iterations; j++ {
				token := fmt.Sprintf("token_%d", j)
				_ = blacklistHas(token)
			}
		}(i)
	}

	// Spawn concurrent writers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for j := 0; j < iterations; j++ {
				token := fmt.Sprintf("token_%d", j)
				blacklistAdd(token)
			}
		}(i)
	}

	wg.Wait()
}
