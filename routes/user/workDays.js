const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../../db/db');
const $query = require("../../db/query");
const jwt = require('jsonwebtoken');
const {unlinkSync, createWriteStream} = require("fs");
const SECRET_KEY = 'AKSDJKAJDK';  // Replace with a secure key
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const moment = require('moment');


router.post('/addWorkDay', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const datetime_entry = req.body.datetime_entry;
        const datetime_exit = req.body.datetime_exit;

        db.execute($query.user.addWorkDay, [userLogin, datetime_entry, datetime_exit], (err, result) => {
            if (err) {
                console.error('Error adding workday:', err);
                return res.status(500).send('Server error');
            }
            db.execute($query.user.setOnWorkDay, [result.insertId, userLogin], (err, result) => {
                if (err) {
                    console.error('Error adding workday:', err);
                    return res.status(500).send('Server error');
                }
            })
            res.json(result.insertId);
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});

router.get('/getAllWorkDays', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const {login: userLogin} = decoded;

        db.execute($query.user.getAllWorkDays, [userLogin], (err, results) => {
            if (err) {
                console.error('Error fetching workdays:', err);
                return res.status(500).send('Server error');
            }

            console.log('Workdays retrieved successfully');
            res.json(results);
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});

router.post('/addBreak', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const workdayId = req.body.workdayId;
        const datetime_entry = req.body.datetime_entry;
        const datetime_exit = req.body.datetime_exit;

        db.execute($query.user.addBreak, [workdayId, datetime_entry, datetime_exit, userLogin], (err, result1) => {
            if (err) {
                console.error('Error adding Break:', err);
                return res.status(500).send('Server error');
            }
            const breakId = result1.insertId;

            db.execute($query.user.setOnBreak, [breakId, userLogin], (err, result2) => {
                if (err) {
                    console.error('Error setting Break:', err);
                    return res.status(500).send('Server error');
                }
                res.json({
                    onbreak: breakId
                });
            });
        });
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).send('Unauthorized');
    }

});
router.put('/addCommentToWorkDay', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const workdayId = req.body.workdayId;
        const comment = req.body.comment;

        db.execute($query.user.checkWorkDayExists, [userLogin, workdayId], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('WorkdayId not found');
            }

            db.execute($query.user.addCommentToWorkDay, [comment, workdayId], (err, result) => {
                if (err) {
                    console.error('Error adding comment To WorkDay:', err);
                    return res.status(500).send('Server error');
                }
                res.json({
                    message: 'Comment added successfully',
                });
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.put('/addCommentToBreak', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const breakId = req.body.breakId;
        const comment = req.body.comment;

        db.execute($query.user.checkBreakExists, [userLogin, breakId], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('WorkdayId not found');
            }

            db.execute($query.user.addCommentToBreak, [comment, breakId], (err, result) => {
                if (err) {
                    console.error('Error adding Comment to Break:', err);
                    return res.status(500).send('Server error');
                }
                console.log('Comment added successfully');
                res.send('Comment added successfully');
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.put('/updateDateTimeEntry', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const workdayId = req.body.workdayId;
        const datetime_entry = req.body.datetime_entry;

        db.execute($query.user.checkWorkDayExists, [userLogin, workdayId], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('WorkdayId not found');
            }

            db.execute($query.user.updateDateTimeEntry, [datetime_entry, workdayId], (err, result) => {
                if (err) {
                    console.error('Error update DateTime Entry:', err);
                    return res.status(500).send('Server error');
                }
                console.log('Update DateTime Entry successfully');
                res.send('Update DateTime Entry successfully');
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.put('/updateDateTimeExit', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const workdayId = req.body.workdayId;
        const datetime_exit = req.body.datetime_exit;

        const workdayExists = await new Promise((resolve, reject) => {
            db.execute($query.user.checkWorkDayExists, [userLogin, workdayId], (err, results) => {
                if (err) return reject('Error checking workday existence:', err);
                resolve(results.length > 0);
            });
        });

        if (!workdayExists) {
            return res.status(404).send('WorkdayId not found');
        }

        await new Promise((resolve, reject) => {
            db.execute($query.user.updateDateTimeExit, [datetime_exit, workdayId], (err) => {
                if (err) return reject('Error update DateTime Exit:', err);
                resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.execute($query.user.setOnWorkDay, [0, userLogin], (err) => {
                if (err) return reject('Error update onWorkDay:', err);
                resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.execute($query.user.setOnBreak, [0, userLogin], (err) => {
                if (err) return reject('Error update onBreak:', err);
                resolve();
            });
        });

        const workdays = await new Promise((resolve, reject) => {
            db.execute($query.user.getAllWorkDays, [userLogin], async (err, workdays) => {
                if (err) return reject('Error fetching workdays:', err);

                const workdaysWithBreaks = await Promise.all(workdays.map(async (workday) => {
                    const breaks = await new Promise((resolve, reject) => {
                        db.execute($query.user.getBreaksByWorkdayId, [workday.id], (err, breaks) => {
                            if (err) return reject('Error fetching breaks:', err);
                            resolve(breaks);
                        });
                    });
                    return {...workday, breaks};
                }));

                resolve(workdaysWithBreaks);
            });
        });

        console.log('Workdays retrieved successfully');
        res.json({
            message: 'Operation successful',
            onbreak: 0,
            onworkday :0,
            workdays: workdays
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).send('Server error');
    }

});
router.put('/updateBreakTimeEntry', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const breakId = req.body.breakId;
        const datetime_entry = req.body.datetime_entry;
        db.execute($query.user.checkBreakExists, [userLogin, breakId], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('breakId not found');
            }
            db.execute($query.user.updateBreakTimeEntry, [datetime_entry, breakId], (err, result) => {
                if (err) {
                    console.error('Error update DateTime Entry:', err);
                    return res.status(500).send('Server error');
                }
                console.log('Update DateTime Entry successfully');
                res.send('Update DateTime Entry successfully');
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.put('/updatePrice', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const price = req.body.price;
        db.execute($query.user.updatePrice, [price,userLogin], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }
            res.json({
                message: 'Operation successful',
                price: price,
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.put('/updateBreakTimeExit', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {id: userId, login: userLogin} = decoded;
        const breakId = req.body.breakId;
        const datetime_exit = req.body.datetime_exit;
        db.execute($query.user.checkBreakExists, [userLogin, breakId], (err, results) => {
            if (err) {
                console.error('Error checking workday existence:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('breakId not found');
            }
            db.execute($query.user.updateBreakTimeExit, [datetime_exit, breakId], (err, result) => {
                if (err) {
                    console.error('Error update DateTime Exit:', err);
                    return res.status(500).send('Server error');
                }
                db.execute($query.user.setOnBreak, [0, userLogin], (err, result) => {
                    if (err) {
                        console.error('Error update onBreak:', err);
                        return res.status(500).send('Server error');
                    }
                })
                res.json({
                    message: 'Update DateTime Exit successfully',
                })
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.get('/exportXLSX', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {login: userLogin} = decoded;

        db.execute($query.user.getAllWorkDays, [userLogin], async (err, results) => {
            if (err) {
                console.error('Error fetching workdays:', err);
                return res.status(500).send('Server error');
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Workdays');
            worksheet.columns = [
                {header: 'ID', key: 'id', width: 10},
                {header: 'User', key: 'user', width: 20},
                {header: 'Entry Date', key: 'datetime_entry', width: 20},
                {header: 'Exit Date', key: 'datetime_exit', width: 20},
                {header: 'Comment', key: 'comment', width: 40},
            ];

            results.forEach(result => {
                worksheet.addRow(result);
            });

            const filePath = 'workdays.xlsx';
            await workbook.xlsx.writeFile(filePath);
            res.download(filePath, 'workdays.xlsx', () => {
                unlinkSync(filePath);
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
router.get('/exportPDF', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {login: userLogin} = decoded;

        db.execute($query.user.getAllWorkDays, [userLogin], async (err, results) => {
            if (err) {
                console.error('Error fetching workdays:', err);
                return res.status(500).send('Server error');
            }

            if (results.length === 0) {
                return res.status(404).send('No workdays found');
            }

            results.forEach(result => {
                result.datetime_entry = moment(result.datetime_entry).format('YYYY-MM-DD HH:mm:ss');
                result.datetime_exit = result.datetime_exit ? moment(result.datetime_exit).format('YYYY-MM-DD HH:mm:ss') : null;
            });

            const doc = new PDFDocument();

            const writeStream = fs.createWriteStream('workdays.pdf');
            doc.pipe(writeStream);

            doc.fontSize(12).text('Workdays', {align: 'center'}).moveDown();
            results.forEach(result => {
                doc.fontSize(10).text(`ID: ${result.id}, User: ${result.user}, Entry Date: ${result.datetime_entry}, Exit Date: ${result.datetime_exit || 'N/A'}, Comment: ${result.comment}`).moveDown();
            });

            doc.end();

            writeStream.on('finish', () => {
                res.download('workdays.pdf', 'workdays.pdf', (err) => {
                    if (err) {
                        console.error('Error sending file:', err);
                    } else {
                        fs.unlinkSync('workdays.pdf');
                    }
                });
            });

            writeStream.on('error', (err) => {
                console.error('Error writing PDF file:', err);
                return res.status(500).send('Error creating PDF');
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});

router.get('/exportCSV', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const {login: userLogin} = decoded;

        db.execute($query.user.getAllWorkDays, [userLogin], async (err, results) => {
            if (err) {
                console.error('Error fetching workdays:', err);
                return res.status(500).send('Server error');
            }

            results.forEach(result => {
                result.datetime_entry = moment(result.datetime_entry).format('YYYY-MM-DD HH:mm:ss');
                result.datetime_exit = result.datetime_exit ? moment(result.datetime_exit).format('YYYY-MM-DD HH:mm:ss') : null;
            });

            const csvWriter = createCsvWriter({
                path: 'workdays.csv',
                header: [
                    {id: 'id', title: 'ID'},
                    {id: 'user', title: 'User'},
                    {id: 'datetime_entry', title: 'Entry Date'},
                    {id: 'datetime_exit', title: 'Exit Date'},
                    {id: 'comment', title: 'Comment'},
                ],
                fieldDelimiter: ';'
            });

            await csvWriter.writeRecords(results);
            res.download('workdays.csv', 'workdays.csv', () => {
                fs.unlinkSync('workdays.csv');
            });
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        return res.status(401).send('Unauthorized: Invalid token');
    }
});
module.exports = router;
