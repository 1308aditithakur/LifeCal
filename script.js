let calendar;
let barChart;

function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
  // 🌦️ Weather
  fetchWeather();

  function fetchWeather() {
    const weatherDiv = document.getElementById('weather');
    const city = "Bengaluru";
    const apiKey = "your_key";

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        const temp = Math.round(data.main.temp);
        const condition = data.weather[0].main;
        const emojiMap = {
          Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Thunderstorm: "⛈️",
          Drizzle: "🌦️", Snow: "❄️", Mist: "🌫️"
        };
        const emoji = emojiMap[condition] || "🌤️";
        weatherDiv.textContent = `📍 ${city} – ${temp}°C ${emoji} ${condition}`;
      })
      .catch(() => weatherDiv.textContent = "⚠️ Couldn't fetch weather.");
  }

  const allDayToggle = document.getElementById('allDayToggle');
  const timeInput = document.getElementById('eventTime');
  allDayToggle.addEventListener('change', () => {
    timeInput.classList.toggle('hidden', allDayToggle.checked);
  });

  const calendarEl = document.getElementById('calendar-container');
  const openModalBtn = document.getElementById('addEventBtn');
  const modal = document.getElementById('eventModal');
  const closeModalBtn = document.getElementById('closeModal');
  const saveEventBtn = document.getElementById('saveEvent');
  const titleInput = document.getElementById('eventTitle');
  const dateInput = document.getElementById('eventDate');
  const repeatSelect = document.getElementById('repeatOption');
  const categorySelect = document.getElementById('eventCategory');
  const toast = document.getElementById('toast');
  const modeSwitch = document.getElementById('modeSwitch');
    // 🌙 Dark Mode
  if (localStorage.getItem('lifeCalTheme') === 'dark') {
    document.body.classList.add('dark');
    modeSwitch.checked = true;
  }
  modeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('lifeCalTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: JSON.parse(localStorage.getItem('lifeCalEvents')) || [],
    eventClick(info) {
      const event = info.event;
      if (event.title.toLowerCase().includes('birthday')) triggerConfetti();

      const action = confirm(`Edit event: "${event.title}"?\nPress Cancel to delete.`);
      if (action) {
        titleInput.value = event.title.replace(/ [^ ]+$/, '');
        dateInput.value = event.startStr;
        repeatSelect.value = 'none';
        categorySelect.value = 'general';
        modal.classList.add('show');

        saveEventBtn.onclick = () => {
          const newTitle = titleInput.value.trim();
          const newDate = dateInput.value;
          const newCategory = categorySelect.value;
          if (!newTitle || !newDate) return alert('Please enter both title and date.');

          event.remove();
          let stored = JSON.parse(localStorage.getItem('lifeCalEvents')) || [];
          stored = stored.filter(e => e.title !== event.title || e.start !== event.startStr);

          const emoji = getEmoji(newTitle);
          const updatedEvent = {
            title: `${newTitle} ${emoji}`,
            start: newDate,
            allDay: true,
            classNames: [`event-${newCategory}`]
          };

          calendar.addEvent(updatedEvent);
          stored.push(updatedEvent);
          localStorage.setItem('lifeCalEvents', JSON.stringify(stored));

          showToast("✅ Event updated!");
          modal.classList.remove('show');
          resetForm();
          resetSaveButton();
          renderTodayEvents();
        };
      } else {
        info.event.remove();
        let stored = JSON.parse(localStorage.getItem('lifeCalEvents')) || [];
        stored = stored.filter(e => e.title !== info.event.title || e.start !== info.event.startStr);
        localStorage.setItem('lifeCalEvents', JSON.stringify(stored));
        showToast("🗑️ Event deleted");
        renderTodayEvents();
      }
    }
  });

  calendar.render();
  renderTodayEvents();
  resetSaveButton();
  openModalBtn.addEventListener('click', () => modal.classList.add('show'));
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    resetForm();
    resetSaveButton();
  });
    function resetSaveButton() {
    saveEventBtn.onclick = () => {
      const title = titleInput.value.trim();
      const date = dateInput.value;
      const time = timeInput.value;
      const isAllDay = allDayToggle.checked;
      const repeat = repeatSelect.value;
      const category = categorySelect.value;
      if (!title || !date) return alert('Please enter both a title and a date.');

      if (title.toLowerCase().includes('birthday')) triggerConfetti();
      const emoji = getEmoji(title);
      let startDateTime = isAllDay ? date : `${date}T${time}`;

      const eventData = {
        title: `${title} ${emoji}`,
        start: startDateTime,
        allDay: isAllDay,
        classNames: [`event-${category}`]
      };

      if (repeat === 'daily') {
        eventData.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        eventData.startRecur = date;
        eventData.endRecur = '2025-12-31';
      } else if (repeat === 'weekly') {
        const dayOfWeek = new Date(date).getDay();
        eventData.daysOfWeek = [dayOfWeek];
        eventData.startRecur = date;
        eventData.endRecur = '2025-12-31';
      } else if (repeat === 'monthly') {
        alert('Monthly repeat coming soon!');
        return;
      } else if (repeat === 'yearly') {
        eventData.rrule = {
          freq: 'yearly',
          dtstart: startDateTime
        };
      }

      calendar.addEvent(eventData);
      let savedEvents = JSON.parse(localStorage.getItem('lifeCalEvents')) || [];
      savedEvents.push(eventData);
      localStorage.setItem('lifeCalEvents', JSON.stringify(savedEvents));

      showToast("✅ Event saved!");
      modal.classList.remove('show');
      resetForm();
      renderTodayEvents();
    };
  }

  function resetForm() {
    titleInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    allDayToggle.checked = true;
    timeInput.classList.add('hidden');
  }

  function getEmoji(title) {
    const lower = title.toLowerCase();
    if (lower.includes('yoga')) return '🧘';
    if (lower.includes('doctor')) return '🩺';
    if (lower.includes('birthday')) return '🎂';
    if (lower.includes('meeting')) return '📍';
    return '📝';
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function renderTodayEvents() {
    const todayList = document.getElementById('todayEventsList');
    if (!todayList || !calendar) return;
    todayList.innerHTML = '';
    const today = new Date().toDateString();
    const events = calendar.getEvents().filter(e => e.start?.toDateString() === today);

    if (events.length === 0) {
      todayList.innerHTML = `<li>No events for today 🎉</li>`;
    } else {
      events.forEach(event => {
        const time = event.allDay ? 'All Day' :
          event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const day = event.start.toLocaleDateString(undefined, { weekday: 'short' });
        todayList.innerHTML += `<li>${event.title} – ${day}, ${time}</li>`;
      });
    }
  }

  function triggerConfetti() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  // 💪 Fitness Tracker
  const workoutType = document.getElementById('workoutType');
  const workoutDuration = document.getElementById('workoutDuration');
  const workoutIntensity = document.getElementById('workoutIntensity');
  const logWorkoutBtn = document.getElementById('logWorkout');
  const workoutHistory = document.getElementById('workoutHistory');

  let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || [];
  logs.forEach(entry => appendWorkout(entry));
  updateStreak(logs);
  drawBarChart(logs);
  updateAnalytics(logs);
  drawProgressRing(getTodayMinutes(logs));

  logWorkoutBtn.addEventListener('click', () => {
    const type = workoutType.value;
    const duration = workoutDuration.value.trim();
    const intensity = workoutIntensity.value;
    if (!type || !duration || duration <= 0) return showToast("⚠️ Please enter valid workout data!");

    const emojiMap = { cardio: "🏃", strength: "🏋️", yoga: "🧘", dance: "💃" };
    const entry = {
      type, duration, intensity,
      timestamp: new Date().toISOString(),
      emoji: emojiMap[type] || "💪"
    };

    appendWorkout(entry);
    logs.push(entry);
    localStorage.setItem('fitnessLogs', JSON.stringify(logs));
    workoutDuration.value = '';
    showToast("✅ Workout logged!");
    updateStreak(logs);
    drawBarChart(logs);
    updateAnalytics(logs);
    drawProgressRing(getTodayMinutes(logs));
  });

  function appendWorkout(entry) {
    const li = document.createElement('li');
    li.textContent = `${entry.emoji} ${entry.type} – ${entry.duration} min – ${entry.intensity} (${new Date(entry.timestamp).toLocaleString()})`;
    workoutHistory.prepend(li);
  }

  function getWorkoutsGroupedByDate(logs) {
    const grouped = {};
    logs.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      grouped[date] = (grouped[date] || 0) + parseInt(entry.duration || 0);
    });
    return grouped;
  }

  function getTodayMinutes(logs) {
    const today = new Date().toDateString();
    return logs.reduce((sum, e) => {
      return new Date(e.timestamp).toDateString() === today ? sum + parseInt(e.duration || 0) : sum;
    }, 0);
  }

  function updateStreak(logs) {
    const grouped = getWorkoutsGroupedByDate(logs);
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toDateString();
      if (grouped[key]) {
        streak++;
      } else {
        if (i !== 0) break;
      }
    }
    document.getElementById('streakCount').textContent = `🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`;
  }

  function drawProgressRing(minutes, goal = 60) {
    const canvas = document.getElementById('ringCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const radius = 50;
    const center = 60;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 10;
    ctx.stroke();
    const percent = Math.min(minutes / goal, 1);
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, (2 * Math.PI * percent) - Math.PI / 2);
    ctx.strokeStyle = '#ff9671';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = '#444';
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText(`${minutes} min`, center, center + 5);
  }

  function drawBarChart(logs) {
    const grouped = getWorkoutsGroupedByDate(logs);
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
      data.push(grouped[d.toDateString()] || 0);
    }

    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Workout Minutes',
          data,
          backgroundColor: '#ffb6a9'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, suggestedMax: 60 }
        }
      }
    });
  }

  function updateAnalytics(logs) {
    const totalElem = document.getElementById('totalMinutes');
    const frequentElem = document.getElementById('mostFrequent');
    const longestElem = document.getElementById('longestStreak');

    const now = new Date();
    const thisMonthLogs = logs.filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const total = thisMonthLogs.reduce((sum, e) => sum + parseInt(e.duration || 0), 0);
    const types = thisMonthLogs.map(e => e.type);
    const freq = types.length
      ? [...types.reduce((acc, t) => acc.set(t, (acc.get(t) || 0) + 1), new Map())]
          .sort((a, b) => b[1] - a[1])[0][0]
      : '-';

    const dates = logs.map(e => new Date(e.timestamp).toDateString());
    const uniqueDates = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => a - b);

    let longest = 0, current = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = (uniqueDates[i] - uniqueDates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) current++;
      else {
        longest = Math.max(longest, current);
        current = 1;
      }
    }
    longest = Math.max(longest, current);

    if (totalElem) totalElem.textContent = `⏱️ Total this month: ${total} min`;
    if (frequentElem) frequentElem.textContent = `🏅 Most frequent: ${freq}`;
    if (longestElem) longestElem.textContent = `📆 Longest streak: ${longest} day${longest !== 1 ? 's' : ''}`;
  }
});




