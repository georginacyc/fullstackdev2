const mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "monoqlo",
    password: "monoqlo",
    database: "monoqlo"
});

// const dbCheck = new Promise (num => {
//     console.log("fcheck1");
//     con.connect(function(err) {
//         console.log("fcheck2");
//         if (err) throw err;
//         console.log("fcheck3");
//         con.query("SELECT COUNT(*) AS tableCheck FROM staffs", function(err, result, fields) {
//             console.log("fcheck4");
//             if (err) throw err;
//             console.log(result);
//             console.log("fchec5");
//             console.log(result[0].tableCheck);
//             if (result[0].tableCheck > 0) {
//                 console.log("fcheck6");
//                 console.log(result[0].tableCheck)
//                 con.query("SELECT COUNT(type) AS count FROM staffs", function(err, result, fields) {
//                 if (err) throw err;
//                 num = result[0].count + 1;
//                 num = num.toString();
//                 num = num.padStart(6, "0");
//                 console.log("2a", num);
//                 });
//             } else {
//                 num = "000001";
//                 console.log("fcheck7");
//                 console.log("2b", num);
//             };
//             console.log("fcheck8");
//         });
//         console.log("fcheck9");
//     });
//     console.log("fcheck10");
// });

// module.exports = dbCheck;

// async function check() {
//     console.log("fcheck1");
//     con.connect(function(err) {
//         console.log("fcheck2");
//         if (err) throw err;
//         console.log("fcheck3");
//         con.query("SELECT COUNT(*) AS tableCheck FROM staffs", function(err, result, fields) {
//             console.log("fcheck4");
//             if (err) throw err;
//             console.log(result);
//             console.log("fchec5");
//             console.log(result[0].tableCheck);
//             if (result[0].tableCheck > 0) {
//                 console.log("fcheck6");
//                 console.log(result[0].tableCheck)
//                 con.query("SELECT COUNT(type) AS count FROM staffs", function(err, result, fields) {
//                 if (err) throw err;
//                 num = result[0].count + 1;
//                 num = num.toString();
//                 num = num.padStart(6, "0");
//                 console.log("2a", num);
//                 return num
//                 });
//             } else {
//                 num = "000001";
//                 console.log("fcheck7");
//                 console.log("2b", num);
//                 return num
//             };
//             console.log("fcheck8");
//         });
//         console.log("fcheck9");
//     });
//     console.log("fcheck10");
// };

// module.exports = check();