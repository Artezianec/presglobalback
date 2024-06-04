const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../db/db');
const $query = require("../../db/query");

router.post('/', async (req, res) => {
    const {login, password} = req.body;

    if (!login || !password) {
        return res.status(400).send('Login and password are required');
    }

    try {
        db.execute($query.user.select, [login], async (err, results) => {
            if (err) {
                console.error('Error checking user existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                return res.status(400).send('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.execute($query.user.register, [login, hashedPassword], (err, results) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).send('Server error');
                }
                res.status(201).json({
                    message: 'Register successful',
                })
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
