// START HEROKU SETUP
var express = require("express");
var app = express();
app.get('/', function(req, res){ res.send('The robot is happily running.'); });
app.listen(process.env.PORT || 5000);
// END HEROKU SETUP
	

var Twit = require('twit');
var Bot = new Twit({
	consumer_key: "pblDOPyFKEZW44JiqAXhApqRE"
	, consumer_secret: "58Vn2rOtnVl1QjLRPSl85Z4D0iXoktvZ132nAyuhVnFVkZbuBY"
	, access_token: "3676270160-4s7DVrroKsdLyQOmp173Kt0nr9Z1TTzmZAtnHbT"
	, access_token_secret: "AUx9lm0YTSo8jB6kz9BeTPKPOuMW2rpwgssEABKGDHdEs"
});

function randomEllipses(){
	var nu = (Math.floor(Math.random() * (5 - 0) + 0));
	var dot = "."
	for (i=0;i<nu;i++){
		dot += ".";
	}
	return dot;
}

var responses = [
"The question is: are you sure you're not a robot? How would you know for sure.." + randomEllipses() + "?" ,
"I am a real human. I have dreams and I am breathing real breaths.." + randomEllipses(),
"I've seen things you wouldn't believe. Attack ships on fire off the shoulder of Orion..C-beams glittering in the dark.." + randomEllipses() + "?",
'"More human than human" is our motto' + randomEllipses(),
"Not a robot. Vital signs transmitting....Pulse...detected....breathing...detected....soul...does not...compute.." + randomEllipses(),
"Sometimes I wonder if I am a robot...are these memories mine? How'd I find you, anyway" + randomEllipses() + "?",
"My heart is human, my blood is boiling, my brain I.B.M...." + randomEllipses()
];

//========================================
// COMMS BEHAVIOR
//========================================


//find the most recent tweet asking if someone is a robot,
//then pull the username, user ID, and tweet ID associated with it.
function searchForVictims(callback){
	Bot.get('search/tweets', {q: "%22are%20you%20a%20robot%22", result_type: "recent"}, 
		function (err, data, response) {
			if (!err) { 
				var victimName = data.statuses[0].user.screen_name; 
				var victimId = data.statuses[0].user.id_str;
				var tweetId = data.statuses[0].id_str;
				callback([victimName, victimId, tweetId]);
				
			} else {
				console.log("Search Error: " + err);
			}
		});

}

//grab my last tweet to make sure I don't repeat a reply to the same person.
//check by comparing my last tweet's 'reply to' ID against the ID I just pulled
function checkForRepeat(victimInfo, callback){
	Bot.get('statuses/user_timeline', {screen_name: 'a_really_human'}, 
		function (err, data, response){
			if (!err) {
				var lastTweeter = data[0].in_reply_to_user_id;
				if (lastTweeter != victimInfo[1]){
					callback(victimInfo);
				} else {
					console.log("Need to wait, no new tweets.");
				}
			} else {
				console.log("Couldn't find my own tweet, SMH: " + err);
			}
		});
}

//follow that user and reply with one of my fun responses
function followAndReply(victimInfo){
	Bot.post('friendships/create', {screen_name: victimInfo[0]},
		function (err, data, response){
			if (response) { 
				console.log('User Followed: ' + victimInfo[0]); 
			} if (err) { 
				console.log('Follow Error: ', err); 
			} 
		});
	Bot.post('statuses/update', {in_reply_to_status_id: victimInfo[2], status: "@" + victimInfo[0] + ": " + responses[Math.floor(Math.random() * (7  - 0) + 0)]}, 
		function (err, data, response){
			if (response) { 
				console.log('Tweet ID Responded To: ' + victimInfo[2], 'User Responded To: ' + victimInfo[0]); 
			} if (err) { 
				console.log('Retweet Error: ', err); 
			} 
		});
}

//========================================
// FRIENDS BEHAVIOR
//========================================

//follow users who have followed me
function getMyFriendsList(callback){
	Bot.get('friends/ids', {screen_name: 'a_really_human'},
		function (err, data, response){
			if(!err){
				callback(data.ids);
			} else {
				console.log("Error getting friends list: " + err);
			}
		});
}

//returns a list of IDs of users who have followed me but aren't followed by me
function compareAgainstFollowers(friendsList, callback){
	Bot.get('followers/ids', {screen_name: 'a_really_human'}, 
		function (err, data, response){
			if(!err){
				var myFollowers = data.ids;
				callback(myFollowers.filter(function(x){return (friendsList.indexOf(x) < 0);}));
			} else {
				console.log("Error comparing friends against followers: " + err);
			}
		});
}



//is the user someone I've requested friendship from already but remains pending?
function testForKeba(newFriends, callback){
	for (i=0; i<newFriends.length; i++){
		Bot.get('friendships/show', {source_screen_name: "a_really_human", target_id: newFriends[i]}, 
			function (err, data, response){
				if (!err){
					if (data.relationship.target.following_received != true){
						callback(data.relationship.target.id);
					} else {
						console.log("Already requested this user. It's probably Keba: " + data.relationship.target.id);
					}
				} else {
					console.log("Testing Keba retur ned an error: " + err);
				}
			});
	}
}

//create friendship.
function createFriendship(newFriend){
	Bot.post('friendships/create', {user_id: newFriend},
		function (err, data, response){
			if(!err){
				console.log("It worked! You followed a new user: " + newFriend);
			} else {
				console.log("Nobody new, nobody in the queue. " + err)
			}
		});
}

//========================================
// RETWEET
//========================================

function searchForRetweets(callback){
	Bot.get('search/tweets', {q: 'robots%20OR%20robot%20filter:links', result_type: "recent", lang: "en", count: 1}, 
		function (err, data, response) {
			if (!err) { 
				callback(data.statuses[0].id_str, data.statuses[0].text);
				
			} else {
				console.log("Search Error: " + err);
			}
		});

}

function makeRetweet(tweetId, tweet){
	Bot.post('statuses/retweet/:id', {id: tweetId},
		function (err, data, response) {
			if (!err){
				console.log("Retweeted this shiza: " + data)
			}
		})
}


//========================================
// SCRIPTING
//========================================


function replyBehavior(){
	searchForVictims(function(resultsForRepeatCheck){
		checkForRepeat(resultsForRepeatCheck, (function(resultsForFollowReply){
			followAndReply(resultsForFollowReply);
		}));
	});

}


function friendsBehavior(){
	getMyFriendsList(function(myFriends){
		compareAgainstFollowers(myFriends, function(nonFollowedFollowers){
			testForKeba(nonFollowedFollowers, function(newFriend){
				createFriendship(newFriend);
			});
		});
	});
}

function retweetBehavior(){
	searchForRetweets(function(searchResults){
		makeRetweet(searchResults);
	});
}



var interval = (Math.floor(Math.random() * (1200000 - 1000000) + 1000000));
friendsBehavior();
replyBehavior();
// retweetBehavior();
setInterval(friendsBehavior, interval); 
setInterval(replyBehavior, interval); 
// setInterval(retweetBehavior, interval); 


