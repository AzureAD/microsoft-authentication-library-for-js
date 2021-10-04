const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const date = new Date();
const currentDay = date.getDate();
const currentDayOfWeek = date.getDay();
let month = date.getMonth();
let year = date.getFullYear();

const releaseDay = 1; // Monday
const dateOfNextRelease = (7 + releaseDay - currentDayOfWeek) % 7 + currentDay;
if (dateOfNextRelease > 7) {
    // If date of next release is not 1-6, this month's release has already happened and we should prepare next month's release instead
    if (month === 11) {
        // New year
        month = 0;
        year++;
    } else {
        month++;
    }
}

console.log(months[month], year);