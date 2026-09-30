import { FileItem, CondaEnvironment } from '../types/ide';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  files: Omit<FileItem, 'id'>[];
  defaultFile: string;
}

export const INITIAL_FILES: FileItem[] = [
  // Folders
  {
    id: 'f-root',
    name: 'workspace',
    path: 'workspace',
    content: '',
    language: 'text',
    isFolder: true,
    parentId: null,
  },
  {
    id: 'f-src',
    name: 'src',
    path: 'src',
    content: '',
    language: 'text',
    isFolder: true,
    parentId: 'f-root',
  },
  {
    id: 'f-rust',
    name: 'rust_app',
    path: 'rust_app',
    content: '',
    language: 'text',
    isFolder: true,
    parentId: 'f-root',
  },
  {
    id: 'f-go',
    name: 'go_service',
    path: 'go_service',
    content: '',
    language: 'text',
    isFolder: true,
    parentId: 'f-root',
  },
  {
    id: 'f-java',
    name: 'java_app',
    path: 'java_app',
    content: '',
    language: 'text',
    isFolder: true,
    parentId: 'f-root',
  },

  // Python files (Conda & Data Science)
  {
    id: 'file-py-main',
    name: 'main.py',
    path: 'main.py',
    language: 'python',
    isFolder: false,
    parentId: 'f-root',
    isOpen: true,
    content: `"""
Kroma Cloud IDE - Python & Anaconda Runtime
Multi-file module execution demonstration with analytics
"""
import sys
import math
import time
from src.analyzer import compute_statistics, generate_distribution

def main():
    print("=" * 56)
    print("🐍 Kroma Cloud Python 3.11 Environment (Conda: base)")
    print("=" * 56)
    print(f"• Python executable: {sys.executable or 'Wasm/Pyodide'}")
    print(f"• Platform: {sys.platform}")
    print(f"• Current timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Generate synthetic observations
    raw_data = [24.5, 31.2, 19.8, 42.1, 38.6, 29.4, 51.0, 44.8, 33.7, 27.9]
    print(f"📥 Input sample ({len(raw_data)} points):")
    print("  ", raw_data)
    print()

    # Call external local module src/analyzer.py
    stats = compute_statistics(raw_data)
    print("📊 Statistical Summary:")
    print(f"  • Count:    {stats['count']}")
    print(f"  • Mean:     {stats['mean']:.2f}")
    print(f"  • Variance: {stats['variance']:.2f}")
    print(f"  • Std Dev:  {stats['std_dev']:.2f}")
    print(f"  • Min:      {stats['min']:.2f}")
    print(f"  • Max:      {stats['max']:.2f}")
    print()

    # ASCII sparkline distribution
    print("📈 Data Distribution Histogram:")
    hist = generate_distribution(raw_data, bins=5)
    for bin_label, count, bar in hist:
        print(f"  {bin_label:>14} | {bar:<15} ({count})")

    print()
    print("✨ Execution finished successfully.")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'file-py-analyzer',
    name: 'analyzer.py',
    path: 'src/analyzer.py',
    language: 'python',
    isFolder: false,
    parentId: 'f-src',
    isOpen: false,
    content: `"""
Statistical analysis helper module
"""
import math

def compute_statistics(data):
    """Computes mean, variance, and standard deviation for numeric lists."""
    if not data:
        return {"count": 0, "mean": 0, "variance": 0, "std_dev": 0, "min": 0, "max": 0}
    
    n = len(data)
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / n
    std_dev = math.sqrt(variance)
    
    return {
        "count": n,
        "mean": mean,
        "variance": variance,
        "std_dev": std_dev,
        "min": min(data),
        "max": max(data),
    }

def generate_distribution(data, bins=5):
    """Generates ASCII histogram bars for numeric distribution."""
    if not data:
        return []
    
    min_v, max_v = min(data), max(data)
    span = (max_v - min_v) if max_v != min_v else 1.0
    step = span / bins
    
    buckets = [0] * bins
    for val in data:
        idx = int((val - min_v) / step)
        if idx >= bins:
            idx = bins - 1
        buckets[idx] += 1
        
    result = []
    for i in range(bins):
        low = min_v + (i * step)
        high = low + step
        label = f"[{low:.1f} - {high:.1f}]"
        bar = "█" * buckets[i] * 3
        result.append((label, buckets[i], bar))
        
    return result
`,
  },
  {
    id: 'file-conda-env',
    name: 'environment.yml',
    path: 'environment.yml',
    language: 'yaml',
    isFolder: false,
    parentId: 'f-root',
    isOpen: false,
    content: `name: base
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.11.8
  - pip=24.0
  - numpy>=1.26.4
  - scipy>=1.13.0
  - pandas>=2.2.2
  - matplotlib>=3.8.4
  - pip:
      - rich>=13.7.0
      - orjson>=3.9.15
`,
  },

  // Rust Files
  {
    id: 'file-rust-main',
    name: 'main.rs',
    path: 'rust_app/main.rs',
    language: 'rust',
    isFolder: false,
    parentId: 'f-rust',
    isOpen: false,
    content: `// Rust Compiler Target (rustc 1.78.0 / Cargo)
// Demonstrates structs, traits, pattern matching, and memory safety

#[derive(Debug, Clone)]
pub struct Task {
    id: u64,
    title: String,
    priority: Priority,
    completed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl Task {
    pub fn new(id: u64, title: &str, priority: Priority) -> Self {
        Self {
            id,
            title: title.to_string(),
            priority,
            completed: false,
        }
    }

    pub fn complete(&mut self) {
        self.completed = true;
    }

    pub fn score(&self) -> u32 {
        match self.priority {
            Priority::Low => 10,
            Priority::Medium => 25,
            Priority::High => 50,
            Priority::Critical => 100,
        }
    }
}

fn main() {
    println!("🦀 Rust Compiler v1.78.0-nightly");
    println!("--------------------------------------------------");

    let mut tasks = vec![
        Task::new(1, "Initialize Cloud Runtime", Priority::Critical),
        Task::new(2, "Sync Git Repositories", Priority::High),
        Task::new(3, "Optimize Memory Allocator", Priority::Medium),
        Task::new(4, "Run Benchmarks", Priority::Low),
    ];

    // Mark task 1 as completed
    tasks[0].complete();

    let total_score: u32 = tasks.iter().map(|t| t.score()).sum();

    println!("Registered Tasks ({} total):", tasks.len());
    for task in &tasks {
        let status = if task.completed { "[✓] DONE" } else { "[ ] PEND" };
        println!("  {} #{:<2} {:<28} | {:<8?} (weight: {})", 
            status, task.id, task.title, task.priority, task.score());
    }

    println!("--------------------------------------------------");
    println!("⚡ Cumulative Workload Score: {}", total_score);
    println!("✨ Rust safety invariant checks: PASSED (zero-cost abstractions)");
}
`,
  },
  {
    id: 'file-rust-cargo',
    name: 'Cargo.toml',
    path: 'rust_app/Cargo.toml',
    language: 'text',
    isFolder: false,
    parentId: 'f-rust',
    isOpen: false,
    content: `[package]
name = "rust_cloud_app"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.36", features = ["full"] }
`,
  },

  // Go Files
  {
    id: 'file-go-main',
    name: 'main.go',
    path: 'go_service/main.go',
    language: 'go',
    isFolder: false,
    parentId: 'f-go',
    isOpen: false,
    content: `// Go Compiler Target (go 1.22.4)
// High-concurrency worker pipeline demonstration
package main

import (
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID       int
	Payload  string
	Priority int
}

type Result struct {
	JobID    int
	Status   string
	Duration time.Duration
}

func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		start := time.Now()
		// Simulate computation
		time.Sleep(time.Duration(10+job.Priority*5) * time.Millisecond)
		results <- Result{
			JobID:    job.ID,
			Status:   "SUCCESS",
			Duration: time.Since(start),
		}
	}
}

func main() {
	fmt.Println("🔷 Go Runtime v1.22.4 (darwin/amd64)")
	fmt.Println("==================================================")

	numJobs := 6
	numWorkers := 3

	jobs := make(chan Job, numJobs)
	results := make(chan Result, numJobs)
	var wg sync.WaitGroup

	// Spawn worker pool
	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobs, results, &wg)
	}

	// Enqueue tasks
	for j := 1; j <= numJobs; j++ {
		jobs <- Job{
			ID:       j,
			Payload:  fmt.Sprintf("batch_record_%03d", j),
			Priority: j % 3,
		}
	}
	close(jobs)

	// Wait in background and close results
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect outputs
	fmt.Printf("Dispatched %d jobs across %d concurrent goroutines:\n", numJobs, numWorkers)
	for res := range results {
		fmt.Printf("  • Job #%d: Status=%s, Elapsed=%v\n", res.JobID, res.Status, res.Duration)
	}

	fmt.Println("==================================================")
	fmt.Println("🚀 Concurrency pipeline drained with 0 leaks.")
}
`,
  },
  {
    id: 'file-go-mod',
    name: 'go.mod',
    path: 'go_service/go.mod',
    language: 'text',
    isFolder: false,
    parentId: 'f-go',
    isOpen: false,
    content: `module kroma/go_service

go 1.22.4
`,
  },

  // Java Files
  {
    id: 'file-java-main',
    name: 'Main.java',
    path: 'java_app/Main.java',
    language: 'java',
    isFolder: false,
    parentId: 'f-java',
    isOpen: false,
    content: `// Java Compiler Target (OpenJDK 21 / JVM)
// Object-oriented design with records and streams
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

public class Main {
    public record ServerNode(String id, String region, int cpuCores, double memoryGb, boolean active) {
        public double computeCapacity() {
            return cpuCores * 1.5 + memoryGb * 0.8;
        }
    }

    public static void main(String[] args) {
        System.out.println("☕ OpenJDK 64-Bit Server VM (build 21.0.3+9-LTS)");
        System.out.println("==================================================");

        List<ServerNode> cluster = new ArrayList<>();
        cluster.add(new ServerNode("node-us-east-1", "us-east-1", 16, 64.0, true));
        cluster.add(new ServerNode("node-us-west-2", "us-west-2", 32, 128.0, true));
        cluster.add(new ServerNode("node-eu-west-1", "eu-west-1", 8, 32.0, false));
        cluster.add(new ServerNode("node-ap-northeast-1", "ap-northeast-1", 16, 64.0, true));

        System.out.printf("Cluster Size: %d nodes registered\n\n", cluster.size());

        // Group by active status
        Map<Boolean, List<ServerNode>> partitioned = cluster.stream()
                .collect(Collectors.partitioningBy(ServerNode::active));

        System.out.println("Active Cluster Nodes:");
        for (ServerNode node : partitioned.get(true)) {
            System.out.printf("  ✓ %-20s | %-15s | %2d vCPUs | %5.1f GB RAM | Capacity Score: %.1f\n",
                    node.id(), node.region(), node.cpuCores(), node.memoryGb(), node.computeCapacity());
        }

        double totalActiveCapacity = partitioned.get(true).stream()
                .mapToDouble(ServerNode::computeCapacity)
                .sum();

        System.out.println("--------------------------------------------------");
        System.out.printf("Total Cluster Aggregate Capacity: %.2f units\n", totalActiveCapacity);
        System.out.println("JVM Garbage Collection: G1GC healthy, Heap 24.8MB utilized");
    }
}
`,
  },

  // Documentation / Config
  {
    id: 'file-readme',
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    isFolder: false,
    parentId: 'f-root',
    isOpen: false,
    content: `# Kroma Cloud IDE

Welcome to **Kroma Cloud IDE** — a fast, minimalist browser-based integrated development environment.

## 🚀 Capabilities

1. **Multi-Language Compilers & Runtimes**:
   - **Python & Anaconda**: Run Python scripts in-browser with Pyodide Wasm engine, manage Conda environments, activate virtual environments, and install conda packages.
   - **Rust Compiler**: Compile and test Rust 2021 edition with borrow checking, Cargo support, and compiler diagnostics.
   - **Go Runtime**: Execute Go 1.22 programs with goroutines, channels, and formatting.
   - **Java (JVM)**: Compile and execute Java 21 applications with OOP classes and streams.

2. **Git Version Control**:
   - Branch switching, creating branches, staged/unstaged diff inspection.
   - Side-by-side and unified visual Git Diff viewer.
   - Commit history graph with hashes, timestamps, and commit details.
   - Git CLI integration via terminal (\`git status\`, \`git commit\`, etc.).

3. **Interactive Cloud Terminal**:
   - Run commands: \`python\`, \`cargo\`, \`go\`, \`javac\`, \`conda\`, \`git\`, \`ls\`, \`cat\`, \`tree\`, \`mkdir\`, \`grep\`.
   - Command history (Up/Down arrow keys).
   - Auto-completion with \`Tab\`.

4. **Keyboard Shortcuts**:
   - **Ctrl/Cmd + S**: Save active file
   - **Ctrl/Cmd + Enter**: Run / Compile current file
   - **Ctrl/Cmd + P**: Quick Open / Command Palette
   - **Ctrl + \`**: Toggle Terminal
   - **Ctrl/Cmd + F**: Find & Replace in File
`,
  },
];

export const INITIAL_CONDA_ENVS: CondaEnvironment[] = [
  {
    name: 'base',
    pythonVersion: '3.11.8',
    isDefault: true,
    packages: [
      { name: 'python', version: '3.11.8', channel: 'conda-forge', description: 'Core Python interpreter' },
      { name: 'pip', version: '24.0', channel: 'conda-forge', description: 'Package installer' },
      { name: 'numpy', version: '1.26.4', channel: 'conda-forge', description: 'Scientific computing & arrays' },
      { name: 'scipy', version: '1.13.0', channel: 'conda-forge', description: 'Mathematics and algorithms' },
      { name: 'pandas', version: '2.2.2', channel: 'conda-forge', description: 'Data structures & analysis' },
      { name: 'matplotlib', version: '3.8.4', channel: 'conda-forge', description: 'Plotting and visualization' },
      { name: 'wheel', version: '0.43.0', channel: 'conda-forge', description: 'Binary package distribution' },
    ],
  },
  {
    name: 'ml-research',
    pythonVersion: '3.10.13',
    packages: [
      { name: 'python', version: '3.10.13', channel: 'conda-forge', description: 'Python 3.10 runtime' },
      { name: 'torch-cpu', version: '2.2.1', channel: 'pytorch', description: 'Tensors and Deep Neural Nets' },
      { name: 'scikit-learn', version: '1.4.1', channel: 'conda-forge', description: 'Machine learning algorithms' },
      { name: 'jupyterlab', version: '4.1.5', channel: 'conda-forge', description: 'Interactive notebooks' },
    ],
  },
  {
    name: 'systems-toolchain',
    pythonVersion: '3.11.4',
    packages: [
      { name: 'python', version: '3.11.4', channel: 'conda-forge', description: 'Embedded scripting runtime' },
      { name: 'rust-toolchain', version: '1.78.0', channel: 'conda-forge', description: 'rustc, cargo, rustfmt' },
      { name: 'go-toolchain', version: '1.22.4', channel: 'conda-forge', description: 'Go compiler and tools' },
      { name: 'openjdk', version: '21.0.3', channel: 'conda-forge', description: 'Java Virtual Machine' },
    ],
  },
];
