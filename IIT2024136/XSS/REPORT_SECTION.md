# Section: Cross-Site Scripting (XSS)
**Course:** Cyber Security (IT-30001) — Autumn Semester 2026  
**Institution:** Indian Institute of Information Technology Allahabad (IIIT-A)  
**Instructor:** Dr. Soumyadev Maity  

---

### Student Ownership Details
* **Student Name:** [Your Name]
* **Roll Number:** [Your Roll No]
* **Vulnerability Category:** Cross-Site Scripting (XSS)
* **Implemented Variant:** Variant 2 — Reflected XSS

---

## 1. Overview of Cross-Site Scripting and Variants

Cross-Site Scripting (XSS) is a high-severity web vulnerability that occurs when an application incorporates untrusted user data into a generated web page without adequate context-aware validation or encoding. Consequently, a victim's browser parses the untrusted input as executable script rather than static text, executing attacker-supplied code within the trusted origin context of the target website.

As classified under **CWE-79** and **OWASP A03: Injection**, XSS manifests in two primary server-related variants:

### Variant 1: Stored (Persistent) XSS (Theory)
In Stored XSS, the attacker's payload is permanently saved in the application's persistent storage (such as a database, message forum, or user profile field). Whenever any regular user or administrator subsequently visits that page, the server fetches the stored payload and renders it directly into the HTML response. Because the malicious script executes automatically for all viewing victims without requiring a specially crafted link, Stored XSS is considered the most dangerous form of client-side code execution.

### Variant 2: Reflected XSS (Implemented)
In Reflected XSS, the attacker's malicious script is delivered via an immediate request parameter (such as an HTTP `GET` search query or URL parameter). The server reads the input and echoes ("reflects") it straight back into the immediate HTTP response body without persistent storage. To exploit Reflected XSS, the attacker must entice a victim into clicking a crafted hyperlink (via phishing emails, malicious forums, or messaging channels). When the victim clicks the link, the trusted web application reflects the script into their browser, running it with the full privileges of the trusted origin.

---

## 2. (a) Vulnerable Implementation (Variant 2: Reflected XSS)

### Description of the Application
The application implements an academic **Course Catalog & Syllabus Search Portal** that allows university students, faculty, and academic advisors to search for courses, departmental curricula, and course syllabus outlines.

### Code Path: `server.js` (Mode 1)
```javascript
// Mode 1: Vulnerable Endpoint (Direct Reflection)
app.get('/', (req, res) => {
  const query = req.query.q !== undefined ? String(req.query.q) : '';
  const mode = req.query.mode || 'mode1';

  let renderedQuery = '';
  if (query !== '') {
    if (mode === 'mode1') {
      // FLAW: Untrusted query string reflected directly into HTML without output encoding
      renderedQuery = query;
    }
  }

  // Emitted verbatim into server-rendered HTML response:
  const html = `
    <div class="query-status">
      Showing catalog search results for: <span class="highlight">${renderedQuery}</span>
    </div>
  `;
  res.send(html);
});
```

### Identification of Flaw
The flaw resides in directly concatenating raw input into the server-rendered HTML string:
```javascript
`Showing catalog search results for: <span class="highlight">${renderedQuery}</span>`
```
Because the application performs no HTML entity escaping, characters with structural meaning in HTML (such as `<`, `>`, `"`, `'`) are evaluated by the browser's HTML parser as new DOM elements and attributes rather than printable text characters.

---

## 3. (b) Working Exploit & Impact Evidence

### Exploit Payload
```html
<img src=x onerror="alert(document.cookie)">
```

### Exploit Delivery Mechanism
The attacker constructs a crafted URL embedding the URL-encoded payload into the query parameter `q`:
```text
http://localhost:4000/?mode=mode1&q=%3Cimg%20src=x%20onerror=%22alert(document.cookie)%22%3E
```

### Execution Mechanics in the Browser
1. The victim opens the malicious link in their browser while having an active session with the academic portal.
2. The server processes the request and embeds the unencoded payload `<img src=x onerror=...>` into the response stream.
3. The browser constructs the DOM, instantiates the `<img>` tag, and attempts to load the image source `"x"`.
4. The load fails immediately, firing the `onerror` event handler and executing the attacker's JavaScript in the context of the trusted origin (`localhost:4000`).
5. An alert box appears displaying the victim's session cookie (`student_auth_session`), proving arbitrary JavaScript execution.

### Real-World Harmful Impact
Beyond proof-of-concept alert boxes, a successful Reflected XSS attack enables:
1. **Session Hijacking:** Reading sensitive session tokens (`document.cookie`) and exfiltrating them to an attacker server, allowing permanent account takeover.
2. **Credential Harvesting & Keystroke Logging:** Injecting a JavaScript keylogger that records passwords, search queries, and sensitive data typed by the user.
3. **DOM Rewriting & Phishing:** Altering page layout to render a deceptive login modal that steals university credentials.
4. **On-Behalf Actions (Silent Forged Requests):** Issuing authenticated background `fetch()` requests to change passwords, submit forms, or transfer data using the victim's active credentials.

---

## 4. (c) Root Cause Analysis

> **Root Cause Statement:**  
> The vulnerability exists because untrusted user data supplied via the HTTP query parameter (`req.query.q`) is interpolated directly into the HTML response stream without context-aware output encoding. The browser's HTML parser cannot distinguish developer-intended markup from untrusted user input, causing injected characters (`<`, `>`, `"`, `'`) to be interpreted as executable tags and script handlers.

---

## 5. (d) Implemented Mitigation: Context-Aware Output Encoding

### Mitigation Technique Chosen
**Context-Aware Output Encoding (HTML Entity Encoding)** for the HTML Body Context.

### Code Path: `server.js` (Mode 2)
```javascript
// Mitigation: Context-Aware HTML Entity Encoding
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

### Why the Exploit Payload Fails Against this Defense
1. When `<img src=x onerror=...>` is processed by `encodeForHTML()`, the sensitive characters are converted:
   * `<` $\rightarrow$ `&lt;`
   * `>` $\rightarrow$ `&gt;`
   * `"` $\rightarrow$ `&quot;`
   * `'` $\rightarrow$ `&#39;`
2. The browser receives:
   ```html
   Showing catalog search results for: &lt;img src=x onerror=&quot;alert(...)&quot;&gt;
   ```
3. The browser parser treats `&lt;` and `&gt;` strictly as textual entities to be drawn on screen. **No `<img>` DOM node is instantiated, and no JavaScript event handler is evaluated.** The exploit renders harmlessly as plain, literal text.

---

## 6. (e) Other Mitigation Techniques (Theory from Lecture Slides)

In accordance with course lecture slides (Slide 48), the defense-in-depth mitigations for XSS are:

### 1. Context-Aware Output Encoding + Framework Auto-Escaping
Output encoding must match the exact execution context:
* **HTML Body:** Encode `<`, `>`, `&`, `"`, `'` into entity equivalents.
* **HTML Attributes:** Attribute-encode and ensure values are strictly quoted (`attr="<encoded>"`).
* **JavaScript Context:** Use JSON serialization (`JSON.stringify()`) rather than direct inline string formatting.
* **URL Attributes:** Validate URL schemes (`http://`, `https://`) and URL-encode parameters to prevent `javascript:` pseudoprotocols.  
Modern component frameworks (e.g., React, Angular) enforce auto-escaping by default, treating all dynamic expressions as text unless explicit bypasses (like `dangerouslySetInnerHTML`) are used.

### 2. Sanitize Rich HTML (DOMPurify)
When applications must accept user-authored rich text (e.g., formatted course descriptions or forum posts), character encoding would break desired formatting. In such cases, developers must employ a thoroughly tested sanitization library like **DOMPurify**. The sanitizer parses the HTML against a strict allow-list of safe tags (`<p>`, `<b>`, `<i>`) and strips all active scripting elements (`<script>`, `<iframe>`, `onload`, `onerror`).

### 3. Content Security Policy (CSP)
Content Security Policy is an HTTP response header (`Content-Security-Policy`) that specifies approved sources for content:
```http
Content-Security-Policy: default-src 'self'; script-src 'self';
```
A strict CSP blocks inline script execution (`<script>` tags and inline event handlers like `onerror`), preventing injected scripts from running even if an output encoding flaw exists.

### 4. HttpOnly Cookies + Safe DOM Sinks
* **HttpOnly Cookies:** Setting the `HttpOnly` attribute on session cookies instructs the browser that the cookie must not be exposed to client-side scripts via `document.cookie`. This prevents session theft via XSS.
* **Safe DOM Sinks:** Client-side JavaScript must avoid dangerous execution sinks (`innerHTML`, `outerHTML`, `document.write`, `eval()`) and instead use safe APIs (`textContent`, `innerText`, `createElement()`) that treat dynamic values purely as data.
