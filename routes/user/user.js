const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const $query = require("../../db/query");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET_KEY = 'AKSDJKAJDK';  // Replace with a secure key

router.post('/login', async (req, res) => {
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
                db.execute($query.workday.getAllWorkDays, [login], async (err, workdays) => {
                    if (err) return reject(err);
                    const workdaysWithBreaks = await Promise.all(workdays.map(async (workday) => {
                        const breaks = await new Promise((resolve, reject) => {
                            db.execute($query.workday.getBreaksByWorkdayId, [workday.id], (err, breaks) => {
                                if (err) return reject(err);
                                resolve(breaks);
                            });
                        });
                        return {...workday, breaks};
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
                    onWorkDay: user.onWorkDay,
                    onBreak: user.onBreak,
                    price: user.price
                }
            });

        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error');
    }
})
router.post('/register', async (req, res) => {
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
                res.json({
                    message: 'Registration successful',
                });
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Server error');
    }
})
router.post('/logout', (req, res) => {
    res.clearCookie('token').send('Logged out successfully');
});


module.exports = router;
