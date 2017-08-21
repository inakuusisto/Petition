const express = require('express');
const router = express.Router();
const spicedPg = require('spiced-pg');
var csrf = require('csurf');
const functions = require("../models/models.js");

router.use(csrf());

var db = spicedPg(process.env.DATABASE_URL || `postgres:${require('../secrets.json').name}:${require('../secrets.json').pass}@localhost:5432/signatures`);


router.route('/register')

    .get(function(req, res) {

        res.render('register', {
            layout: 'layout',
            csrfToken: req.csrfToken()
        });
    })


    .post(function(req, res) {

        functions.hashPassword(req.body.password).then(function(hash) {

            db.query('INSERT INTO users(first_name, last_name, email, password) values($1, $2, $3, $4) returning id',
                [req.body.first, req.body.last, req.body.email, hash]).then(function(results) {
                req.session.user = {
                    userId: results.rows[0].id,
                    firstName: req.body.first,
                    lastName: req.body.last,
                    email: req.body.email
                };
                res.redirect('/profile');
            }).catch(function(err){
                console.log(err);
                res.render('register', {
                    layout: 'layout',
                    error: 'Oops, something went wrong. Please try again. If you have already registered, please use log in at the bottom of the page',
                    csrfToken: req.csrfToken()
                });
            });
        }).catch(function(err) {
            console.log(err);
            res.render('register', {
                layout: 'layout',
                linkToLogin: '/login',
                error: 'Oops, something went wrong. Please try again.',
                csrfToken: req.csrfToken()
            });
        });
    });




router.route('/profile')

    .get(function(req, res) {

        res.render('profile', {
            layout: 'layout',
            csrfToken: req.csrfToken()
        });
    })


    .post(function(req, res) {

        if (req.body.age.length === 0 && req.body.city.length === 0 && req.body.homepage.length === 0) {
            res.redirect('/petition');
        } else {
            if (!req.body.age.length) {
                req.body.age = null;
            }
            db.query('INSERT INTO user_profiles(user_id, age, city, url) values($1, $2, $3, $4)',
                [req.session.user.userId, req.body.age, req.body.city, req.body.homepage]).then(function() {
                req.session.user.age = req.body.age;
                req.session.user.city = req.body.city;
                req.session.user.homepage = req.body.homepage;

                res.redirect('/petition');
            }).catch(function(err){
                console.log(err);
                res.render('profile', {
                    layout: 'layout',
                    error: 'Oops, something went wrong. Please try again.',
                    csrfToken: req.csrfToken()
                });
            });
        }
    });



router.route('/login')

    .get(function(req, res) {
        res.render('login', {
            layout: 'layout',
            csrfToken: req.csrfToken()
        });
    })


    .post(function(req, res) {

        db.query('SELECT users.id, users.first_name, users.last_name, users.email, users.password, signatures.user_id, signatures.signature FROM users LEFT JOIN signatures ON users.id = signatures.user_id WHERE users.email=$1', [req.body.email]).then(function(results){
            functions.checkPassword(req.body.password, results.rows[0].password).then(function(doesMatch) {
                if (doesMatch) {
                    req.session.user = {
                        userId: results.rows[0].id,
                        firstName: results.rows[0].first_name,
                        lastName: results.rows[0].last_name,
                        email: results.rows[0].email,
                    };
                    if(results.rows[0].signature){
                        req.session.user.sigId = results.rows[0].user_id;
                    }
                    res.redirect('/petition');
                } else {
                    res.redirect('/petition');
                }
            });

        }).catch(function(err) {
            console.log(err);
            res.render('login', {
                layout: 'layout',
                error: 'Oops, something went wrong. Please try again.',
                csrfToken: req.csrfToken()
            });
        });
    });


router.route('/petition')

    .get(function(req, res) {
        if (req.session.user.sigId) {
            res.redirect('/signed');
        } else {
            res.render('petition', {
                layout: 'layout',
                firstName: req.session.user.firstName,
                lastName: req.session.user.lastName,
                csrfToken: req.csrfToken()
            });
        }
    })


    .post(checkSig, function(req, res) {

        db.query('INSERT INTO signatures(user_id, signature) values($1, $2) returning id',
            [req.session.user.userId, req.body.signature]).then(function(results) {
            req.session.user.sigId = results.rows[0].id;
            res.redirect('/signed');
        }).catch(function(err) {
            console.log(err);
        });
    });



function checkSig(req, res, next) {
    if (req.body.signature.length === 0) {
        res.render('petition', {
            layout: 'layout',
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            error: 'Are you sure you signed the petition?',
            csrfToken: req.csrfToken()
        });
    } else {
        next();
    }
}



router.get('/signed', requireSignature, function(req, res) {

    // res.redirect('/signers');

    Promise.all([
        getSig(req.session.user.userId),
        getNumberofSig(),
    ]).then(function(results) {
        res.render('signed', {
            layout: 'layout',
            image: results[0],
            signerAmount: results[1],
            csrfToken: req.csrfToken()
        });
    }).catch(function(err) {
        console.log(err);
    });


    function getSig(userId) {
        return new Promise(function(resolve, reject) {
            db.query('SELECT signature FROM signatures WHERE user_id=$1', [userId]).then(function(results) {
                resolve(results.rows[0].signature);
            }).catch(function(err) {
                reject(err);
            });
        });
    }

    function getNumberofSig() {
        return new Promise(function(resolve, reject) {
            db.query('SELECT COUNT(signature) FROM signatures').then(function(results) {
                resolve(results.rows[0].count);
            }).catch(function(err) {
                reject(err);
            });
        });
    }

});



router.route('/profile/edit')

    .get(function(req, res) {

        db.query('SELECT users.first_name, users.last_name, users.email, user_profiles.age, user_profiles.city, user_profiles.url FROM users LEFT OUTER JOIN user_profiles ON users.id = user_profiles.user_id WHERE users.id=$1', [req.session.user.userId]).then(function(results){
            res.render('edit', {
                layout: 'layout',
                firstName: results.rows[0].first_name,
                lastName: results.rows[0].last_name,
                email: results.rows[0].email,
                age: results.rows[0].age,
                city: results.rows[0].city,
                homepage: results.rows[0].url,
                csrfToken: req.csrfToken()
            });
        }).catch(function(err) {
            console.log(err);
        });
    })




    .post(function(req, res) {

        checkIfProfileExists(req.session.user.userId)
            .then(function(doesUserExist) {
                if(!doesUserExist) {
                    if (!req.body.age.length) {
                        req.body.age = null;
                    }
                    console.log('user does not exist');
                    db.query('INSERT INTO user_profiles(user_id, age, city, url) values($1, $2, $3, $4)',
                        [req.session.user.userId, req.body.age, req.body.city, req.body.homepage]).then(function(results) {
                        res.redirect('/signed');
                    });
                } else {
                    if (!req.body.age.length) {
                        req.body.age = null;
                    }
                    if (req.body.password.length) {
                        functions.hashPassword(req.body.password).then(function(hash) {
                            Promise.all([
                                updateUsers(req.body.first, req.body.last, req.body.email, hash, req.session.user.userId),
                                updateUserProfiles(req.body.age, req.body.city, req.body.homepage, req.session.user.userId)
                            ]).then(function() {
                                res.redirect('/signed');
                            }).catch(function(err) {
                                console.log(err);
                            });
                        });
                    } else {
                        Promise.all([
                            updateUsersWithoutPw(req.body.first, req.body.last, req.body.email, req.session.user.userId),
                            updateUserProfiles(req.body.age, req.body.city, req.body.homepage, req.session.user.userId)
                        ]).then(function() {
                            res.redirect('/signed');
                        }).catch(function(err) {
                            console.log(err);
                        });
                    }
                }
            }).catch(function(err) {
                console.log(err);
            });
    })
;




function checkIfProfileExists(userId) {
    return new Promise(function(resolve, reject) {
        db.query('SELECT user_id FROM user_profiles WHERE user_id=$1', [userId])
            .then(function(results) {
                if (results.rows.length != 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(function(err) {
                reject(err);
            });
    });
}


function updateUserProfiles(age, city, homepage, userId) {
    return new Promise(function(resolve, reject) {
        db.query('UPDATE user_profiles SET age = $1, city = $2, url = $3 WHERE user_id = $4',[age, city, homepage, userId])
            .then(function(results) {
                resolve();
            }).catch(function(err) {
                reject(err);
            });
    });
}


function updateUsers(firstName, lastName, email, hashPassword, userId) {
    return new Promise(function(resolve, reject) {
        db.query('UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id=$5',[firstName, lastName, email, hashPassword, userId]).then(function(results) {
            resolve();
        }).catch(function(err) {
            reject(err);
        });
    });
}


function updateUsersWithoutPw(firstName, lastName, email, userId) {
    return new Promise(function(resolve, reject) {
        db.query('UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id=$4',[firstName, lastName, email, userId]).then(function(results) {
            resolve();
        }).catch(function(err) {
            reject(err);
        });
    });
}




router.get('/unsign', function(req, res) {
    db.query('DELETE FROM signatures WHERE user_id=$1', [req.session.user.userId]).then(function() {
        req.session.user.sigId = null;
        res.redirect('/petition');
    }).catch(function(err) {
        console.log(err);
    });
});




router.get('/signers', requireSignature, function(req, res) {

    db.query('SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.url FROM users INNER JOIN signatures ON users.id = signatures.user_id LEFT OUTER JOIN user_profiles ON users.id = user_profiles.user_id').then(function(results){

        res.render('signers', {
            layout: 'layout',
            signerDetails: results.rows,
            csrfToken: req.csrfToken()
        });

    }).catch(function(err) {
        console.log(err);
    });
});




router.get('/signers/:cityName', requireSignature, function (req, res) {

    var cityName = req.params.cityName;

    db.query(`SELECT users.first_name, users.last_name, user_profiles.age FROM users JOIN user_profiles ON users.id = user_profiles.user_id WHERE user_profiles.city ILIKE '${cityName}'`).then(function(results){

        res.render('signers', {
            layout: 'layout',
            signerDetails: results.rows,
            citizensText: `citizens of ${cityName}`,
            csrfToken: req.csrfToken()
        });

    }).catch(function(err) {
        console.log(err);
    });

});



router.get('/', function(req, res) {
    res.redirect('/register');
});



function requireSignature(req, res, next) {
    if (!req.session.user.sigId) {
        res.redirect('/petition');
    } else  {
        next();
    }
}


router.get('/logout', function(req,res) {
    req.session = null;
    res.redirect('/register');
});


module.exports = router;
