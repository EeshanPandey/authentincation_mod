var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const bcrypt = require("bcrypt");
var urlencodedParser = bodyParser.urlencoded({extended: false});
var nodemailer = require('nodemailer');
var MongoClient = require('mongodb').MongoClient;
var url = //url of the data base

//create a schema arch
/*username, hash string, key*/

//to bcrypt hash the password use function passcrypt()
function passcrypt(passStr){
	const rounds = 10;
	bcrypt.hash(passStr,rounds,function(err,hashOP){
		if (err){
			console.error(err); return;
		}
		return hash;
	});
} 


app.post('/register', urlencodedParser, function(req,res){
	var hashPass = passcrypt(req.body.Passwrd);
	var data = { Username: req.body.UserName,
		hash_str: hashPass,
		email: req.body.Email,
		sec_key: null
	};
	MongoClient.connect(url, function(err, db){
		if (err)
			throw err;
		console.log("conn to db successfull");
		db.collection('userDoc').insertOne(data, function(err, result){
			if (err)
				throw err;
			console.log("one document inserted");
		});
	});
});

//function to authenticate
var authRes;
var flag = 0; //initially zero , unauthenticated
async function authenticate(username,hashString, password){
    
    bcrypt.compare(password, hashString,function(err,res){
    	if(res){
    		flag = 1; //password match
    	}
    	else {
    		flag = 0; //password don't match
    	}

    });
}

app.post('/signin',urlencodedParser, function(req,res){
	var usrname = req.body.UserName;
	var passwrd = req.body.password;
	const db = MongoClient.connect(url);
    authRes = db.collection('userDoc').find({Username: usrname});
    if(authRes){
		await authenticate(authRes.Username,authRes.hash_str, );
    }
    if(flag){
    	console.log("welcome user");
    }
    else{
    	console.log("wrong password");
    }
});

app.post('/forgot-password', urlencodedParser, function(res,req){
	var UserMail = req.body.email;    
	var digits = '0123456789';
	var OTP = '';
	for(let i = 0; i< 4; i++){
		OPT += digits[Math.floor(Math.random()*10)];
	}
	const db = MongoClient.connect(url);
    authRes = db.collection('userDoc').findone({Email: UserMail});
   	mailText = "your OTP is "+OTP+". Go to this _Url_ ./change-password to change your password";

    if (authRes){      //if user with given mail is found
    	var transporter = nodemailer.createTransport({
    		service: 'gmail',
    		auth: {
    			user: 'GMAIL_ID',
    			pass: '_password'
    		}
    	});

    	var mailOptions = {
    		from : '_senderEmal',
    		to: UserMail,
    		subject: 'Password Change Request',
    		text: mailText
    	};
    	transporter.sendMail(mailOptions, function(err,res){
    		if(err){
    			console.log(err);
    		}
    		else
    			console.log(res);
    	});
    	// mail with otp sent
    	MongoClient.connect(url, function(err, db) {
  			if (err) throw err;
  			var myquery = { email: UserMail };
  			var newvalues = { sec_key: OTP};
  			db.collection("userDoc").updateOne(myquery, newvalues, function(err, res) {
   				 if (err) throw err;
    			console.log("OTP is now stored in sec_key of the user");
    			db.close();
  			});
	    	console.log("OTP has been sent to the given email");
    	});
    }
    else{
    	console.log("account cannot be found, recheck the email");
    }

});

app.post('/change-password',urlencodedParser,function(req,res){
	var hashPass = passcrypt(req.body.Passwrd);
	var usrname = req.body.username;
	var otp = req.body.otp;
	MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var found = db.collection('userDoc').findone({Username: usrname});
  		if(found){
  			if (otp == found.sec_key){
  				var myquery = { Username: usrname };
  				var newvalues = { hash_str: hashPass};
  				db.collection("userDoc").updateOne(myquery, newvalues, function(err, res) {
   					if (err) throw err;
    				console.log("new password is updated!!");
    				db.close();
  				});		
  			}
  			else console.log("the OTP doesn't match");
  		}
  		else{
  			console.log("username is incorrect");
  		}	
  	});
});