// --------------------------------- DOM Elements ---------------------------------
const searchForm = document.getElementById('search-form')
const cityInput = document.getElementById('city-input')
const countryInput = document.getElementById('country-input')
const suggestionsList = document.getElementById('suggestions')

const cityNameEl = document.getElementById('city-name')
const countryNameEl = document.getElementById('country-name');
const weatherImageEl = document.getElementById('weather-img')
const tempEl = document.getElementById('temp');
const windEl = document.getElementById('wind');
const humidEl = document.getElementById('humid');
const rainEl = document.getElementById('rain');

const currentWeatherEl = document.getElementById('current-weather')
const musicEl = document.getElementById('music-recommendation')
const forecastEl = document.getElementById('weekly-forecast')

// --------------------------------- Autocomplete ---------------------------------
let typingTimer;
const typingDelay = 300;

cityInput.addEventListener('focus', () =>{
    countryInput.value = ''
})

cityInput.addEventListener('input', () => {
    clearTimeout(typingTimer)
    const cityVal = cityInput.value.trim()
    const countryVal = countryInput.value.trim()

    if(!cityVal) {
        suggestionsList.innerHTML = ''
        return
    }

    typingTimer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/cities?q=${encodeURIComponent(cityVal)},${encodeURIComponent(countryVal)}`)
            const data = await res.json()

            suggestionsList.innerHTML = ''

            data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name}, ${item.country}`
                li.addEventListener('click', () => {
                    cityInput.value = item.name
                    countryInput.value = item.country
                    suggestionsList.innerHTML = ''
                })
                suggestionsList.appendChild(li)
            })
        } catch (error){
            console.error('Autocomplete error:', error)
        }
    }, typingDelay)
})

// --------------------------------- Search Form Submit ---------------------------------
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const cityValue = cityInput.value.trim()
    const countryValue = countryInput.value.trim()
    if(!cityValue || !countryValue) {
        return alert('Enter both city and country')
    }

    try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(cityValue)}&country=${encodeURIComponent(countryValue)}`)
        const data = await res.json()

        if(data.error){
            alert(data.error)
            return
        }

        // ----------------- Choose image for each main weather ------------------
        const weatherImages = {
            Clear: './images/sunny.png',
            Clouds: './images/clouds.png',
            Rain: './images/rain.png',
            Snow: './images/snow.png',
            Drizzle: './images/drizzle.png',
            Mist: './images/mist.png',
            Fog: './images/fog.png'
        }

        const weatherMain = data.weather?.[0]?.main
        const imgSrc= weatherImages[weatherMain] || './images/defaultweather.png'

        weatherImageEl.src=imgSrc
        weatherImageEl.alt=weatherMain || 'weather'

        // ---------------- Current Weather ----------------
        cityNameEl.textContent = data.city
        countryNameEl.textContent = data.country
        tempEl.textContent = `${data.current.temp}°C`
        windEl.textContent = `💨 Wind: ${data.current.wind} m/s`
        humidEl.textContent = `💧 Humidity: ${data.current.humidity}%`
        rainEl.textContent = `🌧️ Rain: ${data.current.rain ?? 0} mm`

        // Show local time based on UTC timestamp
        const utcDate = new Date(data.current.dt*1000)

        const formatter = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: data.timeZone
        })

        const [datePart, timePart] = formatter.format(utcDate).split(', ')

        document.getElementById('time').textContent = timePart
        document.getElementById('date').textContent = datePart

        /*
        document.getElementById('time').textContent = cityTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        document.getElementById('date').textContent = cityTime.toLocaleDateString() */

        currentWeatherEl.classList.add('show')

        // ---------------- Music Recommendation ----------------
        const temp = data.current.temp;

        if (temp <= 10) {
            musicEl.innerHTML = `
                🖐 Let Music connect us topgether! 🎧<br>Enjoy Cozy Jazz tracks 🎷
                <iframe 
                    width="260" 
                    height="170" 
                    src="https://www.youtube.com/embed/kn5Ydt3hp-0" 
                    title="Cozy Jazz" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border-radius:25px; margin-top:5px;"
                ></iframe> `;
        } else if (temp <= 20) {
            musicEl.innerHTML = `
                🖐 Don't let the weather bother your mood! 🎧<br>Relax with Chill Pop tracks ❄️
                <iframe 
                    width="260" 
                    height="170" 
                    src="https://www.youtube.com/embed/xESVaYvG4xE" 
                    title="Chill Pop" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border-radius:25px; margin-top:5px;"
                ></iframe>`;
        } else {
            musicEl.innerHTML = `
                🖐 Let's start dynamic summer together! 🎧<br>Turn Summer melody on 🎸
                <iframe 
                    width="260" 
                    height="170" 
                    src="https://www.youtube.com/embed/fTKqtvXjkvo" 
                    title="Summer Hit" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border-radius:25px; margin-top:5px;"
                ></iframe>`;
        }

    
        // ---------------- Weekly Forecast (aggregated from 5-day/3-hour) ----------------
        forecastEl.innerHTML = ''

        data.daily.slice(0, 7).forEach(day => {
            const div = document.createElement('div')
            div.classList.add('weather-box')

            const date = new Date(day.date)
            const dayName = date.toLocaleDateString('en-US', {weekday: 'short'})

            const h3 = document.createElement('h3')
            h3.textContent = dayName
            h3.classList.add('weather-day')
            div.appendChild(h3)

            const details = document.createElement('div')
            details.classList.add('weather-details')

            const tempP = document.createElement('p');
            tempP.textContent = `🌡️ ${day.temp} °C`

            const windP = document.createElement('p');
            windP.textContent = `💨 ${day.wind} m/s`

            const humidP = document.createElement('p');
            humidP.textContent = `💧 ${day.humidity} %`

            const rainP = document.createElement('p');
            rainP.textContent = `🌧️ ${day.rain} mm`

            details.appendChild(tempP)
            details.appendChild(windP)
            details.appendChild(humidP)
            details.appendChild(rainP)

            div.appendChild(details)
            forecastEl.appendChild(div)
        })

    } catch (error) {
        console.error(error)
        alert('Failed to fetch weather')
    }
})
