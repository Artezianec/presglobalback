const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const $query = require("../../db/query");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = 'AKSDJKAJDK';  // Replace with a secure key

router.post('/', async (req, res) => {
    const {login, password} = req.body;

    if (!login || !password) {
        return res.status(400).send('Login and password are required');
    }

    try {
        db.execute($query.user.login, [login], async (err, results) => {
            if (err) {
                console.error('Error checking user existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(400).send('Invalid login or password');
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).send('Invalid login or password');
            }

            const token = jwt.sign({id: user.id, login: user.login}, SECRET_KEY, {expiresIn: '1h'});
            user.workdays = await new Promise((resolve, reject) => {
                db.execute($query.user.getAllWorkDays, [login], async (err, workdays) => {
                    if (err) return reject(err);

                    // Получаем breaks для каждого workday
                    const workdaysWithBreaks = await Promise.all(workdays.map(async (workday) => {
                        const breaks = await new Promise((resolve, reject) => {
                            db.execute($query.user.getBreaksByWorkdayId, [workday.id], (err, breaks) => {
                                if (err) return reject(err);
                                resolve(breaks);
                            });
                        });
                        return { ...workday, breaks };
                    }));

                    resolve(workdaysWithBreaks);
                });
            });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            });

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    login: user.login,
                    workdays: user.workdays,
                    onworkday: user.onworkday,
                    onbreak: user.onbreak,
                    price: user.price
                }
            });

        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
