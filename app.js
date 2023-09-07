const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


const app = express();
/* host - ha online van akkor a tárhely ip címét kell ide írni
*/
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodejs'
});
/*
//Ez azért kell, hogy parsolva legyenek az inputok, tehát kilehessen szedni, hogy mi van bennük
app.use(express.urlencoded({ extended: false }));
//Ez pedig a JSON-okat parsolja
app.use(express.json());
*/
//így lehet majd használni a stylesokat
app.use("/styles",express.static("styles"));

db.connect( (error) => {
    if (error) console.log(error)
    else console.log("MYSQL kapcsolódva.")
});

//így jelenítjük meg az index.html-t ha a böntésző eljut a / jelig
app.get("/", (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

app.use(cookieParser()); // Használd a cookie-parser middleware-t

app.post("/", encoder, function(req,res){
    var inputValue = req.body.gomb;

    if (inputValue == 'LOGIN') {
        let sql = "SELECT * FROM users WHERE USER_NAME = ? AND USER_PASSWORD = ?";

        var name = req.body.name;
        var password = req.body.password;
        /*Ha az sql változóban szereplő lekérdezésben vannak találatok akkor létrehozzuk a kukit és
        beadjuk a /beleptel oldalt. Ha nincs, akkor vissza küld a "/" oldalra, ami most az index.*/
        db.query(sql ,[name,password], function(error,results,fields){
            if (results.length > 0) {
                const user = { name: name, id: results[0].id }; // Felhasználói adatok
                const token = jwt.sign(user, 'titkoskulcs'); // JWT generálása
                res.cookie('token', token, { maxAge: 3600000 }); // Süti beállítása
                res.redirect("/beleptel");
            } 
            else res.redirect("/");
            res.end();
        })
    }

    if (inputValue == 'REGISTER') {
        var name = req.body.name;
        var password = req.body.password;

        let checkQuery = "SELECT * FROM users WHERE USER_NAME = ?";

        db.query(checkQuery, [name], function(checkError, checkResults, checkFields) {
            if (checkError) {
                console.log(checkError);
                res.redirect("/registration-failed");
            } else {
                if (checkResults.length > 0) {
                    console.log("A felhasználónév már foglalt.");
                    res.redirect("/");
                } else {
                    // Ha a felhasználónév még nem foglalt, akkor beszúrhatjuk az adatokat
                    let insertQuery = "INSERT INTO users (USER_NAME, USER_PASSWORD) VALUES (?, ?)";
    
                    db.query(insertQuery, [name, password], function(insertError, insertResults, insertFields) {
                        if (insertError) {
                            console.log(insertError);
                            res.redirect("/registration-failed");
                        } else {
                            console.log("Regisztráció sikeres!");
                            res.redirect("/beleptel");
                        }
                    });
                }
            }
        });

    }
})

//Amikor sikeres a belépés
app.get("/beleptel", function(req, res) {
    const token = req.cookies.token; // Olvasd ki a sütit
    //ha nincs token
    if (!token) {
        res.redirect("/");
    } else {
        jwt.verify(token, 'titkoskulcs', function(err, decoded) {
            if (err) {
                console.log(err);
                res.redirect("/");
            } else {
                // A JWT ellenőrzése sikeres, a felhasználó hozzáférhet az oldalhoz
                res.sendFile(__dirname + '/beleptel.html');
            }
        });
    }
});

const port = 5000;
app.listen(port, () => {
    console.log(`Megy a szeró az ${port}-es porton.`);
})
