const habits = JSON.parse(
    localStorage.getItem("persistanceHabits") || "[]"
);

const completions = JSON.parse(
    localStorage.getItem("persistanceCompletions") || "{}"
);

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getLastSevenDays() {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - i
        );

        days.push({
            key: dateKey(date),
            label: date.toLocaleDateString("pt-BR", {
                weekday: "short"
            }).replace(".", "")
        });
    }

    return days;
}

const days = getLastSevenDays();
const todayKey = dateKey(new Date());

const todayCompletions = completions[todayKey] || [];

const todayCompleted = habits.filter(habit =>
    todayCompletions.includes(habit.id)
).length;

const todayRate = habits.length
    ? Math.round((todayCompleted / habits.length) * 100)
    : 0;

document.getElementById("todayRate").textContent =
    `${todayRate}%`;

document.getElementById("todayDetail").textContent =
    `${todayCompleted} de ${habits.length} hábitos concluídos`;

const weeklyTotal = days.reduce((total, day) => {
    const completedIds = completions[day.key] || [];
    return total + completedIds.length;
}, 0);

document.getElementById("weekCompleted").textContent =
    weeklyTotal;

// Gráfico semanal
const weeklyChart = document.getElementById("weeklyChart");

const dailyCounts = days.map(day => ({
    ...day,
    count: (completions[day.key] || []).length
}));

const maxCount = Math.max(
    1,
    ...dailyCounts.map(day => day.count)
);

dailyCounts.forEach(day => {
    const column = document.createElement("div");
    column.className = "chart-column";

    const value = document.createElement("span");
    value.className = "chart-value";
    value.textContent = day.count;

    const track = document.createElement("div");
    track.className = "chart-track";

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${(day.count / maxCount) * 100}%`;

    if (day.count > 0) {
        bar.title = `${day.count} conclusão(ões)`;
    }

    track.appendChild(bar);

    const label = document.createElement("span");
    label.className = "chart-label";
    label.textContent = day.label;

    column.append(value, track, label);
    weeklyChart.appendChild(column);
});

// Desempenho individual
const habitPerformance = document.getElementById("habitPerformance");

if (habits.length === 0) {
    habitPerformance.textContent =
        "Você ainda não cadastrou hábitos. Crie seu primeiro hábito para acompanhar seu desempenho.";

    habitPerformance.className = "stats-empty";
} else {
    const results = habits.map(habit => {
        let scheduledDays = 0;
        let completedDays = 0;

        days.forEach(day => {
            const date = new Date(`${day.key}T12:00:00`);
            const weekday = date.getDay();

            let scheduled = true;

            if (habit.frequency === "Segunda a sexta") {
                scheduled = weekday >= 1 && weekday <= 5;
            } else if (habit.frequency === "3x por semana") {
                scheduled = [1, 3, 5].includes(weekday);
            } else if (habit.frequency === "2x por semana") {
                scheduled = [2, 5].includes(weekday);
            }

            if (scheduled) {
                scheduledDays++;

                if ((completions[day.key] || []).includes(habit.id)) {
                    completedDays++;
                }
            }
        });

        const rate = scheduledDays
            ? Math.round((completedDays / scheduledDays) * 100)
            : 0;

        return { habit, completedDays, scheduledDays, rate };
    });

    results.sort((a, b) => b.rate - a.rate);

    results.forEach(result => {
        const item = document.createElement("div");
        item.className = "performance-item";

        const info = document.createElement("div");
        info.className = "performance-info";

        const name = document.createElement("strong");
        name.textContent = result.habit.name;

        const detail = document.createElement("span");
        detail.textContent =
            `${result.completedDays} de ${result.scheduledDays} dias previstos`;

        info.append(name, detail);

        const rate = document.createElement("strong");
        rate.className = "performance-rate";
        rate.textContent = `${result.rate}%`;

        const track = document.createElement("div");
        track.className = "performance-track";

        const bar = document.createElement("div");
        bar.className = "performance-bar";
        bar.style.width = `${result.rate}%`;

        track.appendChild(bar);
        item.append(info, rate, track);
        habitPerformance.appendChild(item);
    });

    if (results.length > 0 && results[0].completedDays > 0) {
        document.getElementById("bestHabit").textContent =
            results[0].habit.name;

        document.getElementById("bestHabitDetail").textContent =
            `${results[0].rate}% de conclusão na semana`;
    }
}