package collector

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemStats struct {
	CPUUsage    float64 `json:"cpu"`
	MemoryUsage float64 `json:"memory"`
	DiskUsage   float64 `json:"disk"`
}

func GetSystemStats() SystemStats {
	var stats SystemStats

	// Memory
	v, err := mem.VirtualMemory()
	if err == nil {
		stats.MemoryUsage = v.UsedPercent
	}

	// CPU
	// Get CPU usage over a 500ms interval
	c, err := cpu.Percent(500*time.Millisecond, false)
	if err == nil && len(c) > 0 {
		stats.CPUUsage = c[0]
	}

	// Disk (Root partition)
	d, err := disk.Usage("/")
	if err == nil {
		stats.DiskUsage = d.UsedPercent
	}

	return stats
}
