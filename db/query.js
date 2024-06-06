const query = {
    user: {
        register: 'insert into users (login, password) values (?,?)',
        select: 'select login from users where login = ?',
        login: 'select * from users where login = ?',
        updatePrice: 'update users set price = ? where login = ?',
        setOnWorkDay: 'update users set onWorkDay = ? where login = ?',
        setOnBreak: 'update users set onBreak = ? where login = ?',
    },
    workday: {
        addWorkDay: 'insert into workdays (user, datetime_entry, datetime_exit) VALUES (?, ?, ?)',
        getAllWorkDays: 'select id, user, datetime_entry, datetime_exit,comment from workdays where user = ?',
        addBreak: 'insert into breaks (workday_id, time_entry, time_exit,user) VALUES (?, ?, ?,?);',
        addCommentToWorkDay: 'update workdays set comment = ? where id = ?',
        addCommentToBreak: 'update breaks set comment = ? where id = ?',
        updateDateTimeEntry: 'update workdays set datetime_entry = ? where id = ?',
        updateDateTimeExit: 'update workdays set datetime_exit = ? where id = ?',
        updateBreakTimeEntry: 'update breaks set time_entry = ? where id = ?',
        updateBreakTimeExit: 'update breaks set time_exit = ? where id = ?',
        checkWorkDayExists: 'select * from workdays where user = ? AND id = ?',
        checkBreakExists: 'select * from breaks where user = ? AND id = ?',
        getBreaksByWorkdayId: 'select * from breaks where workday_id = ?'
    }
};

module.exports = query;