# Group - 2

## Assignment: Web Server Security

This repository contains Group 2's implementations for the Web Server Security assignment. Each project demonstrates one assigned web vulnerability, a working classroom example, and a mitigation. The projects are organized by student roll number.

> **For coursework and local demonstrations only.** The vulnerable applications are intentionally insecure. Run them locally and use only their fictional or simulated data.

## Group Ownership

| Member | Roll Number | Vulnerability Category | Implemented Variant |
|---|---|---|---|
| Vipul | IIT2024139 | SQL Injection | Authentication Bypass |
| Eknoor Singh | IIT2024163 | SQL Injection | UNION-Based Data Extraction |
| Krish | IIT2024120 | OS Command Injection | In-Band Command Injection (command output returned) |
| Sujal Mahato | IIT2024146 | Cross-Site Request Forgery (CSRF) | GET-Based Forged Action |
| Hrishav Raj | IIT2024136 | Cross-Site Scripting (XSS) | Reflected XSS |

## Projects

| Student | Project Folder | Project Guide |
|---|---|---|
| Vipul | [`IIT2024139/`](IIT2024139/) | [SQL Injection — Authentication Bypass project folder](IIT2024139/) |
| Eknoor Singh | [`IIT2024163/SQL injection variant 2/`](IIT2024163/SQL%20injection%20variant%202/) | [SQL Injection — UNION-Based Data Extraction](IIT2024163/SQL%20injection%20variant%202/README.md) |
| Krish | [`IIT2024120/command-injection/`](IIT2024120/command-injection/) | [OS Command Injection — In-Band](IIT2024120/command-injection/README.md) |
| Sujal Mahato | [`IIT2024146/`](IIT2024146/) | [CSRF — GET-Based Forged Action](IIT2024146/README.md) |
| Hrishav Raj | [`IIT2024136/XSS/`](IIT2024136/XSS/) | [XSS — Reflected](IIT2024136/XSS/README.md) |

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/VipulXSandhu/CS_Assignment_4.git
   cd CS_Assignment_4
   ```

2. Open the project folder you want to explore.
3. Follow that project's README for its requirements, startup command, local address, and demonstration steps.

Projects use different stacks, including Python/Flask and Node.js. Install dependencies separately inside the project you plan to run. Do not run multiple projects that use the same port at the same time.

## Repository Layout

```text
CS_Assignment_4/
├── IIT2024120/   OS command injection
├── IIT2024136/   Reflected XSS
├── IIT2024139/   SQL injection authentication bypass
├── IIT2024146/   GET-based CSRF
├── IIT2024163/   UNION-based SQL injection
└── README.md     Group overview and ownership
```

Each project README contains the details for running and demonstrating that implementation.

