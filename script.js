// ============================================================================
// منطق تشغيل الموقع التفاعلي ونظام إشعارات الزوار (script.js)
// معمول بواسطة البشمهندس أشرف
// ============================================================================

let currentSummaryIndex = 0;
let fullExamTimerInterval = null;
let fullExamSecondsRemaining = 0;

document.addEventListener("DOMContentLoaded", () => {
  initSiteConfig();
  initMainNavigation();
  initThemeToggle();
  renderSummariesSidebar();
  selectSummary(0);
  renderLastYearExam();
  renderBasmagaSection();
  renderFullExamSection();

  // إرسال إشعار دخول زائر جديد للمطور (البشمهندس أشرف)
  sendVisitorNotification();
});

// ============================================================================
// 1. تهيئة بيانات الهيدر والبطل والفوتر ولينك التواصل مع المطور
// ============================================================================
function initSiteConfig() {
  const cfg = SITE_DATA.config;
  document.title = `${cfg.siteTitle} - ${cfg.subjectName} | ${cfg.developerBadge}`;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };

  setText("site-title-text", cfg.siteTitle);
  setText("subject-badge-text", cfg.subjectName);
  setText("hero-subject-highlight", cfg.subjectName);
  setText("dev-badge-text", cfg.developerBadge);
  setText("footer-dev-badge", cfg.developerBadge);
  setText("top-contact-label", cfg.developerContactText || "تواصل مع المطور");

  // تحديث إحصائيات البطل السريعة
  const sumCount = (SITE_DATA.summaries || []).length;
  setText("stat-summaries-count", `${sumCount} تلخيصات`);
  const examQCount = (SITE_DATA.fullExam?.questions || []).length;
  setText("stat-exam-q-count", `${examQCount} أسئلة شاملة`);

  // ربط جميع أزرار التواصل مع المطور في الهيدر والفوتر وشريط الموبايل السفلي
  const contactLinks = [
    document.getElementById("top-contact-link"),
    document.getElementById("footer-contact-link"),
    document.getElementById("dock-contact-link")
  ];
  contactLinks.forEach((link) => {
    if (link) link.href = cfg.developerContactUrl;
  });
}

// ============================================================================
// 2. التنقل بين الأقسام الـ 4 الرئيسية (ديسكتوب + شريط الموبايل السفلي العائم)
// ============================================================================
function switchMainSection(targetId) {
  const allNavButtons = document.querySelectorAll(".main-nav-btn, .dock-item[data-section]");
  const sections = document.querySelectorAll(".main-section");

  allNavButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-section") === targetId);
  });

  sections.forEach((sec) => {
    sec.classList.toggle("active", sec.id === targetId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initMainNavigation() {
  const navButtons = document.querySelectorAll(".main-nav-btn, .dock-item[data-section]");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-section");
      if (targetId) switchMainSection(targetId);
    });
  });

  // التنقل بين الـ 4 أقسام فرعية داخل كل تلخيص
  const subTabButtons = document.querySelectorAll(".sub-tab-btn");
  const subPanels = document.querySelectorAll(".sub-panel");

  subTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSubId = btn.getAttribute("data-subtab");

      subTabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      subPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === targetSubId);
      });
    });
  });
}

// ============================================================================
// 3. الوضع الليلي / النهاري
// ============================================================================
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const iconEl = document.getElementById("theme-icon");
  const labelEl = document.getElementById("theme-label");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      if (iconEl) iconEl.textContent = "☀️";
      if (labelEl) labelEl.textContent = "نهاري";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      if (iconEl) iconEl.textContent = "🌙";
      if (labelEl) labelEl.textContent = "ليلي";
    }
  });
}

// ============================================================================
// 4. عرض قسم التلخيصات والأقسام الفرعية الأربعة لكل تلخيص
// ============================================================================
function renderSummariesSidebar() {
  const listContainer = document.getElementById("summaries-list-container");
  const summaries = SITE_DATA.summaries || [];
  if (!listContainer) return;

  listContainer.innerHTML = summaries
    .map(
      (item, idx) => `
      <button type="button" class="week-pill-btn ${idx === currentSummaryIndex ? "active" : ""}" onclick="selectSummary(${idx})">
        Week ${item.number || idx + 1}
      </button>
    `
    )
    .join("");
}

function selectSummary(index) {
  const summaries = SITE_DATA.summaries || [];
  if (!summaries[index]) return;

  currentSummaryIndex = index;
  const current = summaries[index];

  // تحديث حالة أزرار الأسابيع
  const weekButtons = document.querySelectorAll(".week-pill-btn");
  weekButtons.forEach((btn, idx) => {
    btn.classList.toggle("active", idx === index);
  });

  // تحديث عنوان الأسبوع المختار بدون تكرار كلمة Week X
  const badgeEl = document.getElementById("active-summary-badge");
  if (badgeEl) badgeEl.textContent = `Week ${current.number || index + 1}`;

  const cleanTitle = (current.title || "").replace(/^Week\s*\d+\s*:\s*/i, "");
  const titleEl = document.getElementById("active-summary-title");
  if (titleEl) titleEl.textContent = cleanTitle;

  // 1) أولاً: التلخيص نفسه
  const subSummaryEl = document.getElementById("sub-summary");
  subSummaryEl.innerHTML = (current.summaryContent || [])
    .map(
      (block) => `
      <div class="content-block">
        <h3>${block.heading}</h3>
        <ul class="points-list">
          ${(block.points || []).map((pt) => `<li>${pt}</li>`).join("")}
        </ul>
        ${
          block.highlightBox
            ? `<div class="highlight-callout">💡 ${block.highlightBox}</div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  // 2) ثانياً: حل على التلخيص
  const subPracticeEl = document.getElementById("sub-practice");
  const problems = current.practiceProblems || [];

  subPracticeEl.innerHTML = `
    <div class="compact-toolbar">
      <strong>✍️ تطبيقات محلولة (${problems.length} سؤال)</strong>
      <button type="button" class="toggle-answer-btn" onclick="toggleAllPracticeAnswers(${index}, this)">
        👁️ إظهار كل الحلول
      </button>
    </div>

    ${problems
      .map(
        (prob, i) => `
      ${
        prob.category
          ? `<div class="practice-category-header">
               <span>📌 ${prob.category}</span>
             </div>`
          : ""
      }
      <div class="qa-card" id="prac-card-${index}-${i}">
        <div class="qa-badges">
          <span class="badge ${prob.badgeText && prob.badgeText.includes("صح") ? "badge-purple" : "badge-blue"}">
            ${prob.badgeText || `تدريب #${i + 1}`}
          </span>
        </div>

        <div class="qa-question">${prob.question}</div>

        ${
          prob.options && prob.options.length
            ? `<div class="practice-options-grid" id="prac-opts-${index}-${i}">
                ${prob.options
                  .map(
                    (opt, optIdx) => `
                  <div
                    class="practice-option-item"
                    data-correct="${optIdx === prob.correctIndex ? "true" : "false"}"
                    onclick="revealPracticeSolution(${index}, ${i}, ${optIdx})"
                  >
                    <span>${opt}</span>
                    <span class="opt-status-icon"></span>
                  </div>
                `
                  )
                  .join("")}
               </div>`
            : ""
        }

        ${prob.hint ? `<div class="qa-hint">💭 <strong>تلميح:</strong> ${prob.hint}</div>` : ""}

        <button
          type="button"
          class="toggle-answer-btn"
          id="prac-btn-${index}-${i}"
          onclick="togglePracticeAnswer(${index}, ${i})"
        >
          👁️ إظهار الحل والتفسير
        </button>

        <div id="prac-ans-${index}-${i}" class="qa-answer">
          ${
            prob.answerTitle
              ? `<div class="ans-title-row">✅ ${prob.answerTitle}</div>
                 <div class="ans-exp-row"><strong>📌 التفسير:</strong> ${prob.explanation || ""}</div>`
              : `<div>${prob.answer || ""}</div>`
          }
        </div>
      </div>
    `
      )
      .join("")}
  `;

  // 3) ثالثاً: أسئلة امتحانات السنين اللي فاتت على التلخيص ده
  const subPastEl = document.getElementById("sub-past");
  const pastQs = current.pastExamQuestions || [];

  subPastEl.innerHTML = `
    <div class="compact-toolbar">
      <strong>🗂️ أسئلة سنين سابقة (${pastQs.length} سؤال)</strong>
      <button type="button" class="toggle-answer-btn" onclick="toggleAllPastAnswers(${index}, this)">
        👁️ إظهار كل الحلول
      </button>
    </div>

    ${pastQs
      .map(
        (pq, i) => `
      ${
        pq.category
          ? `<div class="practice-category-header">
               <span>📌 ${pq.category}</span>
             </div>`
          : ""
      }
      <div class="qa-card" id="past-card-${index}-${i}">
        <div class="qa-badges">
          <span class="badge badge-amber">📅 ${pq.examYear}</span>
          ${
            pq.questionType
              ? `<span class="badge ${pq.questionType.includes("صح") ? "badge-purple" : "badge-blue"}">${pq.questionType}</span>`
              : ""
          }
        </div>

        <div class="qa-question">${pq.question}</div>

        ${
          pq.options && pq.options.length
            ? `<div class="practice-options-grid" id="past-opts-${index}-${i}">
                ${pq.options
                  .map(
                    (opt, optIdx) => `
                  <div
                    class="practice-option-item"
                    data-correct="${optIdx === pq.correctIndex ? "true" : "false"}"
                    onclick="revealPastSolution(${index}, ${i}, ${optIdx})"
                  >
                    <span>${opt}</span>
                    <span class="opt-status-icon"></span>
                  </div>
                `
                  )
                  .join("")}
               </div>`
            : ""
        }

        <button
          type="button"
          class="toggle-answer-btn"
          id="past-btn-${index}-${i}"
          onclick="togglePastAnswer(${index}, ${i})"
        >
          👁️ إظهار الحل النموذجي والتفسير
        </button>

        <div id="past-ans-${index}-${i}" class="qa-answer">
          ${
            pq.answerTitle
              ? `<div class="ans-title-row">✅ ${pq.answerTitle}</div>
                 <div class="ans-exp-row"><strong>📌 سبب الاختيار والتفسير:</strong> ${pq.explanation || ""}</div>`
              : `<div>${pq.answer || ""}</div>`
          }
        </div>
      </div>
    `
      )
      .join("")}
  `;

  // 4) رابعاً: اختبر نفسك على التلخيص ده
  renderSummaryQuiz(current.quizQuestions || [], index);
}

function toggleAnswer(elementId, btnEl) {
  const ansEl = document.getElementById(elementId);
  if (!ansEl) return;
  const isOpen = ansEl.classList.toggle("open");
  btnEl.textContent = isOpen ? "🙈 إخفاء الحل" : "👁️ إظهار الحل النموذجي";
}

function togglePracticeAnswer(summaryIdx, probIdx, forceState) {
  const ansEl = document.getElementById(`prac-ans-${summaryIdx}-${probIdx}`);
  const btnEl = document.getElementById(`prac-btn-${summaryIdx}-${probIdx}`);
  const optsGrid = document.getElementById(`prac-opts-${summaryIdx}-${probIdx}`);
  if (!ansEl) return;

  const isOpen =
    typeof forceState === "boolean"
      ? (ansEl.classList.toggle("open", forceState), forceState)
      : ansEl.classList.toggle("open");

  if (btnEl) {
    btnEl.textContent = isOpen ? "🙈 إخفاء الحل والتفسير" : "👁️ إظهار الحل النموذجي والتفسير";
  }

  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      if (isOpen) {
        if (isCorrect) {
          item.classList.add("correct-choice");
          if (iconSpan) iconSpan.textContent = "✔";
        }
      } else {
        item.classList.remove("correct-choice", "wrong-choice");
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
}

function revealPracticeSolution(summaryIdx, probIdx, clickedOptIdx) {
  const optsGrid = document.getElementById(`prac-opts-${summaryIdx}-${probIdx}`);
  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item, idx) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      item.classList.remove("correct-choice", "wrong-choice");
      if (isCorrect) {
        item.classList.add("correct-choice");
        if (iconSpan) iconSpan.textContent = "✔";
      } else if (idx === clickedOptIdx) {
        item.classList.add("wrong-choice");
        if (iconSpan) iconSpan.textContent = "✖";
      } else {
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
  const ansEl = document.getElementById(`prac-ans-${summaryIdx}-${probIdx}`);
  const btnEl = document.getElementById(`prac-btn-${summaryIdx}-${probIdx}`);
  if (ansEl && !ansEl.classList.contains("open")) {
    ansEl.classList.add("open");
    if (btnEl) btnEl.textContent = "🙈 إخفاء الحل والتفسير";
  }
}

function toggleAllPracticeAnswers(summaryIdx, masterBtn) {
  const problems = SITE_DATA.summaries[summaryIdx]?.practiceProblems || [];
  const currentlyOpen = masterBtn.getAttribute("data-all-open") === "true";
  const nextState = !currentlyOpen;

  problems.forEach((_, i) => {
    togglePracticeAnswer(summaryIdx, i, nextState);
  });

  masterBtn.setAttribute("data-all-open", String(nextState));
  masterBtn.textContent = nextState ? "🙈 إخفاء جميع الحلول" : "👁️ إظهار جميع الحلول معاً";
}

function togglePastAnswer(summaryIdx, qIdx, forceState) {
  const ansEl = document.getElementById(`past-ans-${summaryIdx}-${qIdx}`);
  const btnEl = document.getElementById(`past-btn-${summaryIdx}-${qIdx}`);
  const optsGrid = document.getElementById(`past-opts-${summaryIdx}-${qIdx}`);
  if (!ansEl) return;

  const isOpen =
    typeof forceState === "boolean"
      ? (ansEl.classList.toggle("open", forceState), forceState)
      : ansEl.classList.toggle("open");

  if (btnEl) {
    btnEl.textContent = isOpen ? "🙈 إخفاء الحل والتفسير" : "👁️ إظهار الحل النموذجي والتفسير";
  }

  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      if (isOpen) {
        if (isCorrect) {
          item.classList.add("correct-choice");
          if (iconSpan) iconSpan.textContent = "✔";
        }
      } else {
        item.classList.remove("correct-choice", "wrong-choice");
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
}

function revealPastSolution(summaryIdx, qIdx, clickedOptIdx) {
  const optsGrid = document.getElementById(`past-opts-${summaryIdx}-${qIdx}`);
  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item, idx) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      item.classList.remove("correct-choice", "wrong-choice");
      if (isCorrect) {
        item.classList.add("correct-choice");
        if (iconSpan) iconSpan.textContent = "✔";
      } else if (idx === clickedOptIdx) {
        item.classList.add("wrong-choice");
        if (iconSpan) iconSpan.textContent = "✖";
      } else {
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
  const ansEl = document.getElementById(`past-ans-${summaryIdx}-${qIdx}`);
  const btnEl = document.getElementById(`past-btn-${summaryIdx}-${qIdx}`);
  if (ansEl && !ansEl.classList.contains("open")) {
    ansEl.classList.add("open");
    if (btnEl) btnEl.textContent = "🙈 إخفاء الحل والتفسير";
  }
}

function toggleAllPastAnswers(summaryIdx, masterBtn) {
  const pastQs = SITE_DATA.summaries[summaryIdx]?.pastExamQuestions || [];
  const currentlyOpen = masterBtn.getAttribute("data-all-open") === "true";
  const nextState = !currentlyOpen;

  pastQs.forEach((_, i) => {
    togglePastAnswer(summaryIdx, i, nextState);
  });

  masterBtn.setAttribute("data-all-open", String(nextState));
  masterBtn.textContent = nextState ? "🙈 إخفاء جميع الحلول" : "👁️ إظهار جميع الحلول معاً";
}

// ============================================================================
// 5. كويز التلخيص الفرعي (رابعاً: اختبر نفسك على التلخيص)
// ============================================================================
const summaryScores = {};

function renderSummaryQuiz(questions, summaryIdx) {
  const subQuizEl = document.getElementById("sub-quiz");
  summaryScores[summaryIdx] = 0;

  if (!questions.length) {
    subQuizEl.innerHTML = `<div class="content-block">لا توجد أسئلة مضافة بعد في هذا التلخيص.</div>`;
    return;
  }

  subQuizEl.innerHTML = `
    <div class="compact-toolbar">
      <strong>🎯 اختبر نفسك (${questions.length} سؤال)</strong>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span id="summary-quiz-score-${summaryIdx}" class="badge badge-blue" style="font-size: 0.82rem; padding: 4px 10px;">
          النتيجة: 0 / ${questions.length}
        </span>
        <button type="button" class="toggle-answer-btn" onclick="selectSummary(${summaryIdx})">🔄 إعادة</button>
      </div>
    </div>
    ${questions
      .map(
        (q, qIdx) => `
      <div class="quiz-card" data-answered="false" id="sq-card-${summaryIdx}-${qIdx}">
        <div class="qa-question">${qIdx + 1}. ${q.question}</div>
        <div class="options-list">
          ${q.options
            .map(
              (opt, optIdx) => `
            <button
              type="button"
              class="option-btn"
              onclick="checkSummaryQuizOption(${summaryIdx}, ${qIdx}, ${optIdx}, ${q.correctIndex})"
            >
              ${opt}
            </button>
          `
            )
            .join("")}
        </div>
        <div id="sq-exp-${summaryIdx}-${qIdx}" class="quiz-explanation">
          <strong>💡 التوضيح:</strong> ${q.explanation || ""}
        </div>
      </div>
    `
      )
      .join("")}
  `;
}

function checkSummaryQuizOption(summaryIdx, qIdx, selectedOptIdx, correctIdx) {
  const card = document.getElementById(`sq-card-${summaryIdx}-${qIdx}`);
  if (!card || card.getAttribute("data-answered") === "true") return;

  card.setAttribute("data-answered", "true");
  const buttons = card.querySelectorAll(".option-btn");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIdx) btn.classList.add("correct");
    if (idx === selectedOptIdx && selectedOptIdx !== correctIdx) {
      btn.classList.add("wrong");
    }
  });

  const expEl = document.getElementById(`sq-exp-${summaryIdx}-${qIdx}`);
  if (expEl) expEl.classList.add("visible");

  if (selectedOptIdx === correctIdx) summaryScores[summaryIdx] = (summaryScores[summaryIdx] || 0) + 1;

  const total = SITE_DATA.summaries[summaryIdx].quizQuestions.length;
  const scoreBadge = document.getElementById(`summary-quiz-score-${summaryIdx}`);
  if (scoreBadge) {
    scoreBadge.textContent = `النتيجة: ${summaryScores[summaryIdx]} / ${total}`;
  }
}

// ============================================================================
// 6. القسم الثاني: امتحان السنة اللي فاتت (النموذج الكامل - 50 سؤالاً)
// ============================================================================
function renderLastYearExam() {
  const container = document.getElementById("last-exam-container");
  const exam = SITE_DATA.lastYearExam;
  if (!container || !exam) return;

  container.innerHTML = `
    <div class="compact-toolbar">
      <strong>📄 امتحان الميدترم السنة اللي فاتت (50 سؤالاً)</strong>
      <button type="button" class="toggle-answer-btn" onclick="toggleAllLastExamAnswers(this)">
        👁️ إظهار كل الحلول الـ 50
      </button>
    </div>

    ${(exam.sections || [])
      .map(
        (sec, sIdx) => `
      <div style="margin-bottom: 28px;">
        <div class="practice-category-header">
          <span>📌 ${sec.sectionTitle}</span>
        </div>
        ${(sec.questions || [])
          .map(
            (q, qIdx) => `
          <div class="qa-card" id="ly-card-${sIdx}-${qIdx}">
            <div class="qa-badges">
              <span class="badge badge-amber">سؤال رقم ${q.number}</span>
              ${
                q.badgeText
                  ? `<span class="badge ${q.badgeText.includes("صح") ? "badge-purple" : "badge-blue"}">${q.badgeText}</span>`
                  : ""
              }
            </div>

            <div class="qa-question">${q.question}</div>

            ${
              q.options && q.options.length
                ? `<div class="practice-options-grid" id="ly-opts-${sIdx}-${qIdx}">
                    ${q.options
                      .map(
                        (opt, optIdx) => `
                      <div
                        class="practice-option-item"
                        data-correct="${optIdx === q.correctIndex ? "true" : "false"}"
                        onclick="revealLastExamSolution(${sIdx}, ${qIdx}, ${optIdx})"
                      >
                        <span>${opt}</span>
                        <span class="opt-status-icon"></span>
                      </div>
                    `
                      )
                      .join("")}
                   </div>`
                : ""
            }

            <button
              type="button"
              class="toggle-answer-btn"
              id="ly-btn-${sIdx}-${qIdx}"
              onclick="toggleLastExamAnswer(${sIdx}, ${qIdx})"
            >
              👁️ إظهار الحل النموذجي والتفسير
            </button>

            <div id="ly-ans-${sIdx}-${qIdx}" class="qa-answer">
              ${
                q.answerTitle
                  ? `<div class="ans-title-row">✅ ${q.answerTitle}</div>
                     <div class="ans-exp-row"><strong>📌 سبب الاختيار والتفسير:</strong> ${q.explanation || ""}</div>`
                  : `<div>${q.modelAnswer || ""}</div>`
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("")}
  `;
}

function toggleLastExamAnswer(sIdx, qIdx, forceState) {
  const ansEl = document.getElementById(`ly-ans-${sIdx}-${qIdx}`);
  const btnEl = document.getElementById(`ly-btn-${sIdx}-${qIdx}`);
  const optsGrid = document.getElementById(`ly-opts-${sIdx}-${qIdx}`);
  if (!ansEl) return;

  const isOpen =
    typeof forceState === "boolean"
      ? (ansEl.classList.toggle("open", forceState), forceState)
      : ansEl.classList.toggle("open");

  if (btnEl) {
    btnEl.textContent = isOpen ? "🙈 إخفاء الحل والتفسير" : "👁️ إظهار الحل النموذجي والتفسير";
  }

  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      if (isOpen) {
        if (isCorrect) {
          item.classList.add("correct-choice");
          if (iconSpan) iconSpan.textContent = "✔";
        }
      } else {
        item.classList.remove("correct-choice", "wrong-choice");
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
}

function revealLastExamSolution(sIdx, qIdx, clickedOptIdx) {
  const optsGrid = document.getElementById(`ly-opts-${sIdx}-${qIdx}`);
  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item, idx) => {
      const isCorrect = item.getAttribute("data-correct") === "true";
      const iconSpan = item.querySelector(".opt-status-icon");
      item.classList.remove("correct-choice", "wrong-choice");
      if (isCorrect) {
        item.classList.add("correct-choice");
        if (iconSpan) iconSpan.textContent = "✔";
      } else if (idx === clickedOptIdx) {
        item.classList.add("wrong-choice");
        if (iconSpan) iconSpan.textContent = "✖";
      } else {
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }
  const ansEl = document.getElementById(`ly-ans-${sIdx}-${qIdx}`);
  const btnEl = document.getElementById(`ly-btn-${sIdx}-${qIdx}`);
  if (ansEl && !ansEl.classList.contains("open")) {
    ansEl.classList.add("open");
    if (btnEl) btnEl.textContent = "🙈 إخفاء الحل والتفسير";
  }
}

function toggleAllLastExamAnswers(masterBtn) {
  const sections = SITE_DATA.lastYearExam?.sections || [];
  const currentlyOpen = masterBtn.getAttribute("data-all-open") === "true";
  const nextState = !currentlyOpen;

  sections.forEach((sec, sIdx) => {
    (sec.questions || []).forEach((_, qIdx) => {
      toggleLastExamAnswer(sIdx, qIdx, nextState);
    });
  });

  masterBtn.setAttribute("data-all-open", String(nextState));
  masterBtn.textContent = nextState ? "🙈 إخفاء جميع الحلول" : "👁️ إظهار جميع الحلول الـ 50 معاً";
}

// ============================================================================
// 7. القسم الثالث: قسم البصمجة (منظم في 5 أقسام احترافية + بحث لحظي + فلترة)
// ============================================================================
let activeBasmagaTab = "all";

function renderBasmagaSection(selectedTab) {
  const container = document.getElementById("basmaga-container");
  const basmaga = SITE_DATA.basmaga;
  if (!container || !basmaga) return;

  if (selectedTab) activeBasmagaTab = selectedTab;

  const tabs = [
    { id: "all", label: "🌐 عرض كل البصمجة" },
    { id: "bm-sec-numbers", label: "📍 1. الأرقام الحاكمة (27 رقماً)" },
    { id: "bm-sec-keywords", label: "🔑 2. الكلمات المفتاحية والقرى (16 مفتاحاً)" },
    { id: "bm-sec-dates", label: "🏛️ 3. التواريخ والعلماء والمؤسسات (15)" },
    { id: "bm-sec-traps", label: "🚫 4. فخاخ صح وغلط (12 فخاً)" },
    { id: "bm-sec-equation", label: "⚡ 5. المعادلة الذهبية" }
  ];

  const showSection = (secId) => activeBasmagaTab === "all" || activeBasmagaTab === secId;

  container.innerHTML = `
    <!-- شريط الفلترة والبحث السريع داخل قسم البصمجة -->
    <div class="basmaga-controls-bar">
      <div class="basmaga-tabs-row">
        ${tabs
          .map(
            (t) => `
          <button
            type="button"
            class="basmaga-filter-pill ${activeBasmagaTab === t.id ? "active" : ""}"
            onclick="renderBasmagaSection('${t.id}')"
          >
            ${t.label}
          </button>
        `
          )
          .join("")}
      </div>

      <div class="basmaga-search-box">
        <input
          type="search"
          id="basmaga-search-input"
          placeholder="🔍 ابحث فوراً عن أي رقم، قرية، عالم، تاريخ، أو كلمة مفتاحية..."
          oninput="filterBasmagaItems(this.value)"
        />
      </div>
    </div>

    <!-- ⚡ المعادلة الذهبية للتنمية المستدامة -->
    ${
      showSection("bm-sec-equation") && basmaga.goldenEquation
        ? `
      <div class="bm-section-block" data-bm-block>
        <div class="practice-category-header" style="border-right-color: var(--gold); color: var(--gold);">
          <span>⚡ المعادلة الذهبية للتنمية المستدامة (المشروعات الصغيرة)</span>
        </div>
        <div class="golden-equation-banner" data-bm-item>
          <div class="eq-pill eq-input">🌱 ${basmaga.goldenEquation.part1}</div>
          <div class="eq-arrow-box">
            <span class="eq-bridge-tag">⚙️ ${basmaga.goldenEquation.bridge}</span>
            <span class="eq-arrow-line">━━━━━━━►</span>
          </div>
          <div class="eq-pill eq-output">🏆 ${basmaga.goldenEquation.result}</div>
        </div>
      </div>
    `
        : ""
    }

    <!-- 📍 القسم الأول: بصمجة الأرقام الحاكمة (27 رقماً) -->
    ${
      showSection("bm-sec-numbers")
        ? `
      <div class="bm-section-block" data-bm-block>
        <div class="practice-category-header">
          <span>📍 القسم الأول: بصمجة الأرقام الحاكمة (المفتاح الرقمي ⬅️ الاختيار الفوري) — ${
            (basmaga.numbersSection || []).length
          } رقماً</span>
        </div>
        <div class="bm-numbers-grid">
          ${(basmaga.numbersSection || [])
            .map(
              (item, idx) => `
            <div class="bm-number-card" data-bm-item>
              <div class="bm-num-header">
                <span class="bm-index-tag">#${idx + 1}</span>
                <span class="bm-big-number">${item.num}</span>
              </div>
              <div class="bm-num-keyword">
                <small>🔍 الكلمة المفتاحية في السؤال:</small>
                <strong>${item.keyword}</strong>
              </div>
              <div class="bm-num-answer">
                <small>✅ الاختيار الصحيح المباشر:</small>
                <span>${item.answer}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }

    <!-- 🔑 القسم الثاني: بصمجة الكلمات المفتاحية (شوف الكلمة ⬅️ اختار الإجابة) -->
    ${
      showSection("bm-sec-keywords")
        ? `
      <div class="bm-section-block" data-bm-block>
        <div class="practice-category-header">
          <span>🔑 القسم الثاني: بصمجة الكلمات المفتاحية (شوف الكلمة ⬅️ اختار الإجابة)</span>
        </div>
        ${(basmaga.keywordsGroups || [])
          .map(
            (group) => `
          <h3 class="bm-sub-heading">📌 ${group.groupTitle}</h3>
          <div class="bm-keywords-list">
            ${(group.items || [])
              .map(
                (it, i) => `
              <div class="bm-keyword-row" data-bm-item>
                <div class="bm-kw-trigger">
                  <span class="bm-kw-num">${i + 1}</span>
                  <div>
                    <small class="bm-kw-label">لو شفت في السؤال 🔍</small>
                    <strong>${it.trigger}</strong>
                  </div>
                </div>
                <div class="bm-kw-divider">⬅️</div>
                <div class="bm-kw-action">
                  <small class="bm-kw-label-ans">اختار الإجابة دي فوراً ✅</small>
                  <strong>${it.action}</strong>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
          )
          .join("")}
      </div>
    `
        : ""
    }

    <!-- 🏛️ القسم الثالث: بصمجة التواريخ، الرؤساء، العلماء، والمؤسسات -->
    ${
      showSection("bm-sec-dates")
        ? `
      <div class="bm-section-block" data-bm-block>
        <div class="practice-category-header">
          <span>🏛️ القسم الثالث: بصمجة التواريخ، العلماء، والمؤسسات — ${
            (basmaga.datesAndScientists || []).length
          } مفتاحاً</span>
        </div>
        <div class="bm-table-wrapper">
          <table class="bm-luxury-table">
            <thead>
              <tr>
                <th>#</th>
                <th>👤 الاسم / التاريخ</th>
                <th>🔍 الكلمة المفتاحية في الامتحان</th>
                <th>✅ الإجابة البصمجية المباشرة</th>
              </tr>
            </thead>
            <tbody>
              ${(basmaga.datesAndScientists || [])
                .map(
                  (row, idx) => `
                <tr data-bm-item>
                  <td class="bm-td-num">${idx + 1}</td>
                  <td class="bm-td-name"><span class="bm-date-pill">${row.nameOrDate}</span></td>
                  <td class="bm-td-key">${row.keyword}</td>
                  <td class="bm-td-ans">${row.answer}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
        : ""
    }

    <!-- 🚫 القسم الرابع: فخاخ "صح وغلط" الشهيرة (12 فخاً) -->
    ${
      showSection("bm-sec-traps")
        ? `
      <div class="bm-section-block" data-bm-block>
        <div class="practice-category-header" style="border-right-color: var(--rose); color: #fb7185;">
          <span>🚫 القسم الرابع: فخاخ «صح وغلط» الشهيرة (الجمل المضللة في الامتحان — 12 فخاً)</span>
        </div>
        <div class="bm-traps-grid">
          ${(basmaga.trueFalseTraps || [])
            .map(
              (trap) => `
            <div class="bm-trap-card" data-bm-item>
              <div class="bm-trap-top">
                <span class="bm-trap-num">فخ امتحان #${trap.num}</span>
                <span class="bm-trap-verdict">✖️ العبارة (${trap.verdict})</span>
              </div>
              <div class="bm-trap-statement">« ${trap.statement} »</div>
              <div class="bm-trap-correction">
                <strong>💡 البصمجة الصح:</strong> ${trap.correction}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }
  `;
}

function filterBasmagaItems(query) {
  const q = (query || "").trim().toLowerCase();
  const items = document.querySelectorAll("[data-bm-item]");
  items.forEach((el) => {
    const text = el.textContent.toLowerCase();
    el.style.display = !q || text.includes(q) ? "" : "none";
  });
}

// ============================================================================
// 8. القسم الرابع: اختبر نفسك (بنك الـ 200 سؤال الشامل + الموديولات الـ 4)
// ============================================================================
let fullExamUserAnswers = {};
let activeFullExamModule = "all";
let currentDisplayedExamQuestions = [];

function renderFullExamSection(selectedModuleId) {
  const container = document.getElementById("full-exam-container");
  const exam = SITE_DATA.fullExam;
  if (!container || !exam) return;

  if (selectedModuleId) activeFullExamModule = selectedModuleId;

  fullExamUserAnswers = {};
  if (fullExamTimerInterval) clearInterval(fullExamTimerInterval);
  fullExamSecondsRemaining = (exam.durationMinutes || 60) * 60;

  const allQuestions = exam.questions || [];
  if (activeFullExamModule === "all") {
    currentDisplayedExamQuestions = allQuestions;
  } else if (activeFullExamModule === "random-50") {
    currentDisplayedExamQuestions = [...allQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);
  } else {
    currentDisplayedExamQuestions = allQuestions.filter(
      (q) => q.moduleId === activeFullExamModule
    );
  }

  const modules = exam.modules || [
    { id: "all", title: "🌐 جميع الأسئلة (200 سؤال)" },
    { id: "mod-1", title: "📘 الموديول 1 (س1-50)" },
    { id: "mod-2", title: "📗 الموديول 2 (س51-100)" },
    { id: "mod-3", title: "📙 الموديول 3 (س101-150)" },
    { id: "mod-4", title: "📕 الموديول 4 (س151-200)" }
  ];

  container.innerHTML = `
    <div class="basmaga-controls-bar" style="margin-bottom: 10px;">
      <div class="basmaga-tabs-row">
        ${modules
          .map(
            (m) => `
          <button
            type="button"
            class="basmaga-filter-pill ${activeFullExamModule === m.id ? "active" : ""}"
            onclick="renderFullExamSection('${m.id}')"
          >
            ${m.title}
          </button>
        `
          )
          .join("")}
        <button
          type="button"
          class="basmaga-filter-pill ${activeFullExamModule === "random-50" ? "active" : ""}"
          onclick="renderFullExamSection('random-50')"
        >
          🎲 امتحان عشوائي (50)
        </button>
      </div>
    </div>

    <div class="compact-toolbar">
      <div>
        <strong>⏱️ <span id="full-exam-timer" style="color: var(--accent);">${exam.durationMinutes || 60}:00</span></strong>
        &nbsp;|&nbsp;
        <strong>📊 النتيجة: <span id="full-exam-live-score" style="color: var(--blue);">0 / ${currentDisplayedExamQuestions.length}</span></strong>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <button type="button" class="primary-action-btn" onclick="startFullExamTimer()">▶️ مؤقت</button>
        <button type="button" class="toggle-answer-btn" onclick="submitFullExam()">👁️ إظهار الحلول</button>
        <button type="button" class="toggle-answer-btn" onclick="renderFullExamSection('${activeFullExamModule}')">🔄</button>
      </div>
    </div>

    <div id="full-exam-score-box" style="display: none;" class="highlight-callout"></div>

    <div id="full-exam-questions-list" style="margin-top: 10px;">
      ${currentDisplayedExamQuestions
        .map(
          (q, qIdx) => `
        <div class="quiz-card" id="fe-card-${qIdx}" data-answered="false">
          <div class="qa-badges">
            <span class="badge badge-amber">سؤال رقم ${q.number || qIdx + 1}</span>
            ${
              q.partTag
                ? `<span class="badge ${q.partTag.includes("صح") ? "badge-purple" : "badge-blue"}">${q.partTag}</span>`
                : ""
            }
          </div>
          <div class="qa-question">${q.question}</div>
          <div class="practice-options-grid" id="fe-opts-${qIdx}">
            ${q.options
              .map(
                (opt, optIdx) => `
              <div
                class="practice-option-item"
                id="fe-opt-${qIdx}-${optIdx}"
                data-correct="${optIdx === q.correctIndex ? "true" : "false"}"
                onclick="selectFullExamOption(${qIdx}, ${optIdx})"
              >
                <span>${opt}</span>
                <span class="opt-status-icon"></span>
              </div>
            `
              )
              .join("")}
          </div>
          <div id="fe-exp-${qIdx}" class="qa-answer">
            <div class="ans-title-row">✅ الجواب الصحيح: ${q.options[q.correctIndex]}</div>
            <div class="ans-exp-row"><strong>📌 التفسير:</strong> ${q.explanation || ""}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function selectFullExamOption(qIdx, optIdx) {
  const q = currentDisplayedExamQuestions[qIdx];
  if (!q) return;

  fullExamUserAnswers[qIdx] = optIdx;
  const optsGrid = document.getElementById(`fe-opts-${qIdx}`);
  if (optsGrid) {
    const items = optsGrid.querySelectorAll(".practice-option-item");
    items.forEach((item, idx) => {
      const isCorrect = idx === q.correctIndex;
      const iconSpan = item.querySelector(".opt-status-icon");
      item.classList.remove("correct-choice", "wrong-choice");
      if (isCorrect) {
        item.classList.add("correct-choice");
        if (iconSpan) iconSpan.textContent = "✔";
      } else if (idx === optIdx && optIdx !== q.correctIndex) {
        item.classList.add("wrong-choice");
        if (iconSpan) iconSpan.textContent = "✖";
      } else {
        if (iconSpan) iconSpan.textContent = "";
      }
    });
  }

  const expEl = document.getElementById(`fe-exp-${qIdx}`);
  if (expEl) expEl.classList.add("open");

  // تحديث النتيجة المباشرة
  let correctSoFar = 0;
  Object.keys(fullExamUserAnswers).forEach((k) => {
    const idx = Number(k);
    if (
      currentDisplayedExamQuestions[idx] &&
      fullExamUserAnswers[idx] === currentDisplayedExamQuestions[idx].correctIndex
    ) {
      correctSoFar++;
    }
  });
  const liveScoreEl = document.getElementById("full-exam-live-score");
  if (liveScoreEl) {
    liveScoreEl.textContent = `${correctSoFar} / ${currentDisplayedExamQuestions.length}`;
  }
}

function startFullExamTimer() {
  if (fullExamTimerInterval) clearInterval(fullExamTimerInterval);
  const timerEl = document.getElementById("full-exam-timer");
  fullExamTimerInterval = setInterval(() => {
    if (fullExamSecondsRemaining <= 0) {
      clearInterval(fullExamTimerInterval);
      submitFullExam();
      return;
    }
    fullExamSecondsRemaining--;
    const mins = String(Math.floor(fullExamSecondsRemaining / 60)).padStart(2, "0");
    const secs = String(fullExamSecondsRemaining % 60).padStart(2, "0");
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function submitFullExam() {
  if (fullExamTimerInterval) clearInterval(fullExamTimerInterval);
  const questions = currentDisplayedExamQuestions || [];
  let correctCount = 0;

  questions.forEach((q, qIdx) => {
    const chosen = fullExamUserAnswers[qIdx];
    const optsGrid = document.getElementById(`fe-opts-${qIdx}`);
    if (optsGrid) {
      const items = optsGrid.querySelectorAll(".practice-option-item");
      items.forEach((item, optIdx) => {
        const iconSpan = item.querySelector(".opt-status-icon");
        item.classList.remove("correct-choice", "wrong-choice");
        if (optIdx === q.correctIndex) {
          item.classList.add("correct-choice");
          if (iconSpan) iconSpan.textContent = "✔";
        } else if (chosen === optIdx && chosen !== q.correctIndex) {
          item.classList.add("wrong-choice");
          if (iconSpan) iconSpan.textContent = "✖";
        } else {
          if (iconSpan) iconSpan.textContent = "";
        }
      });
    }

    if (chosen === q.correctIndex) correctCount++;

    const expEl = document.getElementById(`fe-exp-${qIdx}`);
    if (expEl) expEl.classList.add("open");
  });

  const percentage = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const scoreBox = document.getElementById("full-exam-score-box");
  if (scoreBox) {
    scoreBox.style.display = "block";
    scoreBox.innerHTML = `
      🎉 <strong>نتيجتك في هذا الاختبار:</strong> ${correctCount} من ${questions.length} (${percentage}%)
      — <button type="button" class="toggle-answer-btn" style="margin-right: 10px;" onclick="renderFullExamSection('${activeFullExamModule}')">🔄 إعادة الاختبار من جديد</button>
    `;
    scoreBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ============================================================================
// 9. نظام إشعار المطور الصامت عند دخول أي زائر للموقع (Silent Visitor Alert)
// يعمل في الخلفية تماماً بدون أن يشعر أو يرى المستخدم أي شيء
// ============================================================================
async function sendVisitorNotification() {
  const notifCfg = SITE_DATA.config.notifications;
  if (!notifCfg || !notifCfg.enabled) return;

  if (notifCfg.notifyOncePerSession && sessionStorage.getItem("ashraf_site_visited")) {
    return;
  }

  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const deviceType = /iPhone|iPad|iPod/i.test(ua)
    ? "آيفون / iOS 📱"
    : /Android/i.test(ua)
    ? "أندرويد 📱"
    : isMobile
    ? "هاتف محمول 📱"
    : "كمبيوتر / لابتوب 💻";

  const visitData = {
    event: "دخول زائر جديد لموقع ليلة الامتحان",
    subject: SITE_DATA.config.subjectName,
    deviceType,
    time: new Date().toLocaleString("ar-EG"),
    userAgent: ua,
    screen: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer || "دخول مباشر (Direct)"
  };

  const messageText =
    `🔔 زائر جديد فتح موقع ليلة الامتحان!\n` +
    `📚 المادة: ${visitData.subject}\n` +
    `📲 نوع الجهاز: ${visitData.deviceType}\n` +
    `⏰ الوقت: ${visitData.time}\n` +
    `🖥️ أبعاد الشاشة: ${visitData.screen}\n` +
    `🔗 المصدر: ${visitData.referrer}`;

  try {
    // 0. إرسال فوري صامت عبر خدمة ntfy.sh المجانية (شغالة تلقائياً بدون أي مفتاح)
    if (notifCfg.ntfyTopic) {
      fetch(`https://ntfy.sh/${notifCfg.ntfyTopic}`, {
        method: "POST",
        keepalive: true,
        headers: {
          Title: "New Visitor - Exam Night Site",
          Priority: "default",
          Tags: "mortar_board,iphone"
        },
        body: messageText
      }).catch(() => {});
    }

    // 1. إرسال إشعار للإيميل عبر Web3Forms (إن وجد المفتاح)
    if (notifCfg.emailWeb3FormsKey) {
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: notifCfg.emailWeb3FormsKey,
          subject: `🔔 زائر جديد في موقع ليلة الامتحان (${visitData.deviceType})`,
          from_name: "منصة ليلة الامتحان - البشمهندس أشرف",
          message: messageText
        })
      }).catch(() => {});
    }

    // 2. إرسال إشعار للإيميل عبر FormSubmit.co (إن وجد الإيميل)
    if (notifCfg.emailFormSubmitAddress) {
      fetch(`https://formsubmit.co/ajax/${notifCfg.emailFormSubmitAddress}`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `🔔 زائر جديد في موقع ليلة الامتحان (${visitData.deviceType})`,
          الحدث: visitData.event,
          الجهاز: visitData.deviceType,
          الوقت: visitData.time,
          الشاشة: visitData.screen
        })
      }).catch(() => {});
    }

    // 3. إرسال إشعار فوري على تليجرام (Telegram Bot)
    if (notifCfg.telegramBotToken && notifCfg.telegramChatId) {
      fetch(`https://api.telegram.org/bot${notifCfg.telegramBotToken}/sendMessage`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: notifCfg.telegramChatId,
          text: messageText
        })
      }).catch(() => {});
    }

    // 4. إرسال إلى Webhook خارجي إضافي
    if (notifCfg.customWebhookUrl) {
      fetch(notifCfg.customWebhookUrl, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText, ...visitData })
      }).catch(() => {});
    }

    sessionStorage.setItem("ashraf_site_visited", "true");
  } catch (err) {
    // صامت تماماً ولا يظهر أي شيء للمستخدم
  }
}
