const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'runmacros-secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
    if (!req.session.meals) req.session.meals = [];
    if (!req.session.recipes) req.session.recipes = [];
    if (!req.session.mealTimes) req.session.mealTimes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    next();
});

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
    const totals = {};
    req.session.mealTimes.forEach(t => { totals[t] = 0; });
    req.session.meals.forEach(m => {
        if (totals[m.time] === undefined) totals[m.time] = 0;
        totals[m.time] += m.calories;
    });
    res.render('dashboard', { totals });
});

app.get('/meals', (req, res) => {
    res.render('meals', { meals: req.session.meals, mealTimes: req.session.mealTimes });
});

app.post('/meals/add', (req, res) => {
    const { name, calories, time } = req.body;
    req.session.meals.push({ name, calories: parseInt(calories, 10), time });
    res.redirect('/meals');
});

app.post('/mealtimes/add', (req, res) => {
    const { time } = req.body;
    if (time && !req.session.mealTimes.includes(time)) {
        req.session.mealTimes.push(time);
    }
    res.redirect('/meals');
});

app.get('/recipes', (req, res) => {
    res.render('recipes', { recipes: req.session.recipes });
});

app.get('/ai', (req, res) => {
    res.render('ai', { recipe: null });
});

app.post('/ai/generate', async (req, res) => {
    const prompt = req.body.prompt || '';
    let recipeText = 'Failed to generate recipe.';
    const hfToken = process.env.HF_TOKEN;
    if (hfToken) {
        try {
            const response = await fetch('https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${hfToken}`
                },
                body: JSON.stringify({ inputs: `Create a recipe based on these preferences: ${prompt}` })
            });
            const data = await response.json();
            if (Array.isArray(data) && data[0] && data[0].generated_text) {
                recipeText = data[0].generated_text;
            } else if (typeof data.generated_text === 'string') {
                recipeText = data.generated_text;
            } else if (data.error) {
                recipeText = data.error;
            }
        } catch (err) {
            console.error(err);
        }
    } else {
        recipeText = 'HF_TOKEN not set.';
    }
    res.render('ai', { recipe: recipeText });
});

app.post('/ai/save', (req, res) => {
    const recipe = req.body.recipe;
    if (recipe) req.session.recipes.push(recipe);
    res.redirect('/recipes');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
