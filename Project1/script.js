
/* Loads saved tasks or starts with an empty array */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

/* Stores the currently selected filter */
let currentFilter = "all";

/* Gets the form element */
const form = document.getElementById("task-form");

/* Gets the input element */
const input = document.getElementById("task-input");

/* Gets the task list element */
const taskList = document.getElementById("task-list");

/* Gets the statistics element */
const taskCount = document.getElementById("task-count");

/* Gets all filter buttons */
const filters = document.querySelectorAll(".filter");

/* Saves tasks and refreshes the display */
function saveTasks() {
    /* Stores the task array in browser storage */
    localStorage.setItem("tasks", JSON.stringify(tasks));

    /* Updates the displayed task list */
    renderTasks();
}

/* Adds a new task when the form is submitted */
form.addEventListener("submit", function (event) {
    /* Prevents the page from refreshing */
    event.preventDefault();

    /* Removes extra spaces from the input */
    const text = input.value.trim();

    /* Stops empty tasks from being added */
    if (text === "") return;

    /* Adds a new task object to the array */
    tasks.push({
        id: Date.now(),
        text: text,
        completed: false
    });

    /* Clears the input field */
    input.value = "";

    /* Saves and displays the updated tasks */
    saveTasks();
});

/* Displays tasks according to the selected filter */
function renderTasks() {
    /* Clears the old list content */
    taskList.innerHTML = "";

    /* Filters the tasks */
    const visibleTasks = tasks.filter(function (task) {
        /* Includes every task in the All view */
        if (currentFilter === "all") return true;

        /* Includes unfinished tasks in the Active view */
        if (currentFilter === "active") return !task.completed;

        /* Includes finished tasks in the Completed view */
        return task.completed;
    });

    /* Creates one list item for each visible task */
    visibleTasks.forEach(function (task) {
        /* Creates a list item element */
        const li = document.createElement("li");

        /* Assigns the task's CSS classes */
        li.className = task.completed ? "task completed" : "task";

        /* Creates the checkbox */
        const checkbox = document.createElement("input");

        /* Sets its type to checkbox */
        checkbox.type = "checkbox";

        /* Matches the checkbox to the task status */
        checkbox.checked = task.completed;

        /* Updates completion when clicked */
        checkbox.addEventListener("change", function () {
            /* Changes the task's completed status */
            task.completed = checkbox.checked;

            /* Saves the updated task */
            saveTasks();
        });

        /* Creates the task text element */
        const span = document.createElement("span");

        /* Displays the task text safely */
        span.textContent = task.text;

        /* Creates the edit button */
        const editButton = document.createElement("button");

        /* Sets the edit button label */
        editButton.textContent = "Edit";

        /* Edits the task when clicked */
        editButton.addEventListener("click", function () {
            /* Asks for the updated task text */
            const updatedText = prompt("Edit your task:", task.text);

            /* Checks that the user did not cancel */
            if (updatedText === null) return;

            /* Removes extra spaces */
            const cleanedText = updatedText.trim();

            /* Rejects an empty replacement */
            if (cleanedText === "") return;

            /* Updates the task text */
            task.text = cleanedText;

            /* Saves the updated task */
            saveTasks();
        });

        /* Creates the delete button */
        const deleteButton = document.createElement("button");

        /* Sets the delete button label */
        deleteButton.textContent = "Delete";

        /* Deletes the task when clicked */
        deleteButton.addEventListener("click", function () {
            /* Keeps every task except the selected one */
            tasks = tasks.filter(function (item) {
                /* Compares each task's ID */
                return item.id !== task.id;
            });

            /* Saves the updated task list */
            saveTasks();
        });

        /* Adds the checkbox to the row */
        li.appendChild(checkbox);

        /* Adds the task text to the row */
        li.appendChild(span);

        /* Adds the edit button to the row */
        li.appendChild(editButton);

        /* Adds the delete button to the row */
        li.appendChild(deleteButton);

        /* Adds the row to the task list */
        taskList.appendChild(li);
    });

    /* Counts completed tasks */
    const completed = tasks.filter(function (task) {
        /* Returns true for completed tasks */
        return task.completed;
    }).length;

    /* Counts unfinished tasks */
    const remaining = tasks.length - completed;

    /* Displays the task statistics */
    taskCount.textContent = completed + " completed | " + remaining + " remaining";
}

/* Changes the selected filter */
filters.forEach(function (button) {
    /* Listens for filter clicks */
    button.addEventListener("click", function () {
        /* Stores the selected filter name */
        currentFilter = button.dataset.filter;

        /* Removes the active class from every filter */
        filters.forEach(function (filter) {
            /* Removes the selected appearance */
            filter.classList.remove("active");
        });

        /* Highlights the selected filter */
        button.classList.add("active");

        /* Refreshes the displayed tasks */
        renderTasks();
    });
});

/* Clears all tasks after confirmation */
document.getElementById("clear-all").addEventListener("click", function () {
    /* Checks whether the user confirms deletion */
    if (!confirm("Delete all tasks?")) return;

    /* Empties the task array */
    tasks = [];

    /* Saves the empty list */
    saveTasks();
});

/* Displays saved tasks when the page opens */
renderTasks();
