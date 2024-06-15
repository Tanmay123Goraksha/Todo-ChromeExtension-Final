document.addEventListener('DOMContentLoaded', function() {
    const greetingElement = document.getElementById('greeting');
    const usernameElement = document.getElementById('username');
    const weatherIconElement = document.getElementById('weather-icon');
    const weatherDescriptionElement = document.getElementById('weather-description');
    const temperatureElement = document.getElementById('temperature');
    const text = document.querySelector(".text");
    const input = document.getElementById("input");
    const cityInput = document.getElementById("city");
    const updateLocationButton = document.getElementById("update-location");
    const nameInput = document.getElementById("name");
    const updateNameButton = document.getElementById("update-name");

    const currentHour = new Date().getHours();
    let greeting;

    // Determine the appropriate greeting based on the current time
    if (currentHour >= 5 && currentHour < 12) {
        greeting = "Good morning";
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = "Good afternoon";
    } else if (currentHour >= 18 && currentHour < 21) {
        greeting = "Good evening";
    } else {
        greeting = "Good night";
    }

    greetingElement.textContent = greeting;

    // Function to fetch and display weather information
    function fetchWeather(city) {
        const apiKey = '1ca7d650d2113d1b4b3d851c55183952'; 
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

        fetch(weatherUrl)
            .then(response => response.json())
            .then(data => {
                if (data.cod !== 200) {
                    throw new Error(data.message);
                }
                const weatherDescription = data.weather[0].description;
                const temperature = data.main.temp;
                const iconCode = data.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

                weatherIconElement.innerHTML = `<img src="${iconUrl}" alt="Weather icon">`;
                weatherDescriptionElement.textContent = `${city}: ${weatherDescription}`;
                temperatureElement.textContent = `${temperature}°C`;
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data: ' + error.message);
            });
    }

    // Function to load city and name from storage and fetch weather
    function loadSettings() {
        chrome.storage.sync.get(['city', 'userName'], function(result) {
            const city = result.city || 'Mumbai'; // Default city is Mumbai
            const userName = result.userName || 'Scroll Down to Set'; // Default username is Tanmay

            cityInput.value = city;
            usernameElement.textContent = userName;

            fetchWeather(city);
        });
    }

    // Function to save city and name to storage
    function saveSettings(city, userName) {
        chrome.storage.sync.set({ city: city, userName: userName }, function() {
            console.log('Settings saved - City:', city, 'Name:', userName);
            fetchWeather(city);
        });
    }

    // Load initial settings (city and name) and fetch weather
    loadSettings();

    // Event listener for updating city
    updateLocationButton.addEventListener('click', function() {
        const city = cityInput.value.trim();

        if (city === '') {
            alert("Please enter a city name");
            return;
        }

        saveSettings(city, usernameElement.textContent);
        cityInput.value = '';
    });

    // Event listener for updating name
    updateNameButton.addEventListener('click', function() {
        const userName = nameInput.value.trim();

        if (userName === '') {
            alert("Please enter a name");
            return;
        }

        usernameElement.textContent = userName;
        saveSettings(cityInput.value, userName);
        nameInput.value = '';
    });

    // Function to add a task
    async function addTask(task) {
        try {
            const newTask = document.createElement("li");
            newTask.innerHTML = `${task} <button class="delete-btn">Delete</button>`;
            text.appendChild(newTask);

            // Add event listener to the delete button
            newTask.querySelector(".delete-btn").addEventListener("click", async function() {
                newTask.remove();
                await deleteTask(task);
            });

            // Save tasks to storage after adding
            await saveTask(task);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }

    // Function to save a task to storage
    async function saveTask(task) {
        try {
            const result = await new Promise((resolve, reject) => {
                chrome.storage.sync.get(['tasks'], function(result) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    const tasks = result.tasks || [];
                    tasks.push(task);
                    chrome.storage.sync.set({ tasks: tasks }, function() {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve(tasks);
                    });
                });
            });
            console.log('Task saved:', task);
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }

    // Function to load tasks from storage
    async function loadTasks() {
        try {
            const result = await new Promise((resolve, reject) => {
                chrome.storage.sync.get(['tasks'], function(result) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(result.tasks || []);
                });
            });
            result.forEach(task => addTask(task));
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Function to delete a task from storage
    async function deleteTask(task) {
        try {
            const result = await new Promise((resolve, reject) => {
                chrome.storage.sync.get(['tasks'], function(result) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    const tasks = result.tasks || [];
                    const updatedTasks = tasks.filter(t => t !== task);
                    chrome.storage.sync.set({ tasks: updatedTasks }, function() {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                            return;
                        }
                        resolve(updatedTasks);
                    });
                });
            });
            console.log('Task deleted:', task);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    // Event listener for the "Add" button click
    document.querySelector(".btn-primary").addEventListener("click", function() {
        const task = input.value.trim();
        if (task === '') {
            alert("Field cannot be empty");
            return;
        }

        addTask(task);
        input.value = "";
    });

    // Event listener for pressing Enter in the input field
    input.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            const task = input.value.trim();
            if (task === '') {
                alert("Field cannot be empty");
                return;
            }

            addTask(task);
            input.value = "";
        }
    });

    // Load tasks when the extension is initialized
    loadTasks();
});
