var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});
router.post('/logout', (req, res) => {
    res.clearCookie('token').send('Logged out successfully');
});

module.exports = router;
