# Cross-Site Scripting (XSS): Exploitation and Mitigation (Educational)

Web Server Security assignment for **Cyber Security (IT-30001)**, IIIT Allahabad.  
Instructor: Dr. Soumyadev Maity.

---

## 1. Ownership Declaration (Table 3)

| Member Name | Roll Number | Category | Variant Implemented | Folder |
| :--- | :--- | :--- | :--- | :--- |
| *Hrishav Raj* | *IIT2024136* | **Cross-Site Scripting (XSS)** | **Variant 2: Reflected XSS** | `XSS/` |

---

## 2. How to Run

```bash
cd c:\cs\XSS
npm install
npm start
```
Open [http://localhost:4000](http://localhost:4000) in your web browser.

The catalog page provides two selectable operational modes at the top:
* **Mode 1:** Vulnerable execution (user query reflected directly without encoding).
* **Mode 2:** Mitigated execution (context-aware HTML entity output encoding).

---

## 3. Application Overview

The application is an academic **Course Catalog & Syllabus Search Portal** allowing university students, faculty, and academic advisors to search for courses, department curricula, and syllabus outlines (e.g., IT-30001 Web Server Security, Operating Systems, Computer Networks, Cryptography).

When a user searches for a course, the application echoes the search query back in the page:
* In **Mode 1 (Vulnerable)**: The query parameter `q` is concatenated directly into the HTML response unescaped.
* In **Mode 2 (Mitigated)**: The query parameter is filtered through **Context-Aware Output Encoding** before being placed in the HTML body.

---

## 4. Variant 2: Reflected XSS

### (a) Vulnerable Implementation
**Code Path:** `server.js` (`Mode 1` branch)

```javascript
// Mode 1: Vulnerable Endpoint (Direct string concatenation into HTML)
if (mode === 'mode1') {
  // FLAW: Untrusted user query reflected directly without HTML escaping
  renderedQuery = query;
}

// Emitted directly into the server-rendered HTML response:
resultsHTML += `
  <div class="query-status">
    Showing catalog search results for: <span class="highlight">${renderedQuery}</span>
  </div>
`;
```

---

### (b) Working Exploit

An attacker crafts a URL containing a malicious JavaScript payload in the `q` parameter and tricks a victim into clicking it (e.g., via email, student forum, or messaging app).

#### Primary Exploit Payload
```html
<img src=x onerror="alert(document.cookie)">
```

#### Exploit Delivery via HTTP GET Request
```http
GET /?mode=mode1&q=%3Cimg+src%3Dx+onerror%3D%22alert(document.cookie)%22%3E HTTP/1.1
Host: localhost:4000
```

#### Exploit Link (Click to Test)
```
http://localhost:4000/?mode=mode1&q=%3Cimg%20src=x%20onerror=%22alert(document.cookie)%22%3E
```

#### What Happens in the Browser:
1. The server echoes the `<img src=x onerror=...>` tag verbatim into the HTML page.
2. The browser renders the HTML, attempts to load image `x`, fails, and triggers the `onerror` event handler.
3. An alert box pops up displaying the student's active authentication cookie (`student_auth_session`), proving arbitrary JavaScript execution in the context of the trusted academic site.

#### Real-World Harmful Impact:
* **Session Hijacking:** Stealing session tokens and authorization cookies to hijack student/faculty accounts.
* **Keylogging & Credential Theft:** Injecting hidden event listeners to log credentials and exam responses typed on the site.
* **Page Defacement & Phishing:** Rewriting the DOM to inject a fake login form that exfiltrates credentials to an attacker server.
* **Unauthorized Actions:** Submitting authenticated state-changing requests (like course registrations or grading queries) on behalf of the victim.

---

### (c) Root Cause Analysis

> **Root Cause:**  
> The vulnerability occurs because untrusted user input from the HTTP request query parameter (`req.query.q`) is embedded directly into the HTML response body without context-aware output encoding. Because the browser cannot distinguish the developer's markup from the attacker's input, it parses the injected characters (`<`, `>`, `"`, `'`) as structural HTML and JavaScript rather than literal text.

---

### (d) Implemented Mitigation: Context-Aware Output Encoding

**Code Path:** `server.js` (`Mode 2` branch)

```javascript
// Mitigation: Context-Aware Output Encoding for HTML Body Context
function encodeForHTML(input) {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (mode === 'mode2') {
  // SECURED: User input is encoded for HTML body context before rendering
  renderedQuery = encodeForHTML(query);
}
```

#### Why This Fix Blocks the Attack:
1. When the payload `<img src=x onerror=...>` is submitted, the server replaces all control characters:
   * `<` becomes `&lt;`
   * `>` becomes `&gt;`
   * `"` becomes `&quot;`
2. The browser receives:
   ```html
   Showing catalog search results for: &lt;img src=x onerror=&quot;alert(...)&quot;&gt;
   ```
3. The HTML parser recognizes `&lt;` and `&gt;` strictly as printable text entities. **No DOM element is created, and no JavaScript executes.** The payload renders harmlessly as plain text on screen.

---

## 5. Other Mitigations (Theory from Slides)

According to the course lecture hierarchy (Slide 48):

1. **Context-Aware Output Encoding + Auto-Escaping:**  
   Encoding characters based on where data is placed (HTML body, HTML attribute, JavaScript context, URL). Modern template engines and frameworks (like React, Angular, EJS) auto-escape by default.
2. **Sanitize Rich HTML:**  
   When an application must allow users to input rich formatting (e.g., in a wiki, forum, or rich course syllabus editor), home-made regex filters fail. Developers must use a robust, vetted sanitizer library such as **DOMPurify** to strip dangerous tags (`<script>`, `onerror`, `<iframe>`) while preserving safe markup.
3. **Content Security Policy (CSP):**  
   An HTTP response header (`Content-Security-Policy: default-src 'self'; script-src 'self'`) that restricts the sources from which scripts can be loaded and executes, completely blocking inline script execution and unauthorized domain callbacks.
4. **HttpOnly Cookies + Safe DOM Sinks:**  
   Marking sensitive authentication cookies with the `HttpOnly` flag prevents client-side scripts from accessing `document.cookie`, stopping cookie-stealing session hijacking. Developers must also avoid dangerous DOM sinks (like `innerHTML` or `eval()`) in favor of safe APIs like `textContent`.

---

## 6. Project Layout

```
c:\cs\XSS/
├── README.md               Module write-up & ownership declaration
├── REPORT_SECTION.md       Report text ready for group submission PDF
├── VIDEO_SCRIPT.md         Timed script for 2–3 minute video presentation
├── server.js               Backend server (Pure Node.js logic)
├── views/
│   └── index.html          Clean HTML page template (linked to /style.css)
├── public/
│   └── style.css           Dedicated CSS stylesheet
├── vulnerable_server.js    Standalone vulnerable server (port 4000)
├── secure_server.js        Standalone secured server (port 4001)
├── test_exploit.js         Automated CLI testing script
└── package.json
```
