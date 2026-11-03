
# OS Command Injection – In-band Demonstration

## 1. Project Overview

This project demonstrates OS Command Injection vulnerability in a web-based Network Diagnostic Tool.

The application allows users to enter an IP address and execute a ping command.

It demonstrates:
- Vulnerable command execution
- In-band command injection
- Root cause of the vulnerability
- Security mitigation
- Comparison between vulnerable and secure implementations

## 2. Technologies Used

- Node.js
- Express.js
- HTML
- CSS
- JavaScript
- Child Process Module

## 3. Vulnerability Implemented

**Category:** OS Command Injection

**Variant:** In-band Command Injection

In-band command injection occurs when an attacker injects an additional operating system command through user input and receives its output through the same application response.

## 4. Vulnerable Implementation

The application uses the `exec()` function to execute a shell command.

User input is directly concatenated into the command string.

This allows shell metacharacters to alter the intended command execution.

## 5. Root Cause

The root cause is the direct concatenation of untrusted user input into an operating system command.

Since `exec()` invokes a shell, special characters can be interpreted as shell syntax, allowing unintended commands to execute.

## 6. Exploitation Demonstration

The application demonstrates:
1. Normal ping command execution.
2. Execution of an additional harmless command through crafted input.
3. Display of the additional command output on the webpage.

## 7. Mitigation Implemented

The following security measures were implemented:

- Replaced shell-based `exec()` with `execFile()`.
- Passed command arguments separately.
- Implemented IPv4 validation using Node.js `net.isIP()`.

The secure implementation rejects invalid input before executing the command.

## 8. Other Mitigation Techniques

### Avoid the Shell
Avoid shell invocation when executing operating system programs.

### Parameterised Execution
Pass executable arguments separately instead of constructing command strings.

### Allow-list Validation
Accept only inputs matching predefined valid formats.

### Least Privilege
Run applications with minimum required operating system permissions.

## 9. Project Structure

```text
command-injection/
├── server.js
├── package.json
├── package-lock.json
├── public/
│   ├── index.html
│   └── style.css
└── screenshots/
```

## 10. How to Run

Install dependencies:

```bash
npm install
```

Start the application:

```bash
node server.js
```

Open:

http://127.0.0.1:3000

## 11. Ownership

- Student: Krish
- Roll Number: IIT2024120
- Category: OS Command Injection
- Variant: In-band Command Injection

## 12. Academic Purpose

This project was developed as part of the Cyber Security (IT-30001) Web Server Security assignment at IIIT Allahabad.
