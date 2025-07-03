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
    next();
});

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
    res.render('dashboard', { meals: req.session.meals });
});

app.get('/meals', (req, res) => {
    res.render('meals', { meals: req.session.meals });
});

app.post('/meals/add', (req, res) => {
    const { name, calories } = req.body;
    req.session.meals.push({ name, calories: parseInt(calories, 10) });
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
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: `Create a recipe based on these preferences: ${prompt}` }]
                })
            });
            const data = await response.json();
            recipeText = data.choices && data.choices[0].message.content;
        } catch (err) {
            console.error(err);
        }
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
