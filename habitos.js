const habitForm = document.getElementById("habitForm");

const habitFormContainer =
    document.getElementById("habitFormContainer");

const openHabitForm =
    document.getElementById("openHabitForm");

const closeHabitForm =
    document.getElementById("closeHabitForm");

const habitList =
    document.getElementById("habitList");

const habitCount =
    document.getElementById("habitCount");

const habitName =
    document.getElementById("habitName");

const habitCategory =
    document.getElementById("habitCategory");

const habitFrequency =
    document.getElementById("habitFrequency");


/* =========================================
   ABRIR FORMULÁRIO
   ========================================= */

openHabitForm.addEventListener("click", function () {

    habitFormContainer.classList.add("show");

    habitName.focus();

});


/* =========================================
   FECHAR FORMULÁRIO
   ========================================= */

closeHabitForm.addEventListener("click", function () {

    habitFormContainer.classList.remove("show");

});


/* =========================================
   PEGAR HÁBITOS SALVOS
   ========================================= */

function getHabits() {

    const habits =
        localStorage.getItem("persistanceHabits");

    if (!habits) {
        return [];
    }

    return JSON.parse(habits);
}


/* =========================================
   SALVAR HÁBITOS
   ========================================= */

function saveHabits(habits) {

    localStorage.setItem(
        "persistanceHabits",
        JSON.stringify(habits)
    );

}


/* =========================================
   MOSTRAR HÁBITOS
   ========================================= */

function renderHabits() {

    const habits = getHabits();

    habitList.innerHTML = "";


    if (habits.length === 0) {

        habitList.innerHTML = `
            <div class="empty-habits">
                <h3>Você ainda não possui hábitos.</h3>

                <p>
                    Comece criando um pequeno objetivo
                    para fazer parte da sua rotina.
                </p>
            </div>
        `;

        habitCount.textContent =
            "0 hábitos cadastrados";

        return;
    }


    habits.forEach(function (habit) {

        const habitElement =
            document.createElement("div");

        habitElement.classList.add("habit-item");


        habitElement.innerHTML = `

            <div class="custom-check">
                ✓
            </div>

            <div class="habit-content">

                <strong>
                    ${habit.name}
                </strong>

                <small>
                    ${habit.category} • ${habit.frequency}
                </small>

            </div>

            <button
                class="delete-habit"
                data-id="${habit.id}"
            >
                Excluir
            </button>

        `;


        habitList.appendChild(habitElement);

    });


    habitCount.textContent =
        habits.length === 1
            ? "1 hábito cadastrado"
            : `${habits.length} hábitos cadastrados`;


    addDeleteEvents();

}


/* =========================================
   EXCLUIR HÁBITO
   ========================================= */

function addDeleteEvents() {

    const deleteButtons =
        document.querySelectorAll(".delete-habit");


    deleteButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const id =
                    Number(button.dataset.id);

                let habits = getHabits();

                habits = habits.filter(function (habit) {

                    return habit.id !== id;

                });


                saveHabits(habits);

                renderHabits();

            }
        );

    });

}


/* =========================================
   CRIAR HÁBITO
   ========================================= */

habitForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const newHabit = {

            id: Date.now(),

            name: habitName.value,

            category: habitCategory.value,

            frequency: habitFrequency.value

        };


        const habits = getHabits();


        habits.push(newHabit);


        saveHabits(habits);


        habitForm.reset();

        habitFormContainer.classList.remove("show");


        renderHabits();

    }
);


/* =========================================
   INICIAR
   ========================================= */

renderHabits();