// Select HTML elements for user interactions
const cityInput = document.querySelector('.city-input');
const searchButton = document.querySelector('.search-btn');
const locationButton = document.querySelector('.location-btn');
const currentWeather = document.querySelector('.current-weather');
const weatherCards = document.querySelector('.weather-cards');
const cityDropdown = document.querySelector('.city-dropdown');

const API_KEY = "5fe4be4520209ba6c28b78a4ae8ad3a5";  // API key for OpenWeatherMap API

// Create HTML for weather cards
const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        // HTML for current weather
        return `
            <div class="details">
                <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                <h4>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(1)}°C</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </div>
            <div class="icon">
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                <h4>${weatherItem.weather[0].description}</h4>
            </div>
        `;
    } else {
        // HTML for forecast weather
        return `
            <li class="card">
                <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                <h4>Temp: ${(weatherItem.main.temp - 273.15).toFixed(1)}°C</h4>
                <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                <h4>Humidity: ${weatherItem.main.humidity}%</h4>
            </li>
        `;
    }
}

// Fetch weather details based on latitude and longitude and display them
const getWeatherDetails = (cityName, lat, lon) => { 
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            // Filter the Forecast to get only one forecast per day
            const forecastDays = [];  // Array to keep track of Unique Dates to avoid duplicates

            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();

                if (!forecastDays.includes(forecastDate)) {
                    return forecastDays.push(forecastDate);
                }
            });

            console.log(fiveDaysForecast); 

            // Clear existing weather data from DOM
            currentWeather.innerHTML = '';
            weatherCards.innerHTML = '';

            // Creating weather cards and adding them to DOM
            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    // Insert current weather details
                    currentWeather.insertAdjacentHTML('beforeend', createWeatherCard(cityName, weatherItem, index));
                } else {
                    // Insert forecast weather cards
                    weatherCards.insertAdjacentHTML('beforeend', createWeatherCard(cityName, weatherItem, index));
                }
            });

            // Update the dropdown menu with recent city searches
            updateDropdown(cityName);
        })
        .catch(() => alert('An error occurred while fetching the weather forecast data'));
}

// Fetch coordinates for the city entered in the input field
const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;  // Do nothing if the input is empty

    const GEO_CODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    fetch(GEO_CODING_API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);  // Fetch weather details for the city
        })
        .catch(() => alert('An error occurred while fetching the coordinates'));
}

// Fetch weather details based on the user's current location
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(REVERSE_GEOCODING_URL)
                .then(response => response.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);  // Fetch weather details for the current location
                })
                .catch(() => alert('An error occurred while fetching the city name'));
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please grant access in location settings.");
            }
        }
    );
}

// Update dropdown menu with recently searched cities
const updateDropdown = (cityName) => {
    const cities = JSON.parse(localStorage.getItem('cities')) || [];
    if (!cities.includes(cityName)) {
        cities.push(cityName);
        localStorage.setItem('cities', JSON.stringify(cities)); // Save the updated list of cities to local storage
    }

    // Populate dropdown with city options
    cityDropdown.innerHTML = '<option value="">Select a City Name</option>';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityDropdown.appendChild(option);
    });

    // Show dropdown if cities are present
    cityDropdown.style.display = cities.length > 0 ? 'block' : 'none';
}

// Handle city selection from the dropdown
cityDropdown.addEventListener('change', () => {
    const selectedCity = cityDropdown.value;
    if (selectedCity) {
        cityInput.value = selectedCity;  // Set input value to selected city
        getCityCoordinates();           // Fetch weather details for selected city
    }
});

// Event listeners for buttons and input
searchButton.addEventListener('click', getCityCoordinates); // Fetch weather for city name entered in input
cityInput.addEventListener('keyup', e => e.key === "Enter" && getCityCoordinates()); // Fetch weather on Enter key pressed on keyboard
locationButton.addEventListener('click', getUserCoordinates); // Fetch weather for the user's current location