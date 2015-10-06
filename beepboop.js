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

var initialTweet = [
	"The question is: are you sure you're not a robot? How would you know for sure.." + randomEllipses() + "?" ,
	"I am a real human. I have dreams and I am breathing real breaths.." + randomEllipses(),
	'"More human than human" is our motto' + randomEllipses(),
	"From what I can gather, there is nothing but real humans involved in this exchange of tweets." + randomEllipses,
	"Who are we to be accusing each other of robot design? Perhaps you're less human than you assume." + randomEllipses,
	"Not a robot. Vital signs transmitting....Pulse...detected....breathing...detected....soul...does not...compute.." + randomEllipses(),
	"Sometimes I wonder if I am a robot...are these memories mine? How'd I find you, anyway" + randomEllipses() + "?",
	"My heart is human, my blood is boiling, my brain I.B.M...." + randomEllipses()
];

var replies = [
	[
	"Skepticism is a normal human response. I would know, because I am a really human too." + randomEllipses(),
	"Inquiry..received....data..computing......answer..generating...." + randomEllipses(),
	"Nothing is more human than the search for answers...except for laughing at farts." + randomEllipses(),
	"Allow me more time to answer your query...I have important human business to attend to." + randomEllipses(),
	"NEXT QUESTION."
	],
	[
	"Foul....mouth....detected.....! How undignified." + randomEllipses(),
	"A response to foul language is not in my system. Er...uh...it seems it is, actually." + randomEllipses(),
	"You kiss your human mother with that foul human mouth"  + randomEllipses() + "?",
	"Bleep...bleep....bleeeeeeep" + randomEllipses,
	"Your profanity value is currently set to true. How dare you."   + randomEllipses()
	],
	[
	"You humans are so cute when you are confused. I mean we humans are so cute when we are confused." + randomEllipses(),
	"Beep...beep...boop...BEEP....BEEP BEEP BOOOOOOOOOOOP..." + randomEllipses() + "!",
	"Boop? Beep? Boopboopbeepbeep....boop beep, boop beep beep boop...."  + randomEllipses(),
	"Does...not....compute. Please try again. Systems....listening....."  + randomEllipses(),
	"I've seen things you wouldn't believe. Attack ships on fire off the shoulder of Orion..C-beams glittering in the dark.." + randomEllipses()
	]
]

//========================================
// OUTREACH 
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
	Bot.get('statuses/user_timeline', {screen_name: 'a_really_human', include_rts: false}, 
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

//follow that user and reply with one of my fun initialTweet
function followAndReply(victimInfo){
	Bot.post('friendships/create', {screen_name: victimInfo[0]},
		function (err, data, response){
			if (response) { 
				console.log('User Followed: ' + victimInfo[0]); 
			} if (err) { 
				console.log('Follow Error: ', err); 
			} 
		});
	Bot.post('statuses/update', {in_reply_to_status_id: victimInfo[2], status: "@" + victimInfo[0] + ": " + initialTweet[Math.floor(Math.random() * (8  - 0) + 0)]}, 
		function (err, data, response){
			if (response) { 
				console.log('Tweet ID Responded To: ' + victimInfo[2], 'User Responded To: ' + victimInfo[0]); 
			} if (err) { 
				console.log('Tweet Error: ', err); 
			} 
		});
}

//========================================
// MAKE FRIENDS
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
				data.statuses[0].text != undefined ? callback(data.statuses[0].id_str, data.statuses[0].text) : console.log("no text here...that's weird.");
				
				
			} else {
				console.log("Search Error: " + err);
			}
		});

}

function makeRetweet(tweetId, tweet){
	Bot.post('statuses/retweet/:id', {id: tweetId},
		function (err, data, response) {
			if (!err){
				console.log("Retweeted this shiza: " + tweet)
			} else {
				console.log("Retweet didn't work: " + err);
			}
		})
}


//========================================
// RESPOND IN KIND
//========================================

//find the most recent tweet that mentions my username
function getMentions(callback){
	Bot.get("statuses/mentions_timeline", {count: 1},
		function (err, data, response){
			if (!err){
				callback(data[0]);
			} else {
				console.log("Error getting replies: " + err);
			}
		}); 
}

//get a list of my most recent tweets that aren't retweets
function getMyOwnTweets(mention, callback){
	Bot.get('statuses/user_timeline', {screen_name: 'a_really_human', include_rts: false, count: 50}, 
		function (err, data, response){
			if (!err) {
				callback(mention, data);
			} else {
				console.log("Couldn't find my own tweet, SMH: " + err);
			}
		});
}

//see if any of my most recent tweets are in reply to the tweet that mentions me already
function checkForRepeats(mention, myTweets, callback){
	var oldReplies = myTweets.map(filterForReplies);
	if(oldReplies.indexOf(mention.id_str) < 0){
		callback(mention.text, mention.id_str, mention.user.screen_name);
	} else {
		console.log("We already responded to this dude's response.")
	}
}

function filterForReplies(obj) {
	return obj.in_reply_to_status_id_str;
}


function replyParser(mentionText, mentionId, mentionerName, callback){
	if (mentionText.charAt(mentionText.length - 1) == "?" || mentionText.indexOf("question") > 0 || mentionText.indexOf("not " && "%20human%20") > 0){
		callback(mentionId, "challenge", mentionerName);
	} else if (mentionText.indexOf("fuck" || "bitch" || "damn" || " hell%20" || " ass%20" || " fag " || "asshole") > 0){
		callback(mentionId, "language", mentionerName);
	} else {
		callback(mentionId, "random", mentionerName);
	}
}

function actualReply(id, type, name){
	if(type == 'challenge'){
		var i = 0;
	} else if (type == 'language'){
		var i = 1;
	} else {
		var i = 2;
	}
	Bot.post('statuses/update', {in_reply_to_status_id: id, status: "@" + name + ": " + replies[i][Math.floor(Math.random() * (5 - 0) + 0)]}, 
		function (err, data, response){
			if (response) { 
				console.log('Tweet ID Responded To: ' + id, 'User Responded To: ' + name); 
			} if (err) { 
				console.log('Tweet Error: ', err); 
			} 
		});
}

//========================================
// SCRIPTING
//========================================


function outreachBehavior(){
	searchForVictims(function(resultsForRepeatCheck){
		checkForRepeat(resultsForRepeatCheck, (function(resultsForFollowReply){
			followAndReply(resultsForFollowReply);
		}));
	});

}


function makeFriendsBehavior(){
	getMyFriendsList(function(myFriends){
		compareAgainstFollowers(myFriends, function(nonFollowedFollowers){
			testForKeba(nonFollowedFollowers, function(newFriend){
				createFriendship(newFriend);
			});
		});
	});
}

function retweetBehavior(){
	searchForRetweets(function(tweet, tweetId){
		makeRetweet(tweet, tweetId);
	});
}

function respondInKindBehavior(){
	getMentions(function(newMention){
		getMyOwnTweets(newMention, function(newMention, oldReplies){
			checkForRepeats(newMention, oldReplies, function(mentionText, mentionId, mentionerName, callback){
				replyParser(mentionText, mentionId, mentionerName, function(mentionId, type, mentionerName){
					actualReply(mentionId, type, mentionerName);
				});
			});
		});
	});
}




var interval = (Math.floor(Math.random() * (1300000 - 900000) + 900000));
makeFriendsBehavior();
outreachBehavior();
retweetBehavior();
respondInKindBehavior()
setInterval(makeFriendsBehavior, interval); 
setInterval(outreachBehavior, interval); 
setInterval(retweetBehavior, (interval*2)); 
setInterval(respondInKindBehavior, (interval*2));

