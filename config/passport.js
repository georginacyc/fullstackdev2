const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Staff = require("../models/Staff");

function localStrategy(passport) {
    passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
        Staff.findOne({where: {email: email}})
        .then(staff => {
            if (!staff) {
                return done(null, false, {message: 'No user found.'});
            }
            check = bcrypt.compareSync(password, staff.password)
            if (check) {
                return done(null, user)
            } else {
                return done(null, false, {message: "Incorrect password."})
            }
        })
    }));

    passport.serializeUser((user, done) => {
        done(null, staff.id);
    });

    passport.deserializeUser((staffId, done) => {
        Staff.findByPk(staffId)
        .then((staff) => {
            done(null, staff);
        })
        .catch((done) => {
            console.log(done);
        });
    });
}
module.exports = {localStrategy};