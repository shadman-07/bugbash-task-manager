"use strict";

const STORAGE_KEY = "bug-bash-arena-tasks";

const form = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("taskPriority");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const themeToggle = document.getElementById("themeToggle");

const columns = {
  todo: document.getElementById("todoList"),
  progress: document.getElementById("progressList"),
  done: document.getElementById("doneList")
};

const statusLabels = {
  todo: "To Do",
  progress: "In Progress",
  done: "Completed"
};

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      ["todo", "progress", "done"].includes(task.status) &&
      ["low", "medium", "high"].includes(task.priority)
    ) : [];
  } catch {
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    alert("Tasks could not be saved in this browser.");
  }
}

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

document.getElementById("todayDate").textContent =
  formatDate(new Date());

function addTask(title, priority) {
  tasks.unshift({
    id: createId(),
    title,
    priority,
    status: "todo",
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    taskInput.focus();
    return;
  }

  addTask(title, priorityInput.value);
  taskInput.value = "";
  priorityInput.value = "medium";
  taskInput.focus();
});

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function createTaskCard(task) {
  const card = createElement(
    "article",
    `task-card ${task.status === "done" ? "completed" : ""}`
  );

  const top = createElement("div", "task-top");
  const title = createElement("span", "task-title", task.title);
  const actions = createElement("div", "task-actions");

  const deleteButton = createElement("button", "", "×");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  deleteButton.title = "Delete task";

  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
  });

  actions.append(deleteButton);
  top.append(title, actions);

  const meta = createElement("div", "task-meta");
  const date = createElement(
    "span",
    "",
    formatDate(new Date(task.createdAt))
  );

  const priority = createElement(
    "span",
    `priority priority-${task.priority}`,
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
  );

  meta.append(date, priority);

  const status = document.createElement("select");
  status.className = "status-select";
  status.setAttribute("aria-label", `Status for ${task.title}`);

  Object.entries(statusLabels).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === task.status;
    status.append(option);
  });

  status.addEventListener("change", () => {
    task.status = status.value;
    saveTasks();
    renderTasks();
  });

  card.append(top, meta, status);

  return card;
}

function renderTasks() {
  Object.values(columns).forEach(column => {
    column.replaceChildren();
  });

  const query = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;

  const visibleTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query);
    const matchesFilter = filter === "all" || task.status === filter;

    return matchesSearch && matchesFilter;
  });

  Object.keys(columns).forEach(status => {
    const list = columns[status];
    const group = visibleTasks.filter(task => task.status === status);

    document.getElementById(
      status === "todo" ? "todoCount" :
      status === "progress" ? "columnProgressCount" :
      "columnDoneCount"
    ).textContent = tasks.filter(task => task.status === status).length;

    if (group.length === 0) {
      list.append(createElement(
        "p",
        "empty-state",
        query || filter !== "all"
          ? "No matching tasks."
          : "Nothing here yet. Add a task!"
      ));
      return;
    }

    group.forEach(task => list.append(createTaskCard(task)));
  });

  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === "progress").length;
  const completed = tasks.filter(t => t.status === "done").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("progressCount").textContent = inProgress;
  document.getElementById("doneCount").textContent = completed;
  document.getElementById("completionRate").textContent = `${rate}%`;

  const message = total === 0
    ? "Ready to make progress? Add your first task!"
    : completed === total
      ? "Amazing! All your tasks are completed."
      : `${completed} of ${total} tasks completed. Keep going!`;

  document.getElementById("progressMessage").textContent = message;
}

searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);

document.getElementById("clearCompleted").addEventListener("click", () => {
  const completed = tasks.filter(task => task.status === "done").length;

  if (completed === 0) {
    alert("There are no completed tasks to clear.");
    return;
  }

  if (!confirm(`Delete ${completed} completed task(s)?`)) return;

  tasks = tasks.filter(task => task.status !== "done");
  saveTasks();
  renderTasks();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const lightMode = document.body.classList.contains("light");

  themeToggle.textContent = lightMode ? "☾" : "☼";
  themeToggle.setAttribute(
    "aria-label",
    lightMode ? "Switch to dark theme" : "Switch to light theme"
  );
});

renderTasks();
