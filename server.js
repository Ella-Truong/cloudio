const express = require('express')
const fetch = require('node-fetch')
const tzlookup = require('tz-lookup')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static('public'))

// ------------------------ Weather endpoint ------------------------
app.get('/api/weather', async (req, res) => {
    const {city, country} = req.query
    if (!city || !country) return res.status(400).json({error: "Missing city or country"})
    
    try {
        const apiKey = process.env.OPEN_WEATHER_API_KEY

        // Get coordinates using GeoCoding API
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&limit=1&appid=${apiKey}`
        )
        const geoData = await geoRes.json()
        if (!geoData || geoData.length === 0) return res.status(404).json({error: "City not found"})

        const {lat, lon, name, country: countryCode} = geoData[0]
        
        // lookup timezone
        const timeZone = tzlookup(lat, lon)

        // Get current weather (free endpoint)
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        )
        const currentData = await currentRes.json()

        // Get 5-day / 3-hour forecast (free endpoint)
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        )
        const forecastData = await forecastRes.json()

        // Aggregate 3-hour forecast into daily summaries
        const dailyForecast = []
        const dayMap = {}

        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0]
            if (!dayMap[date]) dayMap[date] = []
            dayMap[date].push(item)
        })

        for (const date in dayMap) {
            const items = dayMap[date]
            const avgTemp = (items.reduce((sum, i) => sum + i.main.temp, 0) / items.length).toFixed(1)
            const avgWind = (items.reduce((sum, i) => sum + i.wind.speed, 0) / items.length).toFixed(1)
            const avgHumidity = (items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length).toFixed(0)
            const totalRain = items.reduce((sum, i) => sum + ((i.rain && i.rain['3h']) || 0), 0).toFixed(1)

            dailyForecast.push({
                date,
                temp: avgTemp,
                wind: avgWind,
                humidity: avgHumidity,
                rain: totalRain
            })
        }

        // Send combined data
        res.json({
            city: name,
            country: countryCode,
            timeZone,
            weather: currentData.weather,
            current: {
                temp: currentData.main.temp,
                wind: currentData.wind.speed,
                humidity: currentData.main.humidity,
                rain: currentData.rain ? currentData.rain['1h'] : 0,
                dt: currentData.dt
            },
            daily: dailyForecast
        })

    } catch (error){
        console.error(error)
        res.status(500).json({error:'Failed to fetch weather data'})
    }
})

// ------------------------ Autocomplete / City suggestions ------------------------
app.get('/api/cities', async (req, res) => {
    const { q } = req.query 
    if(!q) return res.status(400).json({error:"Missing query parameters 'q'"})
    
    try {
        const apiKey = process.env.OPEN_WEATHER_API_KEY
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`)
        const geoData = await geoRes.json()

        const suggestions = geoData.map(item => ({
            name: item.name,
            country: item.country
        }))

        res.json(suggestions)
    } catch(error){
        console.error(error)
        res.status(500).json({error:'Failed to fetch city suggestions'})
    }
})

// ------------------------ Start server ------------------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))

