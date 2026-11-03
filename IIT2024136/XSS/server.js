/**
 * Academic Course Catalog & Syllabus Search - Node.js Server
 * 
 * Category: Cross-Site Scripting (XSS)
 * Variant: Variant 2: Reflected XSS
 * 
 * Mode 1: Vulnerable (User query reflected directly into HTML without output encoding)
 * Mode 2: Mitigated (Context-Aware Output Encoding / HTML Entity Escaping)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Serve external static CSS files from /public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mock Academic Courses Dataset
const courses = [
  { code: 'IT-30001', title: 'Web Server Security & Exploitation', dept: 'Department of Information Technology', credits: 4, instructor: 'Dr. Soumyadev Maity' },
  { code: 'CS-20004', title: 'Operating Systems & System Calls', dept: 'Department of Computer Science', credits: 4, instructor: 'Faculty of CS' },
  { code: 'IT-20003', title: 'Computer Networks & Internet Protocols', dept: 'Department of Information Technology', credits: 4, instructor: 'Faculty of IT' },
  { code: 'CS-30005', title: 'Cryptography & Information Security', dept: 'Department of Computer Science', credits: 3, instructor: 'Faculty of CS' },
  { code: 'IT-40002', title: 'Distributed Systems & Cloud Architecture', dept: 'Department of Information Technology', credits: 3, instructor: 'Faculty of IT' },
  { code: 'CS-10002', title: 'Data Structures and Algorithms', dept: 'Department of Computer Science', credits: 4, instructor: 'Faculty of CS' }
];

// Helper: Context-Aware Output Encoding for HTML Body Context (Mitigation)
function encodeForHTML(input) {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Main Search Route
app.get('/', (req, res) => {
  // Set demo authentication cookie for demonstration
  res.setHeader('Set-Cookie', 'student_auth_session=TOKEN_SEC_9921b04f; Path=/');

  const query = req.query.q !== undefined ? String(req.query.q) : '';
  const mode = req.query.mode || 'mode1';

  // Filter courses by search query
  let filtered = [];
  if (query.trim() !== '') {
    const qLower = query.toLowerCase();
    filtered = courses.filter(c => 
      c.code.toLowerCase().includes(qLower) || 
      c.title.toLowerCase().includes(qLower) ||
      c.dept.toLowerCase().includes(qLower) ||
      c.instructor.toLowerCase().includes(qLower)
    );
  } else {
    filtered = courses;
  }

  // ========================================================
  // CORE FLAW VS MITIGATION CODE PATH
  // ========================================================
  let renderedQuery = '';
  if (query !== '') {
    if (mode === 'mode1') {
      // MODE 1 (VULNERABLE): Direct reflection of unvalidated, unencoded user input into HTML
      renderedQuery = query;
    } else {
      // MODE 2 (SECURED): Context-Aware HTML Entity Encoding
      renderedQuery = encodeForHTML(query);
    }
  }

  // Construct results block
  let resultsHTML = '';
  if (query !== '') {
    resultsHTML += `
      <div class="query-status">
        Showing catalog search results for: <span class="highlight">${renderedQuery}</span> (${filtered.length} found)
      </div>
    `;
  }

  if (filtered.length > 0) {
    resultsHTML += '<div class="course-list">';
    filtered.forEach(item => {
      resultsHTML += `
        <div class="course-item">
          <div class="course-header">
            <span class="course-code">${item.code}</span>
            <span class="course-credits">${item.credits} Credits</span>
          </div>
          <div class="course-title">${item.title}</div>
          <div class="course-meta">
            <span><strong>Instructor:</strong> ${item.instructor}</span> &bull; 
            <span><strong>Department:</strong> ${item.dept}</span>
          </div>
        </div>
      `;
    });
    resultsHTML += '</div>';
  } else if (query !== '') {
    resultsHTML += `
      <div class="no-results">
        No academic courses matched your search query.
      </div>
    `;
  }

  // Load clean HTML template from /views/index.html and populate placeholders
  const templatePath = path.join(__dirname, 'views', 'index.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace('<!-- MODE_1_CHECKED -->', mode === 'mode1' ? 'checked' : '')
    .replace('<!-- MODE_2_CHECKED -->', mode === 'mode2' ? 'checked' : '')
    .replace('<!-- CURRENT_MODE -->', mode)
    .replace('<!-- SEARCH_INPUT_VALUE -->', encodeForHTML(query))
    .replace('<!-- RESULTS_PLACEHOLDER -->', resultsHTML);

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Course Catalog & Syllabus Search (Reflected XSS Demo)`);
  console.log(` Server listening at: http://localhost:${PORT}`);
  console.log(` Mode 1 (Vulnerable) vs Mode 2 (Context-Aware Encoded)`);
  console.log(` HTML Template: /views/index.html | CSS: /public/style.css`);
  console.log(`=======================================================`);
});
