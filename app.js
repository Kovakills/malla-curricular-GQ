// Application state
let subjectStatuses = {}
let currentSemester = 1
const curriculumData = {} // Declare curriculumData variable

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadProgress()
  initializeTabs()
  showSemester(1)
  updateProgress()
})

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem("curriculum-progress")
  if (saved) {
    subjectStatuses = JSON.parse(saved)
  }
}

// Save progress to localStorage
function saveProgress() {
  localStorage.setItem("curriculum-progress", JSON.stringify(subjectStatuses))
}

// Initialize semester tabs
function initializeTabs() {
  const tabsList = document.getElementById("tabsList")
  tabsList.innerHTML = ""

  curriculumData.semesters.forEach((semester) => {
    const button = document.createElement("button")
    button.className = "tab-button"
    button.textContent = `Sem ${semester.level}`
    button.onclick = () => showSemester(semester.level)

    if (semester.level === currentSemester) {
      button.classList.add("active")
    }

    tabsList.appendChild(button)
  })
}

// Show specific semester content
function showSemester(semesterLevel) {
  currentSemester = semesterLevel

  // Update active tab
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active")
  })
  document.querySelectorAll(".tab-button")[semesterLevel - 1].classList.add("active")

  // Find semester data
  const semester = curriculumData.semesters.find((s) => s.level === semesterLevel)
  if (!semester) return

  // Generate semester content
  const content = document.getElementById("semesterContent")
  content.innerHTML = `
        <div class="semester-header">
            <h2>Semestre ${semester.level}</h2>
            <p class="semester-info">
                ${semester.subjects.length} materias • 
                ${semester.subjects.reduce((acc, s) => acc + s.credits, 0)} créditos
            </p>
        </div>
        <div class="subjects-grid">
            ${semester.subjects.map((subject) => createSubjectCard(subject)).join("")}
        </div>
    `

  // Add click listeners to subject cards
  document.querySelectorAll(".subject-card").forEach((card) => {
    const subjectCode = card.dataset.code
    const subject = semester.subjects.find((s) => s.code === subjectCode)

    card.addEventListener("click", () => {
      const status = getSubjectStatus(subject)
      if (status !== "locked") {
        toggleSubjectStatus(subjectCode)
      }
    })
  })
}

// Create subject card HTML
function createSubjectCard(subject) {
  const status = getSubjectStatus(subject)
  const icon = getStatusIcon(status)

  return `
        <div class="subject-card ${status}" data-code="${subject.code}">
            <div class="subject-header">
                <div class="subject-info">
                    <div class="subject-name">${subject.name}</div>
                    <div class="subject-meta">
                        <span>${subject.credits} créditos</span>
                        ${subject.type === "Electiva" ? '<span class="badge">Electiva</span>' : ""}
                    </div>
                </div>
                ${icon}
            </div>
            ${
              subject.prerequisites && subject.prerequisites.length > 0
                ? `
                <div class="prerequisites">
                    <div class="prerequisites-label">Prerrequisitos:</div>
                    <div class="prerequisites-list">
                        ${subject.prerequisites
                          .map(
                            (prereq) => `
                            <span class="prerequisite-badge">${prereq}</span>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `
}

// Get status icon HTML
function getStatusIcon(status) {
  const icons = {
    approved: `<svg class="icon approved" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
        </svg>`,
    current: `<svg class="icon current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
        </svg>`,
    available: `<svg class="icon available" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>`,
    locked: `<svg class="icon locked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <circle cx="12" cy="7" r="4"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>`,
  }

  return icons[status] || icons.available
}

// Check if subject is available based on prerequisites
function isSubjectAvailable(subject) {
  if (!subject.prerequisites || subject.prerequisites.length === 0) {
    return true
  }

  return subject.prerequisites.every((prereq) => {
    if (prereq === "Nivel IV" || prereq === "Nivel VIII") {
      // Check if all subjects from that level are approved
      const levelNumber = prereq === "Nivel IV" ? 4 : 8
      const levelSemester = curriculumData.semesters.find((s) => s.level === levelNumber)
      if (!levelSemester) return false

      return levelSemester.subjects.every((s) => subjectStatuses[s.code] === "approved")
    }
    return subjectStatuses[prereq] === "approved"
  })
}

// Get current status of a subject
function getSubjectStatus(subject) {
  const status = subjectStatuses[subject.code]
  if (status) return status
  return isSubjectAvailable(subject) ? "available" : "locked"
}

// Toggle subject status
function toggleSubjectStatus(subjectCode) {
  const currentStatus = subjectStatuses[subjectCode] || "available"

  let nextStatus
  switch (currentStatus) {
    case "available":
      nextStatus = "current"
      break
    case "current":
      nextStatus = "approved"
      break
    case "approved":
      nextStatus = "available"
      break
    default:
      nextStatus = "available"
  }

  subjectStatuses[subjectCode] = nextStatus
  saveProgress()
  showSemester(currentSemester) // Refresh current view
  updateProgress()
}

// Update progress bar
function updateProgress() {
  const totalSubjects = curriculumData.semesters.reduce((acc, sem) => acc + sem.subjects.length, 0)
  const approvedSubjects = Object.values(subjectStatuses).filter((status) => status === "approved").length
  const progress = Math.round((approvedSubjects / totalSubjects) * 100)

  // Update progress bar
  const progressFill = document.getElementById("progressFill")
  const progressPercentage = document.getElementById("progressPercentage")
  const progressText = document.getElementById("progressText")

  progressFill.style.width = `${progress}%`
  progressPercentage.textContent = `${progress}%`
  progressText.textContent = `${approvedSubjects} de ${totalSubjects} materias aprobadas`
}

// Service Worker registration for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful")
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err)
      })
  })
}
