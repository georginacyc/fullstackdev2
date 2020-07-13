// const LocalStrategy = require('passport-local').Strategy;
// const bcrypt = require('bcryptjs');
// const User = require("../models/User");



// function localStrategy(passport) {
//     passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
//         User.findOne({where: {email: email}})
//         .then(user => {
//             if (!user) {
//                 return done(null, false, {message: 'No user found.'});
//             }
//             check = bcrypt.compareSync(password, user.password)
//             if (check) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, {message: "Incorrect password."})
//             }
//         })
//     }));

//     passport.serializeUser((user, done) => {
//         done(null, user.id);
//     });

//     passport.deserializeUser((userId, done) => {
//         Staff.findByPk(userId)
//         .then((user) => {
//             done(null, user);
//         })
//         .catch((done) => {
//             console.log(done);
//         });
//     });
// }
// module.exports = {localStrategy};