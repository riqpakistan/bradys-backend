const moment = require('moment-timezone');

module.exports = {
    getCurrentDate: () => {
        // const currentDate = moment().tz('Asia/Karachi').format('YYYY-MM-DD');
        const currentDate = '2025-01-30';
        return currentDate;
    }
}