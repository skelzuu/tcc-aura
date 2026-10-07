const habitList = document.getElementById("habitList");

const completedElement =
    document.getElementById("completed");

const totalHabitsElement =
    document.getElementById("totalHabits");

const percentageElement =
    document.getElementById("percentage");

const circlePercentageElement =
    document.getElementById("circlePercentage");

const currentDateElement =
    document.getElementById("currentDate");


// ==============================
// DATA ATUAL
// ==============================

const today = new Date();

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
});

currentDateElement.textContent =
    dateFormatter.format(today);


// ==============================
// IDENTIFICAR O DIA
// ==============================

function getTodayKey() {

    const year = today.getFullYear();

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const day =
        String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==============================
// PEGAR HÁBITOS
// ==============================

function getHabits() {

    const habits =
        localStorage.getItem("persistanceHabits");

    if (!habits) {
        return [];
    }

    return JSON.parse(habits);
}


// ==============================
// PEGAR CONCLUSÕES
// ==============================

function getCompletions() {

    const completions =
        localStorage.getItem("persistanceCompletions");

    if (!completions) {
        return {};
    }

    return JSON.parse(completions);
}


// ==============================
// SALVAR CONCLUSÕES
// ==============================

function saveCompletions(completions) {

    localStorage.setItem(
        "persistanceCompletions",
        JSON.stringify(completions)
    );
}


// ==============================
// MOSTRAR HÁBITOS
// ==============================

function renderHabits() {

    const habits = getHabits();

    const completions = getCompletions();

    const todayKey = getTodayKey();

    habitList.innerHTML = "";


    if (habits.length === 0) {

        habitList.innerHTML = `
            <div class="empty-habits">

                <h3>
                    Você ainda não possui hábitos.
                </h3>

                <p>
                    Crie seu primeiro hábito para
                    começar a acompanhar sua rotina.
                </p>

            </div>
        `;

        updateProgress();

        return;
    }


    habits.forEach(function (habit) {

        const habitElement =
            document.createElement("label");

        habitElement.classList.add("habit-item");


        const isCompleted =
            completions[todayKey]?.includes(habit.id);


        habitElement.innerHTML = `

            <input
                type="checkbox"
                data-id="${habit.id}"
                ${isCompleted ? "checked" : ""}
            >

            <span class="custom-check">
                ✓
            </span>

            <div class="habit-content">

                <strong>
                    ${habit.name}
                </strong>

                <small>
                    ${habit.category} • ${habit.frequency}
                </small>

            </div>

        `;

        habitList.appendChild(habitElement);

    });


    addCheckboxEvents();

    updateProgress();
}


// ==============================
// CHECKBOX
// ==============================

function addCheckboxEvents() {

    const checkboxes =
        document.querySelectorAll(
            ".habit-item input[type='checkbox']"
        );


    checkboxes.forEach(function (checkbox) {

        checkbox.addEventListener(
            "change",
            function () {

                const habitId =
                    Number(checkbox.dataset.id);

                const todayKey =
                    getTodayKey();

                const completions =
                    getCompletions();


                if (!completions[todayKey]) {

                    completions[todayKey] = [];

                }


                if (checkbox.checked) {

                    if (
                        !completions[todayKey].includes(habitId)
                    ) {

                        completions[todayKey].push(habitId);

                    }

                } else {

                    completions[todayKey] =
                        completions[todayKey].filter(
                            function (id) {
                                return id !== habitId;
                            }
                        );

                }


                saveCompletions(completions);

                updateProgress();

            }
        );

    });
}


// ==============================
// ATUALIZAR PROGRESSO
// ==============================

function updateProgress() {

    const checkboxes =
        document.querySelectorAll(
            ".habit-item input[type='checkbox']"
        );

    const total =
        checkboxes.length;

    let completed = 0;


    checkboxes.forEach(function (checkbox) {

        if (checkbox.checked) {

            completed++;

        }

    });


    let percentage = 0;


    if (total > 0) {

        percentage =
            Math.round(
                (completed / total) * 100
            );

    }


    completedElement.textContent =
        completed;

    totalHabitsElement.textContent =
        total;

    percentageElement.textContent =
        percentage + "%";

    circlePercentageElement.textContent =
        percentage + "%";


    const circle =
        document.querySelector(
            ".circle-progress"
        );


    if (circle) {

        circle.style.background =
            `conic-gradient(
                #2f5fa7 ${percentage}%,
                #e7eaf0 ${percentage}%
            )`;

    }
}


// ==============================
// INICIAR
// ==============================

renderHabits();